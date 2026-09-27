import os
import uuid
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import SQLModel, Field, create_engine, Session, select, Relationship
import requests
from requests.auth import HTTPBasicAuth

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NASA Reviewer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's local dev, allow all to be safe against different localhosts
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/nasadb")
engine = create_engine(DATABASE_URL, echo=True)

class AnalysisResult(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="ticket.id")
    category: str
    confidence: int
    reason: str
    ticket: Optional["Ticket"] = Relationship(back_populates="analysis")

class Ticket(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    jira_id: str
    title: str
    description: str
    status: str
    is_processed: bool = Field(default=False)
    analysis: Optional[AnalysisResult] = Relationship(back_populates="ticket")

@app.on_event("startup")
def on_startup():
    try:
        SQLModel.metadata.create_all(engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Error connecting to database during startup: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to NASA Reviewer API"}

def get_session():
    with Session(engine) as session:
        yield session

@app.post("/api/sync")
def sync_jira_tickets(session: Session = Depends(get_session)):
    """Fetch tickets from Jira API and ingest them into Postgres"""
    jira_url = os.getenv("JIRA_URL")
    jira_user = os.getenv("JIRA_USERNAME")
    jira_token = os.getenv("JIRA_API_TOKEN")

    if not jira_url or not jira_user or not jira_token:
        raise HTTPException(status_code=400, detail="Jira credentials missing in .env")

    url = f"{jira_url.rstrip('/')}/rest/api/3/search/jql"
    payload = {
        "jql": "created >= -30d order by created DESC",
        "maxResults": 15,
        "fields": ["summary", "description", "status"]
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
            # In case the API returns ADF (Atlassian Document Format) despite asking for v2
            description = "Complex formatting omitted. See Jira for full description."
            
        status = fields.get("status", {}).get("name", "Unknown")
        
        existing = session.exec(select(Ticket).where(Ticket.jira_id == jira_id)).first()
        if not existing:
            new_ticket = Ticket(
                jira_id=jira_id,
                title=title,
                description=description[:500],
                status=status
            )
            session.add(new_ticket)
            count += 1
            
    session.commit()
    return {"status": "Sync completed successfully", "new_tickets_ingested": count}

@app.get("/api/tickets")
def get_tickets(session: Session = Depends(get_session)):
    """Fetch all tickets to display on the frontend"""
    tickets = session.exec(select(Ticket).order_by(Ticket.id.desc())).all()
    response = []
    for t in tickets:
        data = t.model_dump()
        data["analysis"] = t.analysis.model_dump() if t.analysis else None
        response.append(data)
    return response

@app.post("/api/process")
def process_tickets():
    """Trigger the LangGraph workflow to process unprocessed tickets"""
    # Import inside to avoid circular dependency
    from agent import app_graph
    
    result = app_graph.invoke({"tickets": [], "classifications": []})
    return {"status": "Processing completed", "tickets_processed": len(result.get("tickets", []))}
