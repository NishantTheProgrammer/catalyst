# NASA Reviewer - AI-Powered Jira Project Risk Intelligence

A full-stack application that seamlessly connects to Jira, ingests project tickets, and uses a LangGraph multi-agent pipeline powered by local LLMs (Ollama) to automatically categorize defects, visualize trends, and predict overall project health.

## 🚀 Tech Stack

*   **Frontend**: Next.js (App Router), React, Tailwind CSS, Recharts, Lucide Icons
*   **Backend**: Python, FastAPI, LangGraph, LangChain, SQLModel
*   **Database**: PostgreSQL (Dockerized)
*   **AI/LLM**: Local Ollama (`llama3.2:1b` by default)

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
