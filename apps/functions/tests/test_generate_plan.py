"""Tests for generate_plan Lambda handler."""
import sys
import os
from unittest.mock import MagicMock, patch

_HANDLER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'generate_plan'))


def _set_path():
    sys.path.insert(0, _HANDLER_DIR)


def test_generate_plan_returns_recommended():
    _set_path()
    mock_agent = MagicMock()
    mock_agent.return_value = '{"name": "Serverless", "services": ["Lambda", "DynamoDB"]}'

    with patch('handler.Agent') as MockAgent, \
         patch('handler.BedrockModel'), \
         patch('handler.app_config'):
        MockAgent.return_value = mock_agent
        from handler import handler
        result = handler({'questionnaire': {'name': 'Test', 'description': 'A test project'}}, None)

    assert 'recommended' in result or 'plan_id' in result


def test_generate_plan_empty_questionnaire():
    _set_path()
    mock_agent = MagicMock()
    mock_agent.return_value = '{}'

    with patch('handler.Agent') as MockAgent, \
         patch('handler.BedrockModel'), \
         patch('handler.app_config'):
        MockAgent.return_value = mock_agent
        from handler import handler
        result = handler({'questionnaire': {}}, None)

    assert result is not None
