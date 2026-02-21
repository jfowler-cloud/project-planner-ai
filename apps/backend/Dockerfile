FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies
RUN uv sync && uv pip install -e "."

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 8000

# Run application
CMD ["uv", "run", "python", "src/main.py"]
