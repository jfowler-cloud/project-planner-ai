"""Bedrock client wrapper — Strands replaces LangChain."""

import logging
import os

from strands import Agent
from strands.models.bedrock import BedrockModel

from ..constants import MAX_TOKENS, TEMPERATURE

logger = logging.getLogger(__name__)

_MODEL_MAP = {
    "testing":   "us.anthropic.claude-haiku-4-5-20251001-v1:0",
    "optimized": "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
    "premium":   "us.anthropic.claude-opus-4-5-20251101-v1:0",
}


def _model_id() -> str:
    tier = os.getenv("DEPLOYMENT_TIER", "testing")
    return os.getenv("BEDROCK_MODEL_ID") or _MODEL_MAP.get(tier, _MODEL_MAP["testing"])


async def invoke(system: str, user: str) -> str:
    """Invoke Bedrock via Strands and return the text response."""
    model = BedrockModel(
        model_id=_model_id(),
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
    )
    agent = Agent(model=model, system_prompt=system)
    return str(agent(user)).strip()


def strip_code_fences(text: str) -> str:
    """Strip markdown code fences from LLM response."""
    for fence in ("```json", "```python", "```"):
        if fence in text:
            after = text.split(fence, 1)[1]
            return after.split("```", 1)[0].strip()
    return text.strip()
