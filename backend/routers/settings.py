from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import AppSettings

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("")
def get_settings(session: Session = Depends(get_session)):
    settings = session.exec(select(AppSettings).where(AppSettings.id == 1)).first()
    if not settings:
        settings = AppSettings(id=1)
        session.add(settings)
        session.commit()
        session.refresh(settings)
    
    # Mask sensitive data before returning to frontend
    data = settings.dict()
    if data.get("jira_api_token"):
        data["jira_api_token"] = "********"
    if data.get("openai_api_key"):
        data["openai_api_key"] = "********"
        
    return data

@router.post("")
def update_settings(updates: dict, session: Session = Depends(get_session)):
    settings = session.exec(select(AppSettings).where(AppSettings.id == 1)).first()
    if not settings:
        settings = AppSettings(id=1)
        session.add(settings)
    
    # Update fields carefully, avoiding overwriting with placeholder mask
    if "jira_url" in updates: settings.jira_url = updates["jira_url"]
    if "jira_username" in updates: settings.jira_username = updates["jira_username"]
    if "llm_provider" in updates: settings.llm_provider = updates["llm_provider"]
    if "ollama_base_url" in updates: settings.ollama_base_url = updates["ollama_base_url"]
    if "ollama_model" in updates: settings.ollama_model = updates["ollama_model"]
    
    if updates.get("jira_api_token") and updates["jira_api_token"] != "********":
        settings.jira_api_token = updates["jira_api_token"]
        
    if updates.get("openAiKey") and updates["openAiKey"] != "********":
        settings.openai_api_key = updates["openAiKey"]
    # Handle the fact that frontend currently sends 'openAiKey' instead of 'openai_api_key'
    elif updates.get("openai_api_key") and updates["openai_api_key"] != "********":
        settings.openai_api_key = updates["openai_api_key"]

    session.add(settings)
    session.commit()
    session.refresh(settings)
    
    return {"status": "success"}
