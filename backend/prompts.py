CATEGORIZE_PROMPT_TEMPLATE = """Classify this Jira ticket into one of these categories strictly: Code, Data, Configuration, Documentation, Requirement, Legacy. Title: {title}. Description: {description}. Reply in strictly JSON format: {{"category": "...", "confidence": <integer 1-100>, "reason": "..."}}"""

QUALITY_PROMPT_TEMPLATE = """Evaluate this Jira ticket. Title: {title}. Description: {description}

Evaluate 5 criteria: Clarity (out of 20), Completeness (out of 20), Context (out of 20), Reproducibility (out of 20), Dependencies (out of 20).
Keep reasoning brief. You MUST reply ONLY with valid JSON, flat structure.

Format:
{{"qualityScore": 85, "qualityLevel": "Good", "readiness": "Ready", "clarityScore": 15, "clarityReason": "...", "completenessScore": 15, "completenessReason": "...", "contextScore": 15, "contextReason": "...", "reproducibilityScore": 15, "reproducibilityReason": "...", "dependenciesScore": 15, "dependenciesReason": "...", "missingInformation": "...", "recommendation": "...", "aiReady": true}}"""

SUMMARY_PROMPT_HEADER = """You are an expert Agile Project Manager and AI Analyst. Based on the following Jira tickets and their AI classifications, write an EXTREMELY DETAILED, high-level executive project health summary. 

DO NOT just list the tickets. Instead, synthesize the data into insightful observations:
1. **Current State & Trends:** Group similar issues, comment on the volume of each category, and describe what the team is currently facing.
2. **Key Risks:** Identify systemic issues, data gaps, or critical bugs based on the ticket sample.
3. **Strategic Recommendations:** Give 3-4 actionable next steps to improve project health and engineering velocity.

Use beautiful, professional rich markdown formatting (with **bolding** for emphasis, bullet points, and appropriate emojis). The summary should be multiple paragraphs and highly detailed.

VERY IMPORTANT: You must output your response in EXACTLY this format (do not use JSON):

STATUS: [Stable OR At Risk OR Critical]
---
# Executive Summary
[Your highly detailed markdown report here...]

Data:
"""

SUMMARY_PROMPT_FOOTER = """
Remember: Start exactly with "STATUS: " followed by the status, then "---", then your detailed markdown."""
