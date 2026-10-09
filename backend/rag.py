import os
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_ollama import OllamaEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from sqlmodel import Session, select
from database import engine
from models import Ticket

from models import AppSettings
from constants import DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_EMBEDDING_MODEL, DEFAULT_GEMINI_EMBEDDING_MODEL

def get_embeddings():
    with Session(engine) as session:
        settings = session.exec(select(AppSettings).where(AppSettings.id == 1)).first()
        if not settings:
            return OllamaEmbeddings(base_url=DEFAULT_OLLAMA_BASE_URL, model=DEFAULT_OLLAMA_EMBEDDING_MODEL)
            
        if settings.llm_provider == "gemini" and settings.gemini_api_key:
            return GoogleGenerativeAIEmbeddings(model=DEFAULT_GEMINI_EMBEDDING_MODEL, google_api_key=settings.gemini_api_key)
        elif settings.llm_provider == "openai" and settings.openai_api_key:
            return OpenAIEmbeddings(api_key=settings.openai_api_key)
        else:
            return OllamaEmbeddings(base_url=settings.ollama_base_url or DEFAULT_OLLAMA_BASE_URL, model=DEFAULT_OLLAMA_EMBEDDING_MODEL)

vectorstore = None

def build_vector_store():
    global vectorstore
    docs = []
    with Session(engine) as session:
        from crud import get_tickets_eager
        tickets = get_tickets_eager(session, processed_only=True)
        
        for t in tickets:
            content = f"Ticket Title: {t.title}\nDescription: {t.description}\n"
            if t.analysis:
                content += f"Category: {t.analysis.category}\nReason: {t.analysis.reason}\n"
            if t.quality:
                content += f"Quality Score: {t.quality.quality_score} ({t.quality.quality_level})\n"
            
            docs.append(Document(page_content=content, metadata={"type": "ticket", "ticket_id": t.id, "title": t.title}))
            
    # Add README to vector store
    try:
        readme_path = "/docs/README.md"
        if os.path.exists(readme_path):
            with open(readme_path, "r", encoding="utf-8") as f:
                readme_content = f.read()
            docs.append(Document(
                page_content=f"PROJECT DOCUMENTATION (README.md):\n{readme_content}", 
                metadata={"type": "documentation", "title": "README"}
            ))
            
        guide_path = "/docs/USER_GUIDE.md"
        if os.path.exists(guide_path):
            with open(guide_path, "r", encoding="utf-8") as f:
                guide_content = f.read()
            docs.append(Document(
                page_content=f"USER GUIDE:\n{guide_content}", 
                metadata={"type": "documentation", "title": "User Guide"}
            ))
    except Exception as e:
        print(f"Failed to load documentation into RAG: {e}")
        
    if docs:
        try:
            vectorstore = FAISS.from_documents(docs, get_embeddings())
            print("Vector store built successfully with", len(docs), "documents")
        except Exception as e:
            print(f"FAISS embedding error: {e}")
            vectorstore = None
    else:
        print("No processed tickets to build vector store.")

