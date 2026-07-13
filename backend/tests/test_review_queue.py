from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def _make_pending_entry(client: TestClient, token: str) -> str:
    hh = client.post(
        "/api/households",
        json={"household_name": "Test House", "address": "1 Test St", "city": "Chennai"},
        headers=auth_headers(token),
    ).json()
    session = client.post(
        "/api/audit-sessions", json={"household_id": hh["id"]}, headers=auth_headers(token)
    ).json()
    entry = client.post(
        f"/api/audit-sessions/{session['id']}/entries",
        json={
            "room": "garage",
            "item": "pipe",
            "identification_method": "pending-review",
            "quantity": 1,
            "photos": [{"slot": "front", "storage_url": "/uploads/fake.jpg"}],
        },
        headers=auth_headers(token),
    ).json()
    return entry["id"]


def test_review_queue_requires_admin(client: TestClient, guest_token: str):
    res = client.get("/api/review-queue", headers=auth_headers(guest_token))
    assert res.status_code == 403


def test_review_queue_requires_auth(client: TestClient):
    res = client.get("/api/review-queue")
    assert res.status_code == 401


def test_admin_sees_pending_entry(client: TestClient, guest_token: str, admin_token: str):
    entry_id = _make_pending_entry(client, guest_token)

    res = client.get("/api/review-queue", headers=auth_headers(admin_token))
    assert res.status_code == 200
    ids = [e["id"] for e in res.json()]
    assert entry_id in ids


def test_admin_assigns_type_and_queue_clears(client: TestClient, guest_token: str, admin_token: str):
    entry_id = _make_pending_entry(client, guest_token)

    res = client.post(
        f"/api/review-queue/{entry_id}/assign",
        json={"plastic_code": 3},
        headers=auth_headers(admin_token),
    )
    assert res.status_code == 200
    assert res.json()["plastic_code"] == 3
    assert res.json()["needs_review"] is False

    res = client.get("/api/review-queue", headers=auth_headers(admin_token))
    ids = [e["id"] for e in res.json()]
    assert entry_id not in ids


def test_cannot_reassign_already_reviewed_entry(client: TestClient, guest_token: str, admin_token: str):
    entry_id = _make_pending_entry(client, guest_token)
    client.post(
        f"/api/review-queue/{entry_id}/assign",
        json={"plastic_code": 3},
        headers=auth_headers(admin_token),
    )
    res = client.post(
        f"/api/review-queue/{entry_id}/assign",
        json={"plastic_code": 5},
        headers=auth_headers(admin_token),
    )
    assert res.status_code == 400
