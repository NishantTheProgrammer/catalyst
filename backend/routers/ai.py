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
    from agent import generate_project_summary
    from models import Ticket, ProjectSummary
    from sqlmodel import Session, select
    from database import engine
    
    with Session(engine) as session:
        tickets = session.exec(select(Ticket).where(Ticket.is_processed == True)).all()
        if not tickets:
            return
            
        tickets_data = [(t.title, t.analysis.category if t.analysis else "Unknown") for t in tickets]
        status, text = generate_project_summary(tickets_data)
            
        summary = ProjectSummary(overall_status=status, summary_text=text)
        session.add(summary)
        session.commit()

@router.post("/summary/refresh")
def refresh_summary():
    """Regenerate the project summary based on all currently processed tickets"""
    run_summary_refresh()
    return {"status": "Summary refresh completed"}
