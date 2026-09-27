import os
import uuid
from fastapi import FastAPI, Depends
from sqlmodel import SQLModel, Field, create_engine, Session, select

app = FastAPI(title="NASA Reviewer API")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/nasadb")
engine = create_engine(DATABASE_URL, echo=True)

class Ticket(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    jira_id: str
    title: str
    description: str
    status: str
    is_processed: bool = Field(default=False)

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
    """Mock endpoint to ingest tickets into Postgres"""
    # In a real scenario, this would use Jira MCP to fetch real tickets
    
    mock_tickets = [
        Ticket(jira_id=f"NASA-{uuid.uuid4().hex[:4].upper()}", title="Customer balance incorrect", description="The customer balance is showing incorrectly after the latest transaction.", status="Open"),
        Ticket(jira_id=f"NASA-{uuid.uuid4().hex[:4].upper()}", title="Wrong customer balance displayed", description="Intermittent issue where balance mismatches the backend.", status="Open"),
        Ticket(jira_id=f"NASA-{uuid.uuid4().hex[:4].upper()}", title="ETL pipeline failure in Payment module", description="Data transformation failed during nightly batch.", status="In Progress"),
        Ticket(jira_id=f"NASA-{uuid.uuid4().hex[:4].upper()}", title="Legacy API returning 500", description="Old checkout API is sporadically throwing errors.", status="Open"),
        Ticket(jira_id=f"NASA-{uuid.uuid4().hex[:4].upper()}", title="Button missing on checkout", description="The UI button for submitting payments is missing on Safari.", status="Open")
    ]
    
    count = 0
    for ticket in mock_tickets:
        existing = session.exec(select(Ticket).where(Ticket.title == ticket.title)).first()
        if not existing:
            session.add(ticket)
            count += 1
            
    session.commit()
    
    return {"status": "Sync completed successfully", "new_tickets_ingested": count}

@app.get("/api/tickets")
def get_tickets(session: Session = Depends(get_session)):
    """Fetch all tickets to display on the frontend"""
    tickets = session.exec(select(Ticket).order_by(Ticket.id.desc())).all()
    return tickets
