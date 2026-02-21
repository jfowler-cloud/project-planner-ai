import pytest
from unittest.mock import AsyncMock, patch, Mock
from planner.github.client import GitHubClient


@pytest.mark.asyncio
async def test_create_repository():
    """Test repository creation"""
    client = GitHubClient("test-token")
    
    mock_response = Mock()
    mock_response.json.return_value = {
        "full_name": "user/test-repo",
        "html_url": "https://github.com/user/test-repo"
    }
    
    with patch('httpx.AsyncClient') as MockClient:
        mock_client = MockClient.return_value.__aenter__.return_value
        mock_client.post = AsyncMock(return_value=mock_response)
        
        result = await client.create_repository(
            name="test-repo",
            description="Test repository",
            private=True
        )
        
        assert result["full_name"] == "user/test-repo"
        mock_client.post.assert_called_once()


@pytest.mark.asyncio
async def test_create_file():
    """Test file creation in repository"""
    client = GitHubClient("test-token")
    
    mock_response = Mock()
    mock_response.json.return_value = {"content": {"path": "test.txt"}}
    
    with patch('httpx.AsyncClient') as MockClient:
        mock_client = MockClient.return_value.__aenter__.return_value
        mock_client.put = AsyncMock(return_value=mock_response)
        
        result = await client.create_file(
            repo_full_name="user/test-repo",
            path="test.txt",
            content="Hello World",
            message="Add test file"
        )
        
        assert "content" in result
        mock_client.put.assert_called_once()


def test_github_client_initialization():
    """Test GitHub client initialization"""
    client = GitHubClient("custom-token")
    assert client.token == "custom-token"
    assert "Authorization" in client.headers
    assert client.headers["Authorization"] == "token custom-token"


def test_github_client_default_token():
    """Test GitHub client with default token from settings"""
    with patch('planner.github.client.settings') as mock_settings:
        mock_settings.github_token = "default-token"
        client = GitHubClient()
        assert client.token == "default-token"
