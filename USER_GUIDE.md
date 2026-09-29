# Catelyst User Guide

Welcome to the Catelyst User Guide! This document provides comprehensive instructions on how to navigate and utilize the Catelyst AI-powered Jira Dashboard effectively.

## 1. Syncing Jira Tickets
The first step to using Catelyst is pulling your data from Jira.
- **Where to find it:** Look for the **"Sync Jira"** button on the top right corner of the main dashboard.
- **How it works:** Next to the button, there is a **"Load Limit"** input box (default is 15). Set this to the number of recent tickets you want to fetch. Click the "Sync Jira" button. The backend will reach out to your configured Jira workspace and download the ticket summaries and descriptions.
- **What to expect:** The "Total Tickets" card on your dashboard will update to reflect the newly ingested tickets. At this stage, they are marked as "Unprocessed".

## 2. Running AI Analysis
Once your tickets are synced, you need to run them through our LangGraph AI pipeline.
- **Where to find it:** Click the **"Run AI Analysis"** button, located right next to the "Sync Jira" button.
- **How it works:** This triggers the local Ollama LLM to iterate over every unprocessed ticket. For each ticket, it determines the defect category (e.g., Code defect, Data defect), identifies the root cause, evaluates the description quality, and assigns a Quality Score (out of 100).
- **What to expect:** You will see the "AI Processed" count match your "Total Tickets" count. The Radar chart will populate with quality metrics, and the Pie chart will display the breakdown of defect categories.

## 3. Reviewing Ticket Details
You can drill down into the AI's analysis for any specific ticket.
- **How it works:** Scroll down to the Ticket List. You will see a list of all processed tickets with their assigned tags and scores.
- **Expanding Tickets:** Click on any ticket row to expand it. You will see a detailed breakdown of the AI's reasoning, including what information is missing from the ticket and actionable feedback on how to improve the ticket's quality.

## 4. Generating Executive Insights
Catelyst provides an AI-generated executive summary of your entire project's health.
- **Where to find it:** On the right-hand side of the dashboard, you will find the **Insights Panel**.
- **How it works:** The AI reads the global metrics (average quality, most common defect types) and generates a human-readable summary of project risks.
- **Refreshing:** If you have just synced and processed new tickets, the summary might be out of date. Click the **Refresh Icon** in the top right of the Insights Panel to force the AI to write a fresh summary based on the latest data.

## 5. Using the AI Assistant Chatbot
You have a 24/7 AI assistant built right into the dashboard!
- **Where to find it:** Click the floating chat bubble in the bottom right corner of the screen.
- **How it works:** The chatbot is connected to a FAISS vector database containing all your processed tickets and this User Guide.
- **What to ask:** 
  - *"How do I refresh the dashboard insights?"*
  - *"What are the most common defects in our project right now?"*
  - *"Summarize the ticket about the broken login button."*
- **Memory:** The chatbot remembers the context of your current conversation, so you can ask follow-up questions naturally!
