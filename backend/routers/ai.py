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
