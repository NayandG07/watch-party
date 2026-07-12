# ═══════════════════════════════════════════════════════════════
#  Watch Party Backend — Dockerfile
#  Multi-stage build: builder installs deps, runtime runs app.
#  Final image runs as a non-root user for security.
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Install dependencies ────────────────────────────
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# System build dependencies (gcc needed for some C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages into /install prefix
COPY pyproject.toml .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install .

# ── Stage 2: Runtime image ────────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app" \
    PATH="/install/bin:$PATH"

WORKDIR /app

# Runtime system libraries only (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a dedicated non-root user
RUN groupadd --gid 1001 watchparty && \
    useradd --uid 1001 --gid watchparty \
            --no-create-home --shell /bin/false \
            watchparty

# Copy installed packages from builder
COPY --from=builder /install /install

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Set ownership
RUN chown -R watchparty:watchparty /app

USER watchparty

EXPOSE 8000

# Docker HEALTHCHECK — used by docker-compose and orchestrators
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Production: single worker (the platform serves ≤ 8 users)
CMD ["python", "-m", "uvicorn", "app.main:app", \
     "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
