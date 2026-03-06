"""10-step review pipeline with SSE streaming."""

import json
import logging
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime

from ..models.project import ArchitectureOption, PlanOutput, QuestionnaireInput, ReviewFinding
from .client import invoke, strip_code_fences
from .prompts import (
    INITIAL_PLAN_PROMPT,
    REVIEW_CATEGORIES,
    REVIEW_ITERATION_PROMPT,
    SYSTEM_ARCHITECT,
)

logger = logging.getLogger(__name__)


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def run_pipeline(
    questionnaire: QuestionnaireInput,
) -> AsyncGenerator[str, None]:
    """
    Run the 10-step review pipeline, yielding SSE events.

    Each event: {"step": int, "total": int, "message": str, "partial": dict|None, "done": bool}
    Final event has done=True and partial contains the full PlanOutput dict.
    """
    total_steps = 12  # initial plan + 10 reviews + finalize
    q_json = questionnaire.model_dump_json(indent=2)

    # Step 1: Generate initial plan
    yield _sse({"step": 1, "total": total_steps, "message": "Generating initial architecture plan...", "partial": None, "done": False})

    try:
        raw = await invoke(SYSTEM_ARCHITECT, INITIAL_PLAN_PROMPT.format(questionnaire=q_json))
        raw = strip_code_fences(raw)
        initial = json.loads(raw)
    except Exception as e:
        logger.exception("Initial plan generation failed")
        yield _sse({"step": 1, "total": total_steps, "message": f"Error generating plan: {e}", "partial": None, "done": True, "error": True})
        return

    recommended_data = initial.get("recommended", {})
    alternatives_data = initial.get("alternatives", [])

    recommended = ArchitectureOption(**recommended_data)
    alternatives = [ArchitectureOption(**a) for a in alternatives_data[:3]]

    yield _sse({
        "step": 1,
        "total": total_steps,
        "message": f"Initial plan: {recommended.name}",
        "partial": {"recommended": recommended.model_dump()},
        "done": False,
    })

    # Steps 2-11: 10 review iterations
    findings: list[ReviewFinding] = []
    previous_findings_text = "None yet."

    for i, category in enumerate(REVIEW_CATEGORIES, start=1):
        step_num = i + 1
        yield _sse({
            "step": step_num,
            "total": total_steps,
            "message": f"Review {i}/10: {category.title()}...",
            "partial": None,
            "done": False,
        })

        try:
            raw = await invoke(
                SYSTEM_ARCHITECT,
                REVIEW_ITERATION_PROMPT.format(
                    iteration=i,
                    category=category,
                    questionnaire=q_json,
                    current_plan=recommended.model_dump_json(indent=2),
                    previous_findings=previous_findings_text,
                ),
            )
            raw = strip_code_fences(raw)
            result = json.loads(raw)
        except Exception as e:
            logger.warning(f"Review iteration {i} failed: {e}")
            result = {
                "findings": [f"Review failed: {e}"],
                "recommendations": [],
                "risk_level": "low",
                "updated_stack": None,
            }

        finding = ReviewFinding(
            iteration=i,
            category=category,
            findings=result.get("findings", []),
            recommendations=result.get("recommendations", []),
            risk_level=result.get("risk_level", "low"),
        )
        findings.append(finding)

        # Apply stack update if suggested
        if result.get("updated_stack"):
            try:
                recommended = ArchitectureOption(**result["updated_stack"])
            except Exception:
                pass

        previous_findings_text = "\n".join(
            f"- [{f.category}] {item}" for f in findings for item in f.findings
        )

        yield _sse({
            "step": step_num,
            "total": total_steps,
            "message": f"Completed: {category.title()} ({finding.risk_level} risk)",
            "partial": {"finding": finding.model_dump()},
            "done": False,
        })

    # Step 12: Finalize
    yield _sse({"step": 12, "total": total_steps, "message": "Finalizing plan...", "partial": None, "done": False})

    plan = PlanOutput(
        plan_id=str(uuid.uuid4()),
        recommended=recommended,
        alternatives=alternatives,
        review_findings=findings,
        cost_estimate_ai=0.0,
        created_at=datetime.utcnow(),
    )

    yield _sse({
        "step": 12,
        "total": total_steps,
        "message": "Plan complete.",
        "partial": plan.model_dump(mode="json"),
        "done": True,
    })
