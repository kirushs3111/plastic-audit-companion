from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_guest_session_creates_user(client: TestClient):
    res = client.post("/api/auth/guest")
    assert res.status_code == 201
    body = res.json()
    assert body["is_guest"] is True
    assert body["access_token"]


def test_register_and_login(client: TestClient):
    res = client.post(
        "/api/auth/register",
        json={"email": "a@example.com", "password": "correcthorse123"},
    )
    assert res.status_code == 201

    res = client.post(
        "/api/auth/login", json={"email": "a@example.com", "password": "correcthorse123"}
    )
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_register_duplicate_email_rejected(client: TestClient):
    payload = {"email": "dup@example.com", "password": "correcthorse123"}
    client.post("/api/auth/register", json=payload)
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 409


def test_login_wrong_password_rejected(client: TestClient):
    client.post(
        "/api/auth/register",
        json={"email": "b@example.com", "password": "correcthorse123"},
    )
    res = client.post(
        "/api/auth/login", json={"email": "b@example.com", "password": "wrongpassword"}
    )
    assert res.status_code == 401


def test_weak_password_rejected(client: TestClient):
    res = client.post(
        "/api/auth/register", json={"email": "weak@example.com", "password": "short"}
    )
    assert res.status_code == 422


def test_invalid_email_rejected(client: TestClient):
    res = client.post(
        "/api/auth/register", json={"email": "not-an-email", "password": "correcthorse123"}
    )
    assert res.status_code == 422


def test_me_requires_auth(client: TestClient):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_returns_current_user(client: TestClient, guest_token: str):
    res = client.get("/api/auth/me", headers=auth_headers(guest_token))
    assert res.status_code == 200
    assert res.json()["is_guest"] is True
