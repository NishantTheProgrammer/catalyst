import os
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
import requests
from requests.auth import HTTPBasicAuth
from database import get_session
from models import Ticket, ProjectSummary, AppSettings

router = APIRouter(prefix="/api")

def extract_adf_text(adf_node):
    """Recursively extract plain text from Atlassian Document Format"""
    if not isinstance(adf_node, dict):
        return ""
    text = ""
    if adf_node.get("type") == "text":
        text += adf_node.get("text", "")
    for child in adf_node.get("content", []):
        text += extract_adf_text(child) + " "
    return text.strip()

@router.post("/sync")
def sync_jira_tickets(max_results: int | None = None, days_back: int | None = None, session: Session = Depends(get_session)):
    """Fetch tickets from Jira API and ingest them into database"""
    settings = session.exec(select(AppSettings).where(AppSettings.id == 1)).first()
    
    jira_url = settings.jira_url if settings else os.getenv("JIRA_URL")
    jira_user = settings.jira_username if settings else os.getenv("JIRA_USERNAME")
    jira_token = settings.jira_api_token if settings else os.getenv("JIRA_API_TOKEN")

    if not jira_url or not jira_user or not jira_token:
        raise HTTPException(status_code=400, detail="Jira credentials missing")

    url = f"{jira_url.rstrip('/')}/rest/api/3/search/jql"
    
    selected_projects = settings.jira_selected_projects if settings else ""
    project_filter = ""
    if selected_projects:
        projects_list = [p.strip() for p in selected_projects.split(",")]
        project_str = ", ".join([f'"{p}"' for p in projects_list])
        project_filter = f"project IN ({project_str}) AND "

    sync_limit = max_results if max_results is not None else (settings.jira_sync_limit if settings else 30)
    sync_days = days_back if days_back is not None else (settings.jira_sync_days if settings else 30)
    sync_mode = settings.sync_mode if settings and hasattr(settings, 'sync_mode') else "date_range"
    sprints_to_load = settings.sprints_to_load if settings and hasattr(settings, 'sprints_to_load') else 3
    per_sprint_limit = settings.per_sprint_limit if settings and hasattr(settings, 'per_sprint_limit') else 50

    # per_sprint_limit overrides sync_limit when a sprint-aware mode is selected
    if sync_mode in ("active_only", "last_n_sprints"):
        sync_limit = per_sprint_limit

    if sync_mode == "active_only":
        jql = f"{project_filter}issuetype in (Epic, Story, Bug) AND sprint in openSprints() ORDER BY created DESC"
    elif sync_mode == "last_n_sprints":
        # Each sprint is ~2 weeks. Use sprints_to_load * 14 days as the time window.
        sprint_days = sprints_to_load * 14
        jql = f"{project_filter}issuetype in (Epic, Story, Bug) AND (sprint in openSprints() OR sprint in closedSprints()) AND created >= -{sprint_days}d ORDER BY created DESC"
    else:
        # date_range mode — use days_back as-is (original behaviour)
        jql = f"{project_filter}issuetype in (Epic, Story, Bug) AND created >= -{sync_days}d ORDER BY created DESC"

    payload = {
        "jql": jql,
        "maxResults": sync_limit,
        "fields": ["summary", "description", "status", "priority", "issuetype", "created", "resolutiondate", "customfield_10020", "duedate", "comment", "issuelinks", "parent"],
        "expand": "changelog"
    }
    auth = HTTPBasicAuth(jira_user, jira_token)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    
    try:
        response = requests.post(url, headers=headers, json=payload, auth=auth, timeout=10)
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error reaching Jira: {str(e)}")

    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=f"Jira API returned {response.status_code}. JQL: [{jql}] | Response: {response.text[:800]}"
        )
        
    data = response.json()
    issues = data.get("issues", [])
    
    count = 0
    for issue in issues:
        jira_id = issue["key"]
        fields = issue.get("fields", {})
        title = fields.get("summary", "")
        description = fields.get("description") or "No description provided."
        
        if isinstance(description, dict):
            description = extract_adf_text(description)
            if not description:
                description = "No readable description found."
        
        description = re.sub(r'h[1-6]\.\s*', '', description)
            
        status = fields.get("status", {}).get("name", "Unknown")
        priority = fields.get("priority", {}).get("name", "Medium") if fields.get("priority") else "Medium"
        raw_type = fields.get("issuetype", {}).get("name", "Story")
        issue_type = raw_type if raw_type in ("Epic", "Story", "Bug") else "Story"
        created_date = fields.get("created", "")
        resolution_date = fields.get("resolutiondate")

        # Due date
        due_date = fields.get("duedate")

        # Parent story key (for bugs linked to stories)
        parent_story_key = None
        parent_field = fields.get("parent")
        if parent_field:
            parent_story_key = parent_field.get("key")
        # Also check issuelinks for "is subtask of" or "relates to" story type
        if not parent_story_key:
            for link in fields.get("issuelinks", []) or []:
                inward = link.get("inwardIssue", {})
                outward = link.get("outwardIssue", {})
                linked = inward if inward else outward
                if linked and linked.get("fields", {}).get("issuetype", {}).get("name") == "Story":
                    parent_story_key = linked.get("key")
                    break

        # Comments
        comment_data = fields.get("comment", {}) or {}
        comments_list = comment_data.get("comments", [])
        comment_count = len(comments_list)
        # Combine last 5 comments into a single text blob for AI context
        comments_text = " | ".join([
            c.get("body", "") if isinstance(c.get("body"), str)
            else extract_adf_text(c.get("body", {}))
            for c in comments_list[-5:]
        ])

        # Status history and bounce count from changelog
        status_history = []
        bounce_count = 0
        changelog = issue.get("changelog", {})
        for history in changelog.get("histories", []):
            changed_at = history.get("created", "")
            for item in history.get("items", []):
                if item.get("field") == "status":
                    from_status = item.get("fromString", "")
                    to_status = item.get("toString", "")
                    status_history.append({
                        "from": from_status,
                        "to": to_status,
                        "at": changed_at
                    })
                    # Count bounces: any backward transition (QA/Testing → Dev/In Progress)
                    qa_stages = ["qa", "testing", "in qa", "in review", "review"]
                    dev_stages = ["in progress", "development", "in development", "dev"]
                    if (any(s in to_status.lower() for s in dev_stages) and
                        any(s in from_status.lower() for s in qa_stages)):
                        bounce_count += 1

        # Timeline deviation in days
        timeline_deviation_days = None
        if due_date:
            try:
                from datetime import datetime, timezone
                due_dt = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
                if resolution_date:
                    res_dt = datetime.fromisoformat(resolution_date.replace("Z", "+00:00"))
                    timeline_deviation_days = (res_dt - due_dt).days
                else:
                    now_dt = datetime.now(timezone.utc)
                    timeline_deviation_days = (now_dt - due_dt).days
            except Exception:
                pass
        
        sprint_field = fields.get("customfield_10020") or []
        sprint_name = "Backlog"
        sprint_id = None
        sprint_state = None
        sprint_start = None
        sprint_end = None
        if sprint_field and isinstance(sprint_field, list):
            raw = sprint_field[-1]
            if isinstance(raw, dict):
                sprint_name = raw.get("name", "Backlog")
                sprint_id = raw.get("id")
                sprint_state = raw.get("state")
                sprint_start = raw.get("startDate")
                sprint_end = raw.get("endDate")
            elif isinstance(raw, str):
                import re as _re
                m = _re.search(r'name=([^,\]]+)', raw)
                sprint_name = m.group(1).strip() if m else "Backlog"
        
        existing = session.exec(select(Ticket).where(Ticket.jira_id == jira_id)).first()
        if not existing:
            new_ticket = Ticket(
                jira_id=jira_id,
                title=title,
                description=description[:500],
                status=status,
                priority=priority,
                issue_type=issue_type,
                sprint=sprint_name,
                sprint_id=sprint_id,
                sprint_state=sprint_state,
                sprint_start=sprint_start,
                sprint_end=sprint_end,
                created_date=created_date,
                resolution_date=resolution_date,
                due_date=due_date,
                parent_story_key=parent_story_key,
                comment_count=comment_count,
                comments_text=comments_text[:1000],
                status_history=status_history,
                bounce_count=bounce_count,
                timeline_deviation_days=timeline_deviation_days,
            )
            session.add(new_ticket)
            count += 1
            
    session.commit()
    return {"status": "Sync completed successfully", "new_tickets_ingested": count}

@router.get("/summary")
def get_summary(session: Session = Depends(get_session)):
    summary = session.exec(select(ProjectSummary).order_by(ProjectSummary.id.desc())).first()
    return summary.model_dump() if summary else {"overall_status": "Unknown", "summary_text": "No summary generated yet."}

@router.get("/tickets")
def get_tickets(session: Session = Depends(get_session)):
    """Fetch all tickets to display on the frontend"""
    tickets = session.exec(select(Ticket).order_by(Ticket.id.desc())).all()
    jira_base = os.getenv("JIRA_URL", "https://jira.com").rstrip('/')
    
    response = []
    for t in tickets:
        data = t.model_dump()
        data["analysis"] = t.analysis.model_dump() if t.analysis else None
        data["quality"] = t.quality.model_dump() if t.quality else None
        data["bug_analysis"] = t.bug_analysis.model_dump() if t.bug_analysis else None
        data["link"] = f"{jira_base}/browse/{t.jira_id}"
        response.append(data)
    return response
