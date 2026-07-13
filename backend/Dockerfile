FROM python:3.12-slim

WORKDIR /app

# psycopg2-binary needs libpq at runtime; build-essential covers any
# wheels that fall back to source builds on a given platform.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Uploaded photos persist here - mount a volume at this path in production
# so they survive container restarts/redeploys.
RUN mkdir -p uploads

EXPOSE 8000

# Run migrations, then start the server. Railway/Render set $PORT; default
# to 8000 for local `docker run`.
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
