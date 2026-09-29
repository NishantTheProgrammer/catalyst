import os
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
    sprint: str | None = Field(default="Unassigned")
    created_date: str = Field(default="")
    resolution_date: str | None = Field(default=None)
    is_processed: bool = Field(default=False)
    analysis: Optional[AnalysisResult] = Relationship(back_populates="ticket")
    quality: Optional["TicketQuality"] = Relationship(back_populates="ticket")

class AppSettings(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    jira_url: str = Field(default_factory=lambda: os.getenv("JIRA_URL", "https://your-domain.atlassian.net"))
    jira_username: str = Field(default_factory=lambda: os.getenv("JIRA_USERNAME", "your-email@domain.com"))
    jira_api_token: str = Field(default_factory=lambda: os.getenv("JIRA_API_TOKEN", ""))
    jira_selected_projects: str = Field(default="")
    jira_sync_limit: int = Field(default=30)
    jira_sync_days: int = Field(default=30)
    llm_provider: str = Field(default_factory=lambda: "openai" if os.getenv("OPENAI_API_KEY") else "ollama")
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    ollama_base_url: str = Field(default_factory=lambda: os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434"))
    ollama_model: str = Field(default_factory=lambda: os.getenv("OLLAMA_MODEL", "llama3.2:1b"))
