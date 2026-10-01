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
        tickets = session.exec(select(Ticket).where(Ticket.is_processed == True)).all()
        
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
        vectorstore = FAISS.from_documents(docs, get_embeddings())
        print("Vector store built successfully with", len(docs), "documents")
    else:
        print("No processed tickets to build vector store.")

def get_global_metrics(session: Session) -> str:
    tickets = session.exec(select(Ticket)).all()
    total = len(tickets)
    processed = sum(1 for t in tickets if t.is_processed)
    
    categories = {}
    quality_scores = []
    
    for t in tickets:
        if t.is_processed and t.analysis:
            cat = t.analysis.category
            categories[cat] = categories.get(cat, 0) + 1
        if t.is_processed and t.quality:
            quality_scores.append(t.quality.quality_score)
            
    avg_quality = round(sum(quality_scores) / len(quality_scores)) if quality_scores else 0
    cat_str = ", ".join([f"{k}: {v}" for k, v in categories.items()]) if categories else "None"
    
    return f"""GLOBAL DASHBOARD METRICS:
- Total Tickets in System: {total}
- AI Processed Tickets: {processed}
- Average Ticket Quality Score: {avg_quality}/100
- Defect Categories: {cat_str}
"""

def query_rag(query: str, history: list = None) -> str:
    global vectorstore
    if not vectorstore:
        build_vector_store()
        
    if not vectorstore:
        return "No ticket data available to search. Please process some tickets first."
        
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    relevant_docs = retriever.invoke(query)
    
    context_chunks = []
    for d in relevant_docs:
        doc_type = d.metadata.get("type", "ticket")
        prefix = "--- DOCUMENTATION ---" if doc_type == "documentation" else "--- TICKET ---"
        context_chunks.append(f"{prefix}\n{d.page_content}")
        
    context = "\n\n".join(context_chunks)
    
    with Session(engine) as session:
        global_metrics = get_global_metrics(session)
        
    system_prompt = f"""You are "Catelyst AI", a helpful AI assistant embedded in a Jira project dashboard.

GLOBAL DASHBOARD METRICS:
{global_metrics}

DASHBOARD INSTRUCTIONS:
- To process/analyze tickets: Click the "Run AI Analysis" button (top right).
- To fetch/load tickets: Click the "Sync Jira" button.
- To refresh insights: Click the refresh icon on the Insights panel.

CONTEXT DATA (Jira Tickets and Documentation):
{context}

INSTRUCTIONS:
1. Answer the user's question using ONLY the provided metrics and context.
2. BE EXTREMELY BRIEF AND DIRECT. Respond in 1 to 2 sentences MAX. Do not add conversational filler, summaries, or ask follow-up questions at the end.
3. If the user's message is just a greeting (like hi, hello, hey), reply EXACTLY with: "Hello! How can I help you with your Catelyst dashboard today?" and nothing else.
"""
    from agent import get_llm
    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
    
    messages = [SystemMessage(content=system_prompt)]
    
    if history:
        for msg in history:
            if msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
            else:
                messages.append(HumanMessage(content=msg.content))
                
    messages.append(HumanMessage(content=query))
    
    try:
        response = get_llm().invoke(messages)
        return response.content
    except Exception as e:
        print(f"RAG Chat Error: {e}")
        return "Sorry, I encountered an error while trying to answer your question."
