import os
from sqlmodel import Session, select
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List
import json
import re
from database import engine
from models import Ticket, AnalysisResult, ProjectSummary, TicketQuality, BugAnalysis
from prompts import CATEGORIZE_PROMPT_TEMPLATE, QUALITY_PROMPT_TEMPLATE, SUMMARY_PROMPT_HEADER, SUMMARY_PROMPT_FOOTER, BUG_ANALYSIS_PROMPT_TEMPLATE

class GraphState(TypedDict):
    tickets: List[Ticket]
    classifications: List[dict]
    qualities: List[dict]

from models import AppSettings
from constants import DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL, DEFAULT_GEMINI_MODEL, DEFAULT_OPENAI_MODEL

def get_llm():
    with Session(engine) as session:
        settings = session.exec(select(AppSettings).where(AppSettings.id == 1)).first()
        if not settings:
            return ChatOllama(base_url=DEFAULT_OLLAMA_BASE_URL, model=DEFAULT_OLLAMA_MODEL)
        
        if settings.llm_provider == "gemini" and settings.gemini_api_key:
            return ChatGoogleGenerativeAI(model=settings.gemini_model or DEFAULT_GEMINI_MODEL, api_key=settings.gemini_api_key)
        elif settings.llm_provider == "openai" and settings.openai_api_key:
            return ChatOpenAI(model=settings.openai_model or DEFAULT_OPENAI_MODEL, api_key=settings.openai_api_key)
        else:
            return ChatOllama(base_url=settings.ollama_base_url or DEFAULT_OLLAMA_BASE_URL, model=settings.ollama_model or DEFAULT_OLLAMA_MODEL)

def fetch_unprocessed(state: GraphState):
    with Session(engine) as session:
        unprocessed = session.exec(select(Ticket).where(Ticket.is_processed == False).order_by(Ticket.id.desc())).all()
        return {"tickets": unprocessed}

