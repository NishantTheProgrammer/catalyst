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
        print("Database schema is up to date.")
    except Exception as e:
        print(f"Error connecting to database during startup: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to NASA Reviewer API"}

app.include_router(tickets.router)
app.include_router(ai.router)
app.include_router(settings.router)
