from planner.config import Settings


def test_settings_defaults():
    """Test settings default values"""
    settings = Settings(anthropic_api_key="test-key")
    
    assert settings.api_title == "Project Planner AI"
    assert settings.api_version == "0.1.0"
    assert settings.debug is False
    assert settings.default_model == "claude-haiku-4-5"
    assert settings.max_tokens == 4096
    assert settings.temperature == 0.3
    assert settings.cache_ttl == 3600
    assert settings.rate_limit_per_hour == 10


def test_settings_custom_values():
    """Test settings with custom values"""
    settings = Settings(
        anthropic_api_key="custom-key",
        debug=True,
        max_tokens=8192,
        rate_limit_per_hour=20
    )
    
    assert settings.anthropic_api_key == "custom-key"
    assert settings.debug is True
    assert settings.max_tokens == 8192
    assert settings.rate_limit_per_hour == 20
