import os

# Point the app at a dedicated test database BEFORE importing anything
# from `app` - settings are cached via lru_cache on first access.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/pac_test",
)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401 - registers all models on Base.metadata
from app.core.config import get_settings
from app.core.database import Base
from app.core.limiter import limiter
from app.main import app

# The real rate limiter is keyed by client IP, and every TestClient request
# appears to come from the same fake IP - without disabling it here, tests
# beyond the 4th or 5th auth call in a run would start failing with 429s
# that have nothing to do with what's actually being tested.
limiter.enabled = False

settings = get_settings()
engine = create_engine(settings.database_url)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def reset_database():
    """Drop and recreate all tables before every test for full isolation."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def guest_token(client: TestClient) -> str:
    res = client.post("/api/auth/guest")
    assert res.status_code == 201
    return res.json()["access_token"]


@pytest.fixture
def registered_user(client: TestClient) -> dict:
    """Registers a user and returns {token, email, password}."""
    email = "test.user@example.com"
    password = "correcthorse123"
    res = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "display_name": "Test User"},
    )
    assert res.status_code == 201
    return {"token": res.json()["access_token"], "email": email, "password": password}


@pytest.fixture
def admin_token(client: TestClient, registered_user: dict) -> str:
    """Registers a user, then promotes it to admin directly via the DB."""
    with engine.connect() as conn:
        conn.execute(
            text("UPDATE users SET is_admin = true WHERE email = :email"),
            {"email": registered_user["email"]},
        )
        conn.commit()
    return registered_user["token"]
