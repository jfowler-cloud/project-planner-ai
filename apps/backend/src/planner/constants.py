"""Configuration constants."""

# AWS Bedrock model — see config.py for per-tier model selection
# This constant is kept for reference only; active model IDs are in ClaudeClient
MAX_TOKENS = 4096
TEMPERATURE = 0.3

# AI pipeline
REVIEW_ITERATIONS = 10
MAX_ARCHITECTURE_OPTIONS = 5

# Cache
CACHE_TTL_SECONDS = 3600
CACHE_MAX_SIZE = 100

# Rate limiting
RATE_LIMIT_PER_MINUTE = 5
RATE_LIMIT_PER_HOUR = 10

# Cost alert threshold (USD)
COST_ALERT_THRESHOLD = 5.0

# Input limits
MAX_DESCRIPTION_LENGTH = 500
MAX_USERS_LENGTH = 200

# GitHub
GITHUB_API_URL = "https://api.github.com"
REPO_SCOPE_REQUIRED = "repo"
