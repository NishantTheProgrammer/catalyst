from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    history: Optional[List[Message]] = []

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
        from crud import get_tickets_eager
        tickets = get_tickets_eager(session, processed_only=True)
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

from fastapi.responses import StreamingResponse

@router.post("/chat")
def chat(request: ChatRequest):
    """Query the RAG pipeline for insights on the current tickets using streaming"""
    from rag import stream_rag
    return StreamingResponse(stream_rag(request.query, request.history), media_type="text/plain")
