import os
from sqlmodel import Session, select
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List
import json
import re
from database import engine
from models import Ticket, AnalysisResult, ProjectSummary, TicketQuality

class GraphState(TypedDict):
    tickets: List[Ticket]
    classifications: List[dict]
    qualities: List[dict]

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

def analyze_tickets(state: GraphState):
    tickets = state.get("tickets", [])
    if not tickets:
        return {"classifications": [], "qualities": []}
    
    classifications = []
    qualities = []
    
    with Session(engine) as session:
        for ticket in tickets:
            # --- 1. Classify Defect ---
            try:
                prompt1 = f"Classify this Jira ticket into one of these categories strictly: Code, Data, Configuration, Documentation, Requirement, Legacy. Title: {ticket.title}. Description: {ticket.description}. Reply in strictly JSON format: {{\"category\": \"...\", \"confidence\": <integer 1-100>, \"reason\": \"...\"}}"
                response1 = llm.invoke([HumanMessage(content=prompt1)])
                import re
                match = re.search(r'\{.*?\}', response1.content, re.DOTALL)
                clean_json = match.group(0) if match else response1.content.strip('`').replace('json\n', '').strip()
                res_data1 = json.loads(clean_json)
                
                category = res_data1.get("category", "Unknown")
                valid_categories = ["Code", "Data", "Configuration", "Documentation", "Requirement", "Legacy"]
                if category not in valid_categories:
                    if "code" in category.lower(): category = "Code"
                    elif "data" in category.lower(): category = "Data"
                    elif "config" in category.lower(): category = "Configuration"
                    elif "doc" in category.lower(): category = "Documentation"
                    elif "req" in category.lower(): category = "Requirement"
                    elif "legacy" in category.lower(): category = "Legacy"
                    else: category = "Code"
                
                confidence = res_data1.get("confidence", 0)
                reason = res_data1.get("reason", "")
            except Exception as e:
                print(f"LLM Classification Error: {e}")
                category = "Data" if "ETL" in ticket.title else "Code"
                if "legacy" in ticket.title.lower(): category = "Legacy"
                confidence = 85
                reason = "AI fallback: Mapped based on keyword heuristics."
                
            class_result = {"ticket_id": ticket.id, "category": category, "confidence": confidence, "reason": reason}
            classifications.append(class_result)
            
            analysis = AnalysisResult(**class_result)
            session.add(analysis)
            
            # --- 2. Assess Quality ---
            # --- 2. Assess Quality ---
            try:
                prompt2 = f"""
Evaluate this Jira ticket. Title: {ticket.title}. Description: {ticket.description}

Evaluate 5 criteria: Clarity (out of 20), Completeness (out of 20), Context (out of 20), Reproducibility (out of 20), Dependencies (out of 20).
Keep reasoning brief. You MUST reply ONLY with valid JSON, flat structure.

Format:
{{"qualityScore": 85, "qualityLevel": "Good", "readiness": "Ready", "clarityScore": 15, "clarityReason": "...", "completenessScore": 15, "completenessReason": "...", "contextScore": 15, "contextReason": "...", "reproducibilityScore": 15, "reproducibilityReason": "...", "dependenciesScore": 15, "dependenciesReason": "...", "missingInformation": "...", "recommendation": "...", "aiReady": true}}
"""
                response2 = llm.invoke([HumanMessage(content=prompt2)])
                import re
                match2 = re.search(r'\{.*?\}', response2.content, re.DOTALL)
                clean_json2 = match2.group(0) if match2 else response2.content.strip('`').replace('json\n', '').strip()
                
                clean_json2 = re.sub(r',\s*\}', '}', clean_json2)
                try:
                    res_flat = json.loads(clean_json2)
                except Exception as json_err:
                    print(f"JSON Parse Error, falling back to regex: {json_err}")
                    res_flat = {}
                    score_match = re.search(r'"qualityScore"\s*:\s*(\d+)', clean_json2)
                    if score_match: res_flat["qualityScore"] = int(score_match.group(1))
                    
                    level_match = re.search(r'"qualityLevel"\s*:\s*"([^"]+)"', clean_json2)
                    if level_match: res_flat["qualityLevel"] = level_match.group(1)
                    
                    for key in ["clarityScore", "completenessScore", "contextScore", "reproducibilityScore", "dependenciesScore"]:
                        m = re.search(fr'"{key}"\s*:\s*(\d+)', clean_json2)
                        if m: res_flat[key] = int(m.group(1))
                        
                    for key in ["readiness", "missingInformation", "recommendation"]:
                        m = re.search(fr'"{key}"\s*:\s*"([^"]+)"', clean_json2)
                        if m: res_flat[key] = m.group(1)
                        
                # Just in case it still outputs a number for missingInformation
                missing_info = str(res_flat.get("missingInformation", res_flat.get("gap", "Missing context")))
                if missing_info.isdigit() or len(missing_info) < 4:
                    missing_info = "Details are incomplete or ambiguous."
                        
                # Calculate Total Score Dynamically to prevent AI math hallucinations
                clarity_score = res_flat.get("clarityScore", 15)
                completeness_score = res_flat.get("completenessScore", 15)
                context_score = res_flat.get("contextScore", 15)
                reproducibility_score = res_flat.get("reproducibilityScore", 15)
                dependencies_score = res_flat.get("dependenciesScore", 15)
                
                total_score = clarity_score + completeness_score + context_score + reproducibility_score + dependencies_score
                
                # Derive quality level based on mathematically correct total score
                if total_score >= 80:
                    calculated_level = "Good"
                elif total_score >= 60:
                    calculated_level = "Fair"
                else:
                    calculated_level = "Poor"
                        
                res_data2 = {
                    "qualityScore": total_score,
                    "qualityLevel": calculated_level,
                    "implementationReadiness": res_flat.get("readiness", "Needs Clarification"),
                    "criteriaScores": {
                        "clarity": {"score": clarity_score, "maxScore": 20, "reason": res_flat.get("clarityReason", "")},
                        "completeness": {"score": completeness_score, "maxScore": 20, "reason": res_flat.get("completenessReason", "")},
                        "context": {"score": context_score, "maxScore": 20, "reason": res_flat.get("contextReason", "")},
                        "reproducibility": {"score": reproducibility_score, "maxScore": 20, "reason": res_flat.get("reproducibilityReason", "")},
                        "dependencies": {"score": dependencies_score, "maxScore": 20, "reason": res_flat.get("dependenciesReason", "")}
                    },
                    "gaps": [{"issue": missing_info, "why": "", "suggestion": "", "priority": "High"}],
                    "recommendations": [res_flat.get("recommendation", "Refine description")],
                    "aiAgentReady": res_flat.get("aiReady", False)
                }
            except Exception as e:
                print(f"Quality LLM Error: {e}")
                res_data2 = {
                    "qualityScore": 65, "qualityLevel": "Fair", "implementationReadiness": "Needs Clarification",
                    "criteriaScores": {},
                    "gaps": [{"issue": "Parsing Error", "why": str(e), "suggestion": "N/A", "priority": "Medium"}],
                    "recommendations": ["Fallback invoked"],
                    "aiAgentReady": False
                }
                
            qual = TicketQuality(
                ticket_id=ticket.id,
                quality_score=res_data2.get("qualityScore", 65),
                quality_level=res_data2.get("qualityLevel", "Fair"),
                implementation_readiness=res_data2.get("implementationReadiness", "Needs Clarification"),
                criteria_scores=res_data2.get("criteriaScores", {}),
                gaps=res_data2.get("gaps", []),
                recommendations=res_data2.get("recommendations", []),
                ai_agent_ready=res_data2.get("aiAgentReady", False)
            )
            session.add(qual)
            qualities.append(res_data2)
            
            # --- 3. Mark processed & Commit IMMEDIATELY to UI ---
            db_ticket = session.get(Ticket, ticket.id)
            if db_ticket:
                db_ticket.is_processed = True
                session.add(db_ticket)
                
            session.commit()
            
    return {"classifications": classifications, "qualities": qualities}

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
workflow.add_node("analyze_tickets", analyze_tickets)
workflow.add_node("update_db", update_db)

workflow.add_edge(START, "fetch_unprocessed")
workflow.add_edge("fetch_unprocessed", "analyze_tickets")
workflow.add_edge("analyze_tickets", "update_db")
workflow.add_edge("update_db", END)

app_graph = workflow.compile()
