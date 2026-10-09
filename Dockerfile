# ==============================================================================
# EVENTOPS-2026 Production Container Dockerfile for FastAPI Cloud & Cloud Run
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency specifications first for Docker layer caching
COPY requirements.txt pyproject.toml ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy root entrypoint, cloud Procfile, and backend source code
COPY main.py ./
COPY Procfile ./
COPY backend ./backend

# Expose default HTTP port
EXPOSE 8000

# Default production startup command using official FastAPI CLI runner
CMD ["fastapi", "run", "main.py", "--port", "8000"]
