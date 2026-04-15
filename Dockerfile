# ── Stage 1: dependency install ───────────────────────────────────────────────
FROM python:3.11-slim AS deps

# Install uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy only dependency manifests first (better layer caching)
COPY pyproject.toml uv.lock ./

# Install dependencies into /app/.venv, skip installing the project itself
RUN uv sync --frozen --no-install-project --no-dev

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/

WORKDIR /app

# Copy the pre-built venv from stage 1
COPY --from=deps /app/.venv /app/.venv

# Copy application code
COPY backend/ ./backend/
COPY static/  ./static/

# Make the venv the active Python environment
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
