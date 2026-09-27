# NASA Reviewer - AI-Powered Jira Project Risk Intelligence

A full-stack application that seamlessly connects to Jira, ingests project tickets, and uses a LangGraph multi-agent pipeline powered by local LLMs (Ollama) to automatically categorize defects, visualize trends, and predict overall project health.

## 🚀 Tech Stack

*   **Frontend**: Next.js (App Router), React, Tailwind CSS, Recharts, Lucide Icons
*   **Backend**: Python, FastAPI, LangGraph, LangChain, SQLModel (Modular Architecture)
*   **Database**: PostgreSQL (Dockerized)
*   **AI/LLM**: Local Ollama (`llama3.2:1b` by default)

## ✨ Features
*   **Automated Ticket Sync**: Ingests project tickets directly from Jira via JQL.
*   **AI Defect Classification**: Automatically categorizes defects (Code, Data, Config, Doc, etc.).
*   **5-Point Ticket Quality Score**: Evaluates ticket readiness based on Clarity, Completeness, Context, Reproducibility, and Dependencies.
*   **AI Actionable Feedback**: Provides explicit recommendations on what details are missing from poorly written tickets.
*   **Interactive Visualizations**: Clickable Pie and Bar charts that act as active filters for the dashboard ticket list.
*   **Radar Metrics**: Visualize average ticket quality metrics using multi-axis radar charts.

---

## 🛠️ Setup Instructions

### 1. Prerequisites

*   [Docker & Docker Compose](https://www.docker.com/) installed.
*   [Ollama](https://ollama.com/) installed and running locally on your machine.
*   Pull the required model in Ollama:
    ```bash
    ollama run llama3.2:1b
    ```

### 2. Environment Variables

Navigate to the `backend` directory and create your `.env` file from the provided example:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and configure your Jira credentials:
*   `JIRA_URL`: Your Jira workspace URL (e.g., `https://your-domain.atlassian.net`)
*   `JIRA_USERNAME`: Your Atlassian account email
*   `JIRA_API_TOKEN`: Your Jira API token (Generated from Atlassian security settings)

### 3. Run the Application

Start the entire stack (Frontend, Backend, and Database) using Docker Compose from the root directory:

```bash
docker compose up
```

### 4. Access the Dashboard

Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

*   Click **Sync Jira** to ingest the latest tickets from your configured project.
*   Click **Run AI Analysis** to trigger the LangGraph pipeline. Watch as the AI processes tickets in real-time, generates visualizations, and writes an executive project health summary!
