import os
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from constants import (
    DEFAULT_OPENAI_MODEL,
    DEFAULT_GEMINI_MODEL,
    DEFAULT_OLLAMA_BASE_URL,
    DEFAULT_OLLAMA_MODEL
)
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
    jira_url: str = Field(default_factory=lambda: os.getenv("JIRA_URL", ""))
    jira_username: str = Field(default_factory=lambda: os.getenv("JIRA_USERNAME", ""))
    jira_api_token: str = Field(default_factory=lambda: os.getenv("JIRA_API_TOKEN", ""))
    jira_selected_projects: str = Field(default="")
    jira_sync_limit: int = Field(default=30)
    jira_sync_days: int = Field(default=30)
    is_setup_complete: bool = Field(default=False)
    llm_provider: str = Field(default_factory=lambda: "gemini" if os.getenv("GEMINI_API_KEY") else ("openai" if os.getenv("OPENAI_API_KEY") else "ollama"))
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    openai_model: str = Field(default_factory=lambda: os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL))
    gemini_api_key: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    gemini_model: str = Field(default_factory=lambda: os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL))
    ollama_base_url: str = Field(default_factory=lambda: os.getenv("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL))
    ollama_model: str = Field(default_factory=lambda: os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL))
