from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

class AnalysisResult(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="ticket.id")
    category: str
    confidence: int
    reason: str
    ticket: Optional["Ticket"] = Relationship(back_populates="analysis")

class ProjectSummary(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    overall_status: str
    summary_text: str

class TicketQuality(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="ticket.id")
    quality_score: int
    quality_level: str
    implementation_readiness: str
    criteria_scores: dict = Field(default_factory=dict, sa_column=Column(JSON))
    gaps: list = Field(default_factory=list, sa_column=Column(JSON))
    recommendations: list = Field(default_factory=list, sa_column=Column(JSON))
    ai_agent_ready: bool
    
    ticket: Optional["Ticket"] = Relationship(back_populates="quality")

class Ticket(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    jira_id: str
    title: str
    description: str
    status: str
    priority: str = Field(default="Medium")
    created_date: str = Field(default="")
    resolution_date: str | None = Field(default=None)
    is_processed: bool = Field(default=False)
    analysis: Optional[AnalysisResult] = Relationship(back_populates="ticket")
    quality: Optional["TicketQuality"] = Relationship(back_populates="ticket")