def get_global_metrics(session: Session) -> str:
    from crud import get_tickets_eager
    tickets = get_tickets_eager(session)
    total = len(tickets)
    processed = sum(1 for t in tickets if t.is_processed)
    
    categories = {}
    quality_scores = []
    sprint_scores = {}
    
    # Advanced metrics
    low_quality_count = 0
    high_bounce_count = 0
    delayed_tickets_count = 0
    severe_bugs_count = 0
    root_causes = {}
    
    for t in tickets:
        if t.is_processed and t.analysis:
            cat = t.analysis.category
            categories[cat] = categories.get(cat, 0) + 1
        if t.is_processed and t.quality:
            quality_scores.append(t.quality.quality_score)
            sprint_name = t.sprint or "Backlog"
            if sprint_name not in sprint_scores:
                sprint_scores[sprint_name] = []
            sprint_scores[sprint_name].append(t.quality.quality_score)
            
            if t.quality.quality_score < 60:
                low_quality_count += 1
                
        if t.bounce_count > 2:
            high_bounce_count += 1
        if t.timeline_deviation_days and t.timeline_deviation_days > 0:
            delayed_tickets_count += 1
            
        if t.is_processed and t.bug_analysis:
            rc = t.bug_analysis.root_cause_type
            root_causes[rc] = root_causes.get(rc, 0) + 1
            if "P0" in t.bug_analysis.severity or "P1" in t.bug_analysis.severity:
                severe_bugs_count += 1
            
    avg_quality = round(sum(quality_scores) / len(quality_scores)) if quality_scores else 0
    cat_str = ", ".join([f"{k}: {v}" for k, v in categories.items()]) if categories else "None"
    rc_str = ", ".join([f"{k}: {v}" for k, v in root_causes.items()]) if root_causes else "None"
    
    sprint_trend_str = "None"
    if sprint_scores:
        trend_parts = []
        for sprint, scores in sorted(sprint_scores.items()):
            sprint_avg = round(sum(scores) / len(scores))
            trend_parts.append(f"{sprint}: {sprint_avg}/100")
        sprint_trend_str = ", ".join(trend_parts)
    
    return f"""GLOBAL DASHBOARD METRICS:
- Total Tickets in System: {total}
- AI Processed Tickets: {processed}
- Average Ticket Quality Score: {avg_quality}/100
- Sprint Quality Trend: {sprint_trend_str}
- Defect Categories: {cat_str}

PROJECT RISKS & DEEP INSIGHTS:
- Tickets Flagged as Low Quality (<60 Score): {low_quality_count}
- Tickets Bouncing Frequently (>2 times): {high_bounce_count}
- Tickets with Timeline Delays: {delayed_tickets_count}
- Critical/Blocker Bugs (P0/P1): {severe_bugs_count}
- Bug Root Causes Summary: {rc_str}
"""

def stream_rag(query: str, history: list = None):
    global vectorstore
    if not vectorstore:
        build_vector_store()
        
    context = ""
    api_error = False
    
    if vectorstore:
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        relevant_docs = retriever.invoke(query)
        
        context_chunks = []
        for d in relevant_docs:
            doc_type = d.metadata.get("type", "ticket")
            prefix = "<documentation>" if doc_type == "documentation" else "<ticket>"
            suffix = "</documentation>" if doc_type == "documentation" else "</ticket>"
            context_chunks.append(f"{prefix}\n{d.page_content}\n{suffix}")
            
        context = "\n\n".join(context_chunks)
    else:
        # Check if it failed because of API error or empty DB
        with Session(engine) as session:
            from crud import get_tickets_eager
            if get_tickets_eager(session, processed_only=True):
                api_error = True
    
    with Session(engine) as session:
        global_metrics = get_global_metrics(session)
        
    system_prompt = f"""You are "Catelyst AI", a helpful AI assistant embedded in a Jira project dashboard.

<dashboard_metrics>
{global_metrics}
</dashboard_metrics>

<dashboard_instructions>
- To process/analyze tickets: Click the "Run AI Analysis" button (top right).
- To fetch/load tickets: Click the "Sync Jira" button.
- To refresh insights: Click the refresh icon on the Insights panel.
</dashboard_instructions>
"""
    
    if api_error:
        system_prompt += "\n<system_alert>\nThe Gemini Embeddings API failed to load the vector store (likely a rate limit or API key issue). Inform the user you cannot search specific tickets right now, but you can answer general questions.\n</system_alert>\n"
    elif context:
        system_prompt += f"\n<context>\n{context}\n</context>\n"
    else:
        system_prompt += "\n<context>\nNo tickets have been processed by AI yet. If the user asks about specific tickets, politely tell them to click 'Run AI Analysis' first.\n</context>\n"

    system_prompt += """
INSTRUCTIONS:
1. Answer the user's question using ONLY the data provided in <context>, <dashboard_metrics>, and <dashboard_instructions>.
2. Be extremely brief, direct, and concise. Do not add conversational filler or summaries.
3. If the user greets you, reply EXACTLY with: "Hello! How can I help you with your Catelyst dashboard today?"
"""
    from agent import get_llm
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
    
    messages = [SystemMessage(content=system_prompt)]
    
    if history:
        for msg in history[-4:]:
            if msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
            else:
                messages.append(HumanMessage(content=msg.content))
                
    messages.append(HumanMessage(content=query))
    
    try:
        for chunk in get_llm().stream(messages):
            if chunk.content:
                if isinstance(chunk.content, list):
                    text = "".join(item.get("text", "") if isinstance(item, dict) else str(item) for item in chunk.content)
                    if text:
                        yield text
                else:
                    yield str(chunk.content)
    except Exception as e:
        print(f"RAG Chat Error: {e}")
        yield "Sorry, I encountered an error while trying to answer your question."
