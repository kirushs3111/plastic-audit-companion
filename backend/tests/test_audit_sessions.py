from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def _make_household_and_session(client: TestClient, token: str) -> tuple[str, str]:
    hh = client.post(
        "/api/households",
        json={"household_name": "Test House", "address": "1 Test St", "city": "Chennai"},
        headers=auth_headers(token),
    ).json()
    session = client.post(
        "/api/audit-sessions",
        json={"household_id": hh["id"]},
        headers=auth_headers(token),
    ).json()
    return hh["id"], session["id"]


def test_create_session_requires_owned_household(client: TestClient, guest_token: str):
    other_guest = client.post("/api/auth/guest").json()["access_token"]
    hh_id, _ = _make_household_and_session(client, guest_token)

    res = client.post(
        "/api/audit-sessions",
        json={"household_id": hh_id},
        headers=auth_headers(other_guest),
    )
    assert res.status_code == 404


def test_add_known_entry(client: TestClient, guest_token: str):
    _, session_id = _make_household_and_session(client, guest_token)
    res = client.post(
        f"/api/audit-sessions/{session_id}/entries",
        json={
            "room": "kitchen",
            "item": "bottle",
            "identification_method": "known",
            "plastic_code": 1,
            "quantity": 5,
            "photos": [],
        },
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["plastic_code"] == 1
    assert body["needs_review"] is False


def test_known_entry_without_code_rejected(client: TestClient, guest_token: str):
    _, session_id = _make_household_and_session(client, guest_token)
    res = client.post(
        f"/api/audit-sessions/{session_id}/entries",
        json={
            "room": "kitchen",
            "item": "toy",
            "identification_method": "known",
            "quantity": 1,
            "photos": [],
        },
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 422


def test_pending_review_without_photos_rejected(client: TestClient, guest_token: str):
    _, session_id = _make_household_and_session(client, guest_token)
    res = client.post(
        f"/api/audit-sessions/{session_id}/entries",
        json={
            "room": "kitchen",
            "item": "toy",
            "identification_method": "pending-review",
            "quantity": 1,
            "photos": [],
        },
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 422


def test_pending_review_with_photo_succeeds(client: TestClient, guest_token: str):
    _, session_id = _make_household_and_session(client, guest_token)
    res = client.post(
        f"/api/audit-sessions/{session_id}/entries",
        json={
            "room": "garage",
            "item": "container",
            "identification_method": "pending-review",
            "quantity": 2,
            "photos": [{"slot": "front", "storage_url": "/uploads/fake.jpg"}],
        },
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["plastic_code"] is None
    assert body["needs_review"] is True
    assert len(body["photos"]) == 1


def test_delete_entry(client: TestClient, guest_token: str):
    _, session_id = _make_household_and_session(client, guest_token)
    entry = client.post(
        f"/api/audit-sessions/{session_id}/entries",
        json={
            "room": "kitchen",
            "item": "bottle",
            "identification_method": "known",
            "plastic_code": 1,
            "quantity": 1,
            "photos": [],
        },
        headers=auth_headers(guest_token),
    ).json()

    res = client.delete(
        f"/api/audit-sessions/{session_id}/entries/{entry['id']}",
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 204

    session = client.get(
        f"/api/audit-sessions/{session_id}", headers=auth_headers(guest_token)
    ).json()
    assert session["entries"] == []


def test_submit_requires_at_least_one_entry(client: TestClient, guest_token: str):
    _, session_id = _make_household_and_session(client, guest_token)
    res = client.post(
        f"/api/audit-sessions/{session_id}/submit", headers=auth_headers(guest_token)
    )
    assert res.status_code == 400


def test_submit_then_cannot_add_or_resubmit(client: TestClient, guest_token: str):
    _, session_id = _make_household_and_session(client, guest_token)
    client.post(
        f"/api/audit-sessions/{session_id}/entries",
        json={
            "room": "kitchen",
            "item": "bottle",
            "identification_method": "known",
            "plastic_code": 1,
            "quantity": 1,
            "photos": [],
        },
        headers=auth_headers(guest_token),
    )
    res = client.post(
        f"/api/audit-sessions/{session_id}/submit", headers=auth_headers(guest_token)
    )
    assert res.status_code == 200
    assert res.json()["submitted_at"] is not None

    res = client.post(
        f"/api/audit-sessions/{session_id}/submit", headers=auth_headers(guest_token)
    )
    assert res.status_code == 400

    res = client.post(
        f"/api/audit-sessions/{session_id}/entries",
        json={
            "room": "kitchen",
            "item": "bag",
            "identification_method": "known",
            "plastic_code": 4,
            "quantity": 1,
            "photos": [],
        },
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 400


def test_list_sessions_summary(client: TestClient, guest_token: str):
    _, session_id = _make_household_and_session(client, guest_token)
    client.post(
        f"/api/audit-sessions/{session_id}/entries",
        json={
            "room": "kitchen",
            "item": "bottle",
            "identification_method": "known",
            "plastic_code": 1,
            "quantity": 7,
            "photos": [],
        },
        headers=auth_headers(guest_token),
    )

    res = client.get("/api/audit-sessions", headers=auth_headers(guest_token))
    assert res.status_code == 200
    summary = res.json()[0]
    assert summary["entry_count"] == 1
    assert summary["total_items"] == 7


def test_cannot_access_another_users_session(client: TestClient, guest_token: str):
    _, session_id = _make_household_and_session(client, guest_token)
    other_guest = client.post("/api/auth/guest").json()["access_token"]

    res = client.get(f"/api/audit-sessions/{session_id}", headers=auth_headers(other_guest))
    assert res.status_code == 404
