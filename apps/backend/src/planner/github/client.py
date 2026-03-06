
import httpx

from ..config import settings


def get_github_token(header_token: str | None = None) -> str:
    """Resolve GitHub token from request header or settings, raising if missing."""
    token = header_token or settings.github_token
    if not token:
        raise ValueError("GitHub token is required. Provide it via the X-GitHub-Token header.")
    return token


class GitHubClient:
    """Client for GitHub API"""

    def __init__(self, token: str | None = None):
        self.token = token or settings.github_token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json"
        }

    async def create_repository(
        self,
        name: str,
        description: str,
        private: bool = True
    ) -> dict:
        """Create a new GitHub repository"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/user/repos",
                headers=self.headers,
                json={
                    "name": name,
                    "description": description,
                    "private": private,
                    "auto_init": True
                }
            )
            response.raise_for_status()
            return response.json()

    async def create_file(
        self,
        repo_full_name: str,
        path: str,
        content: str,
        message: str
    ) -> dict:
        """Create a file in repository"""
        import base64

        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/repos/{repo_full_name}/contents/{path}",
                headers=self.headers,
                json={
                    "message": message,
                    "content": base64.b64encode(content.encode()).decode()
                }
            )
            response.raise_for_status()
            return response.json()
