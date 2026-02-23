"""Bedrock/Claude client wrapper."""

import logging
import os
from functools import lru_cache

from langchain_aws import ChatBedrock
from langchain_core.messages import HumanMessage, SystemMessage

from ..constants import MAX_TOKENS, MODEL_ID, TEMPERATURE

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_llm() -> ChatBedrock:
    """Return a cached Bedrock LLM client."""
    return ChatBedrock(
        model_id=os.getenv("BEDROCK_MODEL_ID", MODEL_ID),
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        model_kwargs={"temperature": TEMPERATURE, "max_tokens": MAX_TOKENS},
    )


async def invoke(system: str, user: str) -> str:
    """Invoke the LLM and return the text response."""
    llm = get_llm()
    messages = [SystemMessage(content=system), HumanMessage(content=user)]
    response = await llm.ainvoke(messages)
    return response.content.strip()


def strip_code_fences(text: str) -> str:
    """Strip markdown code fences from LLM response."""
    for fence in ("```json", "```python", "```"):
        if fence in text:
            after = text.split(fence, 1)[1]
            return after.split("```", 1)[0].strip()
    return text.strip()
