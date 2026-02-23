"""Tests for input validation."""

import pytest
from planner.validation import sanitize_text, validate_repo_name


def test_sanitize_strips_html():
    result = sanitize_text("<b>hello</b>")
    assert "<b>" not in result
    assert "hello" in result


def test_sanitize_rejects_sql():
    with pytest.raises(ValueError, match="SQL"):
        sanitize_text("SELECT * FROM users")


def test_sanitize_rejects_script():
    with pytest.raises(ValueError, match="script"):
        sanitize_text("javascript:alert(1)")


def test_sanitize_clean_text():
    assert sanitize_text("  hello world  ") == "hello world"


def test_validate_repo_name_normalizes():
    assert validate_repo_name("My Cool App!") == "my-cool-app"


def test_validate_repo_name_too_short():
    with pytest.raises(ValueError, match="short"):
        validate_repo_name("a")


def test_validate_repo_name_too_long():
    with pytest.raises(ValueError, match="long"):
        validate_repo_name("a" * 50)


def test_validate_repo_name_strips_leading_trailing_hyphens():
    result = validate_repo_name("--my-app--")
    assert not result.startswith("-")
    assert not result.endswith("-")


def test_validate_repo_name_collapses_hyphens():
    result = validate_repo_name("my---app")
    assert "--" not in result