def analyze_tickets(state: GraphState):
    tickets = state.get("tickets", [])
    if not tickets:
        return {"classifications": [], "qualities": []}
    
    classifications = []
    qualities = []
    
    with Session(engine) as session:
        for ticket in tickets:
            if ticket.issue_type == "Epic":
                db_ticket = session.get(Ticket, ticket.id)
                if db_ticket:
                    db_ticket.is_processed = True
                    session.add(db_ticket)
                session.commit()
                continue

            # --- 1. Classify Defect ---
            try:
                prompt1 = CATEGORIZE_PROMPT_TEMPLATE.format(title=ticket.title, description=ticket.description)
                response1 = get_llm().invoke([HumanMessage(content=prompt1)])
                import re
                content1 = response1.content if isinstance(response1.content, str) else ''.join(p.get('text', '') if isinstance(p, dict) else str(p) for p in response1.content)
                match = re.search(r'\{.*\}', content1, re.DOTALL)
                clean_json = match.group(0) if match else content1.strip('`').replace('json\n', '').strip()
                res_data1 = json.loads(clean_json)
                
                category = res_data1.get("category", "Unknown")
                valid_categories = ["Code", "Data", "Configuration", "Documentation", "Requirement", "Legacy"]
                if category not in valid_categories:
                    if "code" in category.lower(): category = "Code"
                    elif "data" in category.lower(): category = "Data"
                    elif "config" in category.lower(): category = "Configuration"
                    elif "doc" in category.lower(): category = "Documentation"
                    elif "req" in category.lower(): category = "Requirement"
                    elif "legacy" in category.lower(): category = "Legacy"
                    else: category = "Code"
                
                confidence = res_data1.get("confidence", 0)
                reason = res_data1.get("reason", "")
            except Exception as e:
                print(f"LLM Classification Error: {e}")
                category = "Data" if "ETL" in ticket.title else "Code"
                if "legacy" in ticket.title.lower(): category = "Legacy"
                confidence = 85
                reason = "AI fallback: Mapped based on keyword heuristics."
                
            class_result = {"ticket_id": ticket.id, "category": category, "confidence": confidence, "reason": reason}
            classifications.append(class_result)
            
            analysis = AnalysisResult(**class_result)
            session.add(analysis)
            
            # --- 2. Assess Quality ---
            # --- 2. Assess Quality ---
            try:
                prompt2 = QUALITY_PROMPT_TEMPLATE.format(title=ticket.title, description=ticket.description)
                response2 = get_llm().invoke([HumanMessage(content=prompt2)])
                import re
                content2 = response2.content if isinstance(response2.content, str) else ''.join(p.get('text', '') if isinstance(p, dict) else str(p) for p in response2.content)
                match2 = re.search(r'\{.*\}', content2, re.DOTALL)
                clean_json2 = match2.group(0) if match2 else content2.strip('`').replace('json\n', '').strip()
                
                clean_json2 = re.sub(r',\s*\}', '}', clean_json2)
                try:
                    res_flat = json.loads(clean_json2)
                except Exception as json_err:
                    print(f"JSON Parse Error, falling back to regex: {json_err}")
                    res_flat = {}
                    score_match = re.search(r'"qualityScore"\s*:\s*(\d+)', clean_json2)
                    if score_match: res_flat["qualityScore"] = int(score_match.group(1))
                    
                    level_match = re.search(r'"qualityLevel"\s*:\s*"([^"]+)"', clean_json2)
                    if level_match: res_flat["qualityLevel"] = level_match.group(1)
                    
                    for key in ["clarityScore", "completenessScore", "contextScore", "reproducibilityScore", "dependenciesScore"]:
                        m = re.search(fr'"{key}"\s*:\s*(\d+)', clean_json2)
                        if m: res_flat[key] = int(m.group(1))
                        
                    for key in ["readiness", "missingInformation", "recommendation"]:
                        m = re.search(fr'"{key}"\s*:\s*"([^"]+)"', clean_json2)
                        if m: res_flat[key] = m.group(1)
                        
                # Just in case it still outputs a number for missingInformation
                missing_info = str(res_flat.get("missingInformation", res_flat.get("gap", "Missing context")))
                if missing_info.isdigit() or len(missing_info) < 4:
                    missing_info = "Details are incomplete or ambiguous."
                        
                # Calculate Total Score Dynamically to prevent AI math hallucinations
                clarity_score = res_flat.get("clarityScore", 15)
                completeness_score = res_flat.get("completenessScore", 15)
                context_score = res_flat.get("contextScore", 15)
                reproducibility_score = res_flat.get("reproducibilityScore", 15)
                dependencies_score = res_flat.get("dependenciesScore", 15)
                
                total_score = clarity_score + completeness_score + context_score + reproducibility_score + dependencies_score
                
                # Derive quality level based on mathematically correct total score
                if total_score >= 80:
                    calculated_level = "Good"
                elif total_score >= 60:
                    calculated_level = "Fair"
                else:
                    calculated_level = "Poor"
                        
                res_data2 = {
                    "qualityScore": total_score,
                    "qualityLevel": calculated_level,
                    "implementationReadiness": res_flat.get("readiness", "Needs Clarification"),
                    "criteriaScores": {
                        "clarity": {"score": clarity_score, "maxScore": 20, "reason": res_flat.get("clarityReason", "")},
                        "completeness": {"score": completeness_score, "maxScore": 20, "reason": res_flat.get("completenessReason", "")},
                        "context": {"score": context_score, "maxScore": 20, "reason": res_flat.get("contextReason", "")},
                        "reproducibility": {"score": reproducibility_score, "maxScore": 20, "reason": res_flat.get("reproducibilityReason", "")},
                        "dependencies": {"score": dependencies_score, "maxScore": 20, "reason": res_flat.get("dependenciesReason", "")}
                    },
                    "gaps": [{"issue": missing_info, "why": "", "suggestion": "", "priority": "High"}],
                    "recommendations": [res_flat.get("recommendation", "Refine description")],
                    "aiAgentReady": res_flat.get("aiReady", False)
                }
            except Exception as e:
                print(f"Quality LLM Error: {e}")
                res_data2 = {
                    "qualityScore": 65, "qualityLevel": "Fair", "implementationReadiness": "Needs Clarification",
                    "criteriaScores": {},
                    "gaps": [{"issue": "Parsing Error", "why": str(e), "suggestion": "N/A", "priority": "Medium"}],
                    "recommendations": ["Fallback invoked"],
                    "aiAgentReady": False
                }
                
            qual = TicketQuality(
                ticket_id=ticket.id,
                quality_score=res_data2.get("qualityScore", 65),
                quality_level=res_data2.get("qualityLevel", "Fair"),
                implementation_readiness=res_data2.get("implementationReadiness", "Needs Clarification"),
                criteria_scores=res_data2.get("criteriaScores", {}),
                gaps=res_data2.get("gaps", []),
                recommendations=res_data2.get("recommendations", []),
                ai_agent_ready=res_data2.get("aiAgentReady", False)
            )
            session.add(qual)

            if ticket.issue_type == "Bug":
                try:
                    prompt_bug = BUG_ANALYSIS_PROMPT_TEMPLATE.format(
                        title=ticket.title, description=ticket.description
                    )
                    response_bug = get_llm().invoke([HumanMessage(content=prompt_bug)])
                    content_bug = response_bug.content if isinstance(response_bug.content, str) else ''.join(p.get('text', '') if isinstance(p, dict) else str(p) for p in response_bug.content)
                    match_bug = re.search(r'\{.*\}', content_bug, re.DOTALL)
                    clean_bug = match_bug.group(0) if match_bug else content_bug.strip('`').replace('json\n', '').strip()
                    bug_data = json.loads(clean_bug)
                    valid_severities = ["P0-Critical", "P1-High", "P2-Medium", "P3-Low"]
                    valid_causes = ["Regression", "New Feature", "Environment", "Data", "Unknown"]
                    if bug_data.get("severity") not in valid_severities:
                        bug_data["severity"] = "P2-Medium"
                    if bug_data.get("root_cause_type") not in valid_causes:
                        bug_data["root_cause_type"] = "Unknown"
                except Exception as e:
                    print(f"Bug Analysis Error: {e}")
                    bug_data = {
                        "severity": "P2-Medium",
                        "root_cause_type": "Unknown",
                        "is_reproducible": False,
                        "impact_summary": "Could not determine impact automatically."
                    }
                bug_result = BugAnalysis(
                    ticket_id=ticket.id,
                    severity=bug_data.get("severity", "P2-Medium"),
                    root_cause_type=bug_data.get("root_cause_type", "Unknown"),
                    is_reproducible=bool(bug_data.get("is_reproducible", False)),
                    impact_summary=str(bug_data.get("impact_summary", ""))
                )
                session.add(bug_result)

            qualities.append(res_data2)
            
            # --- 3. Mark processed & Commit IMMEDIATELY to UI ---
            db_ticket = session.get(Ticket, ticket.id)
            if db_ticket:
                db_ticket.is_processed = True
                session.add(db_ticket)
                
            session.commit()
            
    return {"classifications": classifications, "qualities": qualities}

