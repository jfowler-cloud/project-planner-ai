"""Prompt templates for the 10-step review pipeline."""

SYSTEM_ARCHITECT = """You are a senior software architect helping developers plan projects.
You give honest, practical advice tailored to the project's scale, budget, and timeline.
Always respond with valid JSON only."""

INITIAL_PLAN_PROMPT = """You are a senior software architect. Generate an initial project plan.

Project details:
{questionnaire}

Respond with JSON:
{{
  "recommended": {{
    "name": "Stack name (e.g. 'Next.js + FastAPI + PostgreSQL')",
    "stack": {{"frontend": "...", "backend": "...", "database": "...", "infra": "...", "auth": "..."}},
    "pros": ["..."],
    "cons": ["..."],
    "monthly_cost_estimate": "$X-Y/month",
    "complexity": "low|medium|high",
    "best_for": "One sentence on ideal use case",
    "mermaid_diagram": "graph TD\\n  A[Frontend] --> B[API]\\n  B --> C[DB]"
  }},
  "alternatives": [
    {{
      "name": "Alternative stack name",
      "stack": {{"frontend": "...", "backend": "...", "database": "...", "infra": "...", "auth": "..."}},
      "pros": ["..."],
      "cons": ["..."],
      "monthly_cost_estimate": "$X-Y/month",
      "complexity": "low|medium|high",
      "best_for": "One sentence",
      "mermaid_diagram": ""
    }}
  ]
}}

Provide 2-3 alternatives. Respond with ONLY JSON."""

REVIEW_ITERATION_PROMPT = """You are reviewing a project plan. This is review iteration {iteration} of 10.

Category: {category}

Project questionnaire:
{questionnaire}

Current recommended stack:
{current_plan}

Previous findings:
{previous_findings}

Review the plan specifically for {category}. Identify issues, risks, and improvements.

Respond with JSON:
{{
  "findings": ["specific finding 1", "specific finding 2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
  "risk_level": "low|medium|high",
  "updated_stack": null
}}

If the stack should change based on your findings, set updated_stack to the new recommended stack object.
Otherwise set updated_stack to null.
Respond with ONLY JSON."""

REVIEW_CATEGORIES = [
    "security analysis",
    "cost optimization",
    "scalability review",
    "reliability assessment",
    "maintainability check",
    "performance review",
    "developer experience",
    "operational complexity",
    "compliance & legal",
    "future-proofing",
]
