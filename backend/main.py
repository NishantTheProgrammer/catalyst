import os
from fastapi import FastAPI
from sqlmodel import SQLModel, Field, create_engine

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

@app.post("/api/sync")
def sync_jira_tickets():
    """Mock endpoint to ingest tickets into Postgres"""
    # In a real scenario, this would trigger an async task to fetch from Jira
    return {"status": "Sync triggered successfully"}
