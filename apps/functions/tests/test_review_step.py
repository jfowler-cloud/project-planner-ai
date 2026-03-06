"""Tests for review_step Lambda handler."""
import sys
import os
from unittest.mock import MagicMock, patch

_HANDLER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'review_step'))


def _set_path():
    sys.path.insert(0, _HANDLER_DIR)


def test_review_step_returns_findings():
    _set_path()
    mock_agent = MagicMock()
    mock_agent.return_value = '{"severity": "medium", "finding": "Consider adding WAF"}'

    with patch('handler.Agent') as MockAgent, \
         patch('handler.BedrockModel'), \
         patch('handler.app_config'):
        MockAgent.return_value = mock_agent
        from handler import handler
        result = handler({
            'category': 'security',
            'iteration': 1,
            'questionnaire': {'name': 'Test'},
            'recommended': {'name': 'Serverless'},
            'review_findings': [],
        }, None)

    assert result is not None