def generate_project_summary(tickets_data: list[tuple[str, str]]) -> tuple[str, str]:
    """Generates an AI project summary from ticket titles and categories."""
    summary_prompt = SUMMARY_PROMPT_HEADER
    
    # Optimize by providing category aggregates and sampling a max of 20 recent tickets
    from collections import Counter
    category_counts = Counter([cat for _, cat in tickets_data])
    
    summary_prompt += f"Total Tickets: {len(tickets_data)}\n"
    summary_prompt += "Ticket Category Breakdown:\n"
    for cat, count in category_counts.items():
        summary_prompt += f"- {cat}: {count} tickets\n"
        
    summary_prompt += "\nSample of Recent Tickets:\n"
    for title, cat in tickets_data[-20:]:
        summary_prompt += f"Ticket: {title}, AI Category: {cat}\n"
    
    summary_prompt += SUMMARY_PROMPT_FOOTER
    
    try:
        response = get_llm().invoke([HumanMessage(content=summary_prompt)])
        content = response.content if isinstance(response.content, str) else ''.join(p.get('text', '') if isinstance(p, dict) else str(p) for p in response.content)
        content = content.strip()
        
        status = "Watch"
        text = content
        
        if "---" in content:
            parts = content.split("---", 1)
            header_part = parts[0].strip()
            text = parts[1].strip()
            
            import re
            status_match = re.search(r'STATUS:\s*(Stable|At Risk|Critical)', header_part, re.IGNORECASE)
            if status_match:
                status = status_match.group(1).title()
        
    except Exception as e:
        print(f"Summary Error: {e}")
        status = "Watch"
        text = "AI fallback summary: Several defects detected, further investigation recommended."
        
    return status, text

def update_db(state: GraphState):
    tickets = state.get("tickets", [])
    classifications = state.get("classifications", [])
    if not classifications:
        return {"tickets": []}
        
    tickets_data = [(t.title, c.get('category')) for t, c in zip(tickets, classifications)]
    status, text = generate_project_summary(tickets_data)
        
    with Session(engine) as session:
        summary = ProjectSummary(overall_status=status, summary_text=text)
        session.add(summary)
        session.commit()
        
    return {"tickets": tickets}

# Build LangGraph workflow
workflow = StateGraph(GraphState)
workflow.add_node("fetch_unprocessed", fetch_unprocessed)
workflow.add_node("analyze_tickets", analyze_tickets)
workflow.add_node("update_db", update_db)

workflow.add_edge(START, "fetch_unprocessed")
workflow.add_edge("fetch_unprocessed", "analyze_tickets")
workflow.add_edge("analyze_tickets", "update_db")
workflow.add_edge("update_db", END)

app_graph = workflow.compile()
