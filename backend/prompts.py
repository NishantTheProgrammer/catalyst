CATEGORIZE_PROMPT_TEMPLATE = """Classify this Jira ticket into one of these categories strictly: Code, Data, Configuration, Documentation, Requirement, Legacy. Title: {title}. Description: {description}. Reply in strictly JSON format: {{"category": "...", "confidence": <integer 1-100>, "reason": "..."}}"""

QUALITY_PROMPT_TEMPLATE = """Evaluate this Jira ticket. Title: {title}. Description: {description}

Evaluate 5 criteria: Clarity (out of 20), Completeness (out of 20), Context (out of 20), Reproducibility (out of 20), Dependencies (out of 20).
Keep reasoning brief. You MUST reply ONLY with valid JSON, flat structure.

Format:
{{"qualityScore": 85, "qualityLevel": "Good", "readiness": "Ready", "clarityScore": 15, "clarityReason": "...", "completenessScore": 15, "completenessReason": "...", "contextScore": 15, "contextReason": "...", "reproducibilityScore": 15, "reproducibilityReason": "...", "dependenciesScore": 15, "dependenciesReason": "...", "missingInformation": "...", "recommendation": "...", "aiReady": true}}"""

SUMMARY_PROMPT_HEADER = """You are an expert Agile Project Manager and AI Analyst. Based on the following Jira tickets and their AI classifications, write a high-level, executive project health summary. 

DO NOT just list the tickets. Instead, synthesize the data into insightful observations:
1. **Current State & Trends:** Group similar issues (e.g., "Multiple deployment updates required").
2. **Key Risks:** Identify systemic issues, data gaps, or critical bugs.
3. **Strategic Recommendations:** Actionable next steps to improve project health.

Use beautiful, professional rich markdown formatting (with **bolding** for emphasis, bullet points, and appropriate emojis). 

VERY IMPORTANT: You must output strictly valid JSON. Escape all newlines in your markdown strictly as '\\n'.
Your output MUST be a single JSON object with EXACTLY these two keys:
{
  "overall_status": "Stable",
  "summary_text": "# Executive Summary\\n\\nYour markdown here..."
}

Data:
"""

SUMMARY_PROMPT_FOOTER = """
Reply in strictly JSON format: {"overall_status": "...", "summary_text": "..."}"""
