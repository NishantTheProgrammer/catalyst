import os
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from constants import (
    DEFAULT_OPENAI_MODEL,
    DEFAULT_GEMINI_MODEL,
    DEFAULT_OLLAMA_BASE_URL,
    DEFAULT_OLLAMA_MODEL
)
from sqlalchemy import Column, JSON, text
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
    ai_agent_ready: bool = Field(default=False, sa_column_kwargs={"server_default": text("false")})
    
    ticket: Optional["Ticket"] = Relationship(back_populates="quality")

class Ticket(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    jira_id: str
    title: str
    description: str
    status: str
    priority: str = Field(default="Medium")
    issue_type: str = Field(default="Story")
    sprint: str | None = Field(default="Unassigned")
    sprint_id: int | None = Field(default=None)
    sprint_state: str | None = Field(default=None)
    sprint_start: str | None = Field(default=None)
    sprint_end: str | None = Field(default=None)
    created_date: str = Field(default="")
    resolution_date: str | None = Field(default=None)
    due_date: str | None = Field(default=None)
    parent_story_key: str | None = Field(default=None)
    comment_count: int = Field(default=0)
    comments_text: str = Field(default="")
    status_history: list = Field(default_factory=list, sa_column=Column(JSON))
    bounce_count: int = Field(default=0)
    timeline_deviation_days: int | None = Field(default=None)
    is_processed: bool = Field(default=False, sa_column_kwargs={"server_default": text("false")})
    analysis: Optional[AnalysisResult] = Relationship(back_populates="ticket")
    quality: Optional["TicketQuality"] = Relationship(back_populates="ticket")
    bug_analysis: Optional["BugAnalysis"] = Relationship(back_populates="ticket")

class BugAnalysis(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="ticket.id")
    severity: str = Field(default="P2-Medium", sa_column_kwargs={"server_default": text("'P2-Medium'")})
    root_cause_type: str = Field(default="Unknown", sa_column_kwargs={"server_default": text("'Unknown'")})
    is_reproducible: bool = Field(default=False, sa_column_kwargs={"server_default": text("false")})
    impact_summary: str = Field(default="", sa_column_kwargs={"server_default": text("''")})
    ticket: Optional["Ticket"] = Relationship(back_populates="bug_analysis")

class AppSettings(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    jira_url: str = Field(default_factory=lambda: os.getenv("JIRA_URL", ""))
    jira_username: str = Field(default_factory=lambda: os.getenv("JIRA_USERNAME", ""))
    jira_api_token: str = Field(default_factory=lambda: os.getenv("JIRA_API_TOKEN", ""))
    jira_selected_projects: str = Field(default="", sa_column_kwargs={"server_default": text("''")})
    jira_sync_limit: int = Field(default=30, sa_column_kwargs={"server_default": text("30")})
    jira_sync_days: int = Field(default=30, sa_column_kwargs={"server_default": text("30")})
    per_sprint_limit: int = Field(default=50, sa_column_kwargs={"server_default": text("50")})
    sprints_to_load: int = Field(default=3, sa_column_kwargs={"server_default": text("3")})
    sync_mode: str = Field(default="date_range", sa_column_kwargs={"server_default": text("'date_range'")})
    is_setup_complete: bool = Field(default=False, sa_column_kwargs={"server_default": text("false")})
    llm_provider: str = Field(default_factory=lambda: "gemini" if os.getenv("GEMINI_API_KEY") else ("openai" if os.getenv("OPENAI_API_KEY") else "ollama"))
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    openai_model: str = Field(default_factory=lambda: os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL))
    gemini_api_key: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    gemini_model: str = Field(default_factory=lambda: os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL))
    ollama_base_url: str = Field(default_factory=lambda: os.getenv("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL))
    ollama_model: str = Field(default_factory=lambda: os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL))
