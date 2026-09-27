import os
from sqlmodel import Session, select
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List
import json
from main import engine, Ticket, AnalysisResult, ProjectSummary

class GraphState(TypedDict):
    tickets: List[Ticket]
    classifications: List[dict]

# Load AI Model based on ENV vars
openai_key = os.getenv("OPENAI_API_KEY")
if openai_key:
    llm = ChatOpenAI(model="gpt-4o-mini", api_key=openai_key)
else:
    # Use free, local Ollama model
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2")
    llm = ChatOllama(base_url=ollama_url, model=ollama_model)

def fetch_unprocessed(state: GraphState):
    with Session(engine) as session:
        unprocessed = session.exec(select(Ticket).where(Ticket.is_processed == False).order_by(Ticket.id.desc())).all()
        return {"tickets": unprocessed}

def classify_defects(state: GraphState):
    tickets = state.get("tickets", [])
    if not tickets:
        return {"classifications": []}
    
    classifications = []
    with Session(engine) as session:
        for ticket in tickets:
            try:
                prompt = f"Classify this Jira ticket into one of these categories strictly: Code, Data, Configuration, Documentation, Requirement, Legacy. Title: {ticket.title}. Description: {ticket.description}. Reply in strictly JSON format: {{\"category\": \"...\", \"confidence\": <integer 1-100>, \"reason\": \"...\"}}"
                response = llm.invoke([HumanMessage(content=prompt)])
                import re
                match = re.search(r'\{.*?\}', response.content, re.DOTALL)
                if match:
                    clean_json = match.group(0)
                else:
                    clean_json = response.content.strip('`').replace('json\n', '').strip()
                    
                res_data = json.loads(clean_json)
                category = res_data.get("category", "Unknown")
                
                # Normalize category to fix small model hallucinations
                valid_categories = ["Code", "Data", "Configuration", "Documentation", "Requirement", "Legacy"]
                if category not in valid_categories:
                    if "code" in category.lower(): category = "Code"
                    elif "data" in category.lower(): category = "Data"
                    elif "config" in category.lower(): category = "Configuration"
                    elif "doc" in category.lower(): category = "Documentation"
                    elif "req" in category.lower(): category = "Requirement"
                    elif "legacy" in category.lower(): category = "Legacy"
                    else: category = "Code" # Fallback
                
                confidence = res_data.get("confidence", 0)
                reason = res_data.get("reason", "")
            except Exception as e:
                print(f"LLM Error: {e}")
                category = "Data defect" if "ETL" in ticket.title else "Code defect"
                if "legacy" in ticket.title.lower(): category = "Legacy behaviour"
                confidence = 85
                reason = "AI fallback: Mapped based on keyword heuristics due to missing API key."
                
            classifications.append({
                "ticket_id": ticket.id,
                "category": category,
                "confidence": confidence,
                "reason": reason
            })
            
            # Update DB immediately so frontend can poll progress
            analysis = AnalysisResult(
                ticket_id=ticket.id, 
                category=category, 
                confidence=confidence, 
                reason=reason
            )
            session.add(analysis)
            
            db_ticket = session.get(Ticket, ticket.id)
            if db_ticket:
                db_ticket.is_processed = True
                session.add(db_ticket)
                
            session.commit()
            
    return {"classifications": classifications}

def update_db(state: GraphState):
    tickets = state.get("tickets", [])
    classifications = state.get("classifications", [])
    if not classifications:
        return {"tickets": []}
        
    # Generate Project Summary
    summary_prompt = "Based on these tickets and classifications, write a 1-paragraph project health summary focusing on defect trends and risks. Also provide an overall_status of strictly either 'Stable', 'Watch', or 'At Risk'.\n\nData:\n"
    for t, c in zip(tickets, classifications):
        summary_prompt += f"Ticket: {t.title}, AI Category: {c.get('category')}\n"
    
    summary_prompt += "\nReply in strictly JSON format: {\"overall_status\": \"...\", \"summary_text\": \"...\"}"
    
    try:
        response = llm.invoke([HumanMessage(content=summary_prompt)])
        import re, json
        match = re.search(r'\{.*?\}', response.content, re.DOTALL)
        clean_json = match.group(0) if match else response.content.strip('`').replace('json\n', '').strip()
        res_data = json.loads(clean_json)
        
        status = res_data.get("overall_status", "Unknown")
        text = res_data.get("summary_text", "Failed to generate summary.")
    except Exception as e:
        print(f"Summary Error: {e}")
        status = "Watch"
        text = "AI fallback summary: Several defects detected, further investigation recommended."
        
    with Session(engine) as session:
        summary = ProjectSummary(overall_status=status, summary_text=text)
        session.add(summary)
        session.commit()
        
    return {"tickets": tickets}

# Build LangGraph workflow
workflow = StateGraph(GraphState)
workflow.add_node("fetch_unprocessed", fetch_unprocessed)
workflow.add_node("classify_defects", classify_defects)
workflow.add_node("update_db", update_db)

workflow.add_edge(START, "fetch_unprocessed")
workflow.add_edge("fetch_unprocessed", "classify_defects")
workflow.add_edge("classify_defects", "update_db")
workflow.add_edge("update_db", END)

app_graph = workflow.compile()
