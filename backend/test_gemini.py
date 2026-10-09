import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

api_key = os.getenv("GEMINI_API_KEY") # If it exists
if not api_key:
    from database import engine
    from sqlmodel import Session, select
    from models import AppSettings
    with Session(engine) as session:
        s = session.exec(select(AppSettings)).first()
        if s: api_key = s.gemini_api_key

if not api_key:
    print("No API key")
else:
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=api_key)
        for chunk in llm.stream([HumanMessage(content="Say hello")]):
            print(f"CHUNK: {chunk.content}")
    except Exception as e:
        print(f"ERROR: {e}")
