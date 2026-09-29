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
    if "jira_selected_projects" in updates: settings.jira_selected_projects = updates["jira_selected_projects"]
    if "jira_sync_limit" in updates: settings.jira_sync_limit = updates["jira_sync_limit"]
    if "jira_sync_days" in updates: settings.jira_sync_days = updates["jira_sync_days"]
    
    if updates.get("jira_api_token") and updates["jira_api_token"] != "********":
        settings.jira_api_token = updates["jira_api_token"]
        
    if updates.get("openAiKey") and updates["openAiKey"] != "********":
        settings.openai_api_key = updates["openAiKey"]
    # Handle the fact that frontend currently sends 'openAiKey' instead of 'openai_api_key'
    elif updates.get("openai_api_key") and updates["openai_api_key"] != "********":
        settings.openai_api_key = updates["openai_api_key"]

    settings.is_setup_complete = True

    session.add(settings)
    session.commit()
    session.refresh(settings)
    
    return {"status": "success"}

import requests
from requests.auth import HTTPBasicAuth
from fastapi import HTTPException
from pydantic import BaseModel

class JiraTestRequest(BaseModel):
    jira_url: str
    jira_username: str
    jira_api_token: str

@router.post("/jira/test")
def test_jira_connection(req: JiraTestRequest, session: Session = Depends(get_session)):
    if not req.jira_url or not req.jira_username or not req.jira_api_token:
        raise HTTPException(status_code=400, detail="Jira credentials missing")
    
    token = req.jira_api_token
    if token == "********":
        settings = session.exec(select(AppSettings).where(AppSettings.id == 1)).first()
        if settings and settings.jira_api_token:
            token = settings.jira_api_token
        else:
            raise HTTPException(status_code=400, detail="Real API token not found in database. Please re-enter it.")
            
    myself_url = f"{req.jira_url.rstrip('/')}/rest/api/3/myself"
    projects_url = f"{req.jira_url.rstrip('/')}/rest/api/3/project"
    auth = HTTPBasicAuth(req.jira_username, token)
    headers = {"Accept": "application/json"}
    
    try:
        # First verify authentication is actually valid (not falling back to anonymous)
        me_res = requests.get(myself_url, headers=headers, auth=auth, timeout=10)
        if me_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Authentication failed. Please check your username and API token.")
            
        # Then get projects
        response = requests.get(projects_url, headers=headers, auth=auth, timeout=10)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to fetch projects: {response.status_code}")
        
        projects = response.json()
        return {
            "status": "success",
            "projects": [{"key": p["key"], "name": p["name"]} for p in projects]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")

class LLMTestRequest(BaseModel):
    llm_provider: str
    openai_api_key: str = ""
    ollama_base_url: str = ""
    ollama_model: str = ""

@router.post("/llm/test")
def test_llm_connection(req: LLMTestRequest, session: Session = Depends(get_session)):
    if req.llm_provider == "openai":
        token = req.openai_api_key
        if token == "********":
            settings = session.exec(select(AppSettings).where(AppSettings.id == 1)).first()
            if settings and settings.openai_api_key:
                token = settings.openai_api_key
            else:
                raise HTTPException(status_code=400, detail="OpenAI API key not found. Please re-enter it.")
        
        try:
            response = requests.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10
            )
            if response.status_code == 200:
                return {"status": "success", "message": "Successfully connected to OpenAI!"}
            else:
                raise HTTPException(status_code=400, detail=f"OpenAI error: {response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OpenAI request failed: {str(e)}")
            
    elif req.llm_provider == "ollama":
        if not req.ollama_base_url:
            raise HTTPException(status_code=400, detail="Ollama base URL missing")
            
        try:
            url = f"{req.ollama_base_url.rstrip('/')}/api/tags"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [m.get("name") for m in models]
                if req.ollama_model and req.ollama_model not in model_names and f"{req.ollama_model}:latest" not in model_names:
                    return {"status": "success", "message": f"Connected to Ollama, but model '{req.ollama_model}' was not found. Available: {', '.join(model_names[:5])}..."}
                return {"status": "success", "message": f"Successfully connected to Ollama and verified model '{req.ollama_model}'!"}
            else:
                raise HTTPException(status_code=400, detail=f"Ollama error: {response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ollama request failed. Is the server running? Error: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Unknown LLM provider")
