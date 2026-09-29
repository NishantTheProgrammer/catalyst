from fastapi import APIRouter, BackgroundTasks

router = APIRouter(prefix="/api")

def run_agent_workflow():
    from agent import app_graph
    try:
        app_graph.invoke({"tickets": [], "classifications": []})
    except Exception as e:
        print(f"Workflow error: {e}")

@router.post("/process")
def process_tickets(background_tasks: BackgroundTasks):
    """Trigger the LangGraph workflow in the background to avoid timeouts"""
    background_tasks.add_task(run_agent_workflow)
    return {"status": "Processing started in background"}

def run_summary_refresh():
    from agent import llm
    from models import Ticket, ProjectSummary, AnalysisResult
    from sqlmodel import Session, select
    from database import engine
    from langchain_core.messages import HumanMessage
    import json
    
    with Session(engine) as session:
        tickets = session.exec(select(Ticket).where(Ticket.is_processed == True)).all()
        if not tickets:
            return
            
        summary_prompt = """You are an expert Agile Project Manager and AI Analyst. Based on the following Jira tickets and their AI classifications, write a high-level, executive project health summary. 

DO NOT just list the tickets. Instead, synthesize the data into insightful observations:
1. **Current State & Trends:** Group similar issues (e.g., "Multiple deployment updates required").
2. **Key Risks:** Identify systemic issues, data gaps, or critical bugs.
3. **Strategic Recommendations:** Actionable next steps to improve project health.

Use beautiful, professional rich markdown formatting (with **bolding** for emphasis, bullet points, and appropriate emojis). 

VERY IMPORTANT: You must output strictly valid JSON. Escape all newlines in your markdown strictly as '\\n'.
Your output MUST be a single JSON object with EXACTLY these two keys:
{
  "overall_status": "Stable",
  "summary_text": "# Executive Summary\\n\\nYour markdown here..."
}

Data:
"""
        for t in tickets:
            cat = t.analysis.category if t.analysis else "Unknown"
            summary_prompt += f"Ticket: {t.title}, AI Category: {cat}\n"
        
        summary_prompt += "\nReply in strictly JSON format: {\"overall_status\": \"...\", \"summary_text\": \"...\"}"
        
        try:
            response = llm.invoke([HumanMessage(content=summary_prompt)])
            import re
            match = re.search(r'\{.*?\}', response.content, re.DOTALL)
            clean_json = match.group(0) if match else response.content.strip('`').replace('json\n', '').strip()
            
            try:
                res_data = json.loads(clean_json)
                status = res_data.get("overall_status", "Watch")
                text = res_data.get("summary_text") or res_data.get("project_health_summary", "Failed to generate summary.")
            except json.JSONDecodeError:
                # Fallback to regex extraction
                status_match = re.search(r'"?overall_status"?\s*:\s*"?([^",\}]+)"?', response.content)
                text_match = re.search(r'"?(summary_text|project_health_summary)"?\s*:\s*"?([\s\S]+?)"?\}?\s*$', response.content)
                
                status = status_match.group(1).strip() if status_match else "Watch"
                if text_match:
                    text = text_match.group(2).strip()
                    if text.endswith('}'): text = text[:-1].strip()
                    if text.endswith('"'): text = text[:-1].strip()
                else:
                    text = response.content.replace('"', '').strip()
                
        except Exception as e:
            print(f"Summary Error: {e}")
            status = "Watch"
            text = "AI fallback summary: Several defects detected, further investigation recommended."
            
        summary = ProjectSummary(overall_status=status, summary_text=text)
        session.add(summary)
        session.commit()

@router.post("/summary/refresh")
def refresh_summary():
    """Regenerate the project summary based on all currently processed tickets"""
    run_summary_refresh()
    return {"status": "Summary refresh completed"}
