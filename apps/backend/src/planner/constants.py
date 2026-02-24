"""Configuration constants."""

# AWS Bedrock model
# Updated to Claude 3.5 Sonnet (current as of Feb 2026)
MODEL_ID = "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
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
