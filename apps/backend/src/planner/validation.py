"""Input validation and sanitization."""

import logging
import re

logger = logging.getLogger(__name__)

# Patterns to reject
_HTML_PATTERN = re.compile(r"<[^>]+>")
_SQL_PATTERN = re.compile(
    r"\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT)\b", re.IGNORECASE
)
_SCRIPT_PATTERN = re.compile(r"javascript\s*:", re.IGNORECASE)


def sanitize_text(text: str) -> str:
    """Strip HTML tags and reject obvious injection attempts."""
    if _HTML_PATTERN.search(text):
        text = _HTML_PATTERN.sub("", text)
        logger.warning("HTML tags stripped from input")
    if _SQL_PATTERN.search(text):
        raise ValueError("Input contains disallowed SQL keywords")
    if _SCRIPT_PATTERN.search(text):
        raise ValueError("Input contains disallowed script content")
    return text.strip()


def validate_repo_name(name: str) -> str:
    """Validate and normalise a GitHub repo name."""
    name = name.lower().strip()
    name = re.sub(r"[^a-z0-9-]", "-", name)
    name = re.sub(r"-{2,}", "-", name)
    name = name.strip("-")
    if len(name) < 2:
        raise ValueError("Repo name too short after normalisation")
    if len(name) > 40:
        raise ValueError("Repo name too long (max 40 chars)")
    return name
