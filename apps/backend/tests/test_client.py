"""Tests for AI client module."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from planner.ai.client import invoke, strip_code_fences


@pytest.mark.asyncio
async def test_invoke_returns_text():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=MagicMock(content="  hello world  "))
    with patch("planner.ai.client.get_llm", return_value=mock_llm):
        result = await invoke("system prompt", "user prompt")
    assert result == "hello world"


@pytest.mark.asyncio
async def test_invoke_passes_messages():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=MagicMock(content="response"))
    with patch("planner.ai.client.get_llm", return_value=mock_llm):
        await invoke("sys", "usr")
    args = mock_llm.ainvoke.call_args[0][0]
    assert len(args) == 2


def test_strip_code_fences_json():
    text = '```json\n{"key": "value"}\n```'
    assert strip_code_fences(text) == '{"key": "value"}'


def test_strip_code_fences_python():
    text = "```python\nprint('hi')\n```"
    assert strip_code_fences(text) == "print('hi')"


def test_strip_code_fences_plain():
    text = "```\nsome code\n```"
    assert strip_code_fences(text) == "some code"


def test_strip_code_fences_no_fences():
    text = '{"key": "value"}'
    assert strip_code_fences(text) == '{"key": "value"}'


def test_strip_code_fences_strips_whitespace():
    text = "  plain text  "
    assert strip_code_fences(text) == "plain text"
