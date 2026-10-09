import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

try:
    # Use a fake key but a valid format, or if local db has a key, use it
    from database import engine
    from sqlmodel import Session, select
    from models import AppSettings
    with Session(engine) as session:
        s = session.exec(select(AppSettings).where(AppSettings.id==1)).first()
        key = s.gemini_api_key if s else 'AIzaSyFakeKey'
        
    llm = ChatGoogleGenerativeAI(model="gemini-9.9-flash-lite", api_key=key)
    for chunk in llm.stream([HumanMessage(content="Say hello")]):
        print(f"CHUNK: {chunk.content}")
except Exception as e:
    print(f"ERROR CAUGHT: {type(e).__name__} - {e}")
