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
def sync_jira_tickets(max_results: int = 15, days_back: int = 30, session: Session = Depends(get_session)):
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

    sync_days = days_back
    sync_limit = max_results

    payload = {
        "jql": f"{project_filter}issuetype in (Epic, Story, Bug) AND created >= -{sync_days}d order by created DESC",
        "maxResults": sync_limit,
        "fields": ["summary", "description", "status", "priority", "issuetype", "created", "resolutiondate", "customfield_10020"]
    }
    auth = HTTPBasicAuth(jira_user, jira_token)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    
    try:
        response = requests.post(url, headers=headers, json=payload, auth=auth, timeout=10)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to fetch from Jira: {response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
        
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
                resolution_date=resolution_date
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
