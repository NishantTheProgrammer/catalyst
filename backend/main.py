import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from database import engine
from schema_sync import sync_missing_columns

import models
from routers import tickets, ai, settings

app = FastAPI(title="NASA Reviewer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    try:
        SQLModel.metadata.create_all(engine)
        sync_missing_columns(engine)
        from sqlalchemy import text as _sa_text
        from sqlmodel import Session as _Session
        _new_cols = [
            "ALTER TABLE ticket ADD COLUMN IF NOT EXISTS due_date VARCHAR",
            "ALTER TABLE ticket ADD COLUMN IF NOT EXISTS parent_story_key VARCHAR",
            "ALTER TABLE ticket ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0",
            "ALTER TABLE ticket ADD COLUMN IF NOT EXISTS comments_text TEXT DEFAULT ''",
            "ALTER TABLE ticket ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'",
            "ALTER TABLE ticket ADD COLUMN IF NOT EXISTS bounce_count INTEGER DEFAULT 0",
            "ALTER TABLE ticket ADD COLUMN IF NOT EXISTS timeline_deviation_days INTEGER",
        ]
        try:
            with _Session(engine) as _sess:
                for _sql in _new_cols:
                    try:
                        _sess.exec(_sa_text(_sql))
                    except Exception:
                        pass
                _sess.commit()
        except Exception as _e:
            print(f"Ticket column migration note: {_e}")
        print("Database schema is up to date.")
    except Exception as e:
        print(f"Error connecting to database during startup: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to NASA Reviewer API"}

app.include_router(tickets.router)
app.include_router(ai.router)
app.include_router(settings.router)
