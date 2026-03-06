"""Tests for finalize_plan Lambda handler."""
import sys
import os
from unittest.mock import MagicMock, patch

_HANDLER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'finalize_plan'))


def _set_path():
    sys.path.insert(0, _HANDLER_DIR)


def test_finalize_plan_writes_to_dynamo():
    _set_path()
    mock_put = MagicMock()

    with patch('handler.put_item', mock_put), \
         patch('handler.app_config'):
        from handler import handler
        result = handler({
            'plan_id': 'test-123',
            'questionnaire': {'name': 'Test'},
            'recommended': {'name': 'Serverless'},
            'alternatives': [],
            'reviewResults': [{'category': 'security', 'finding': 'ok'}],
        }, None)

    assert result is not None
    mock_put.assert_called_once()


def test_finalize_plan_missing_plan_id():
    _set_path()
    with patch('handler.put_item', MagicMock()), \
         patch('handler.app_config'):
        from handler import handler
        result = handler({'questionnaire': {}, 'recommended': {}, 'alternatives': [], 'reviewResults': []}, None)

    assert result is not None
