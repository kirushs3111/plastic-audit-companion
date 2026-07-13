import io

from fastapi.testclient import TestClient

from tests.conftest import auth_headers

JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00" + b"\x00" * 100


def _create_pending_entry_with_photo(client: TestClient, token: str) -> str:
    """Returns the photo's id (not its URL)."""
    hh = client.post(
        "/api/households",
        json={"household_name": "Test House", "address": "1 Test St", "city": "Chennai"},
        headers=auth_headers(token),
    ).json()
    session = client.post(
        "/api/audit-sessions", json={"household_id": hh["id"]}, headers=auth_headers(token)
    ).json()

    upload = client.post(
        "/api/photos/upload",
        files={"file": ("bottle.jpg", io.BytesIO(JPEG_BYTES), "image/jpeg")},
        headers=auth_headers(token),
    ).json()

    entry = client.post(
        f"/api/audit-sessions/{session['id']}/entries",
        json={
            "room": "garage",
            "item": "container",
            "identification_method": "pending-review",
            "quantity": 1,
            "photos": [{"slot": "front", "storage_url": upload["storage_url"]}],
        },
        headers=auth_headers(token),
    ).json()
    return entry["photos"][0]["id"]


def test_photo_response_url_is_the_authenticated_endpoint_not_a_raw_path(
    client: TestClient, guest_token: str
):
    photo_id = _create_pending_entry_with_photo(client, guest_token)
    # The URL returned to clients must be the authenticated endpoint -
    # never the bare /uploads/... disk path, which would be servable by
    # anyone with the link and no login at all.
    session_list = client.get("/api/audit-sessions", headers=auth_headers(guest_token))
    assert session_list.status_code == 200
    # (fetch the full session to inspect the photo URL shape)
    sessions = client.get("/api/audit-sessions", headers=auth_headers(guest_token)).json()
    session_id = sessions[0]["id"]
    full = client.get(f"/api/audit-sessions/{session_id}", headers=auth_headers(guest_token)).json()
    photo_url = full["entries"][0]["photos"][0]["storage_url"]
    assert photo_url == f"/api/photos/{photo_id}/file"
    assert not photo_url.startswith("/uploads/")


def test_owner_can_view_their_own_photo(client: TestClient, guest_token: str):
    photo_id = _create_pending_entry_with_photo(client, guest_token)
    res = client.get(f"/api/photos/{photo_id}/file", headers=auth_headers(guest_token))
    assert res.status_code == 200
    assert res.content.startswith(b"\xff\xd8\xff")


def test_photo_requires_auth_at_all(client: TestClient, guest_token: str):
    """The core gap being fixed: previously a photo could be viewed by
    anyone with the URL, no login required at all."""
    photo_id = _create_pending_entry_with_photo(client, guest_token)
    res = client.get(f"/api/photos/{photo_id}/file")
    assert res.status_code == 401


def test_other_user_cannot_view_someone_elses_photo(client: TestClient, guest_token: str):
    photo_id = _create_pending_entry_with_photo(client, guest_token)
    other_guest = client.post("/api/auth/guest").json()["access_token"]

    res = client.get(f"/api/photos/{photo_id}/file", headers=auth_headers(other_guest))
    assert res.status_code == 404


def test_admin_can_view_any_photo(client: TestClient, guest_token: str, admin_token: str):
    photo_id = _create_pending_entry_with_photo(client, guest_token)
    res = client.get(f"/api/photos/{photo_id}/file", headers=auth_headers(admin_token))
    assert res.status_code == 200
    assert res.content.startswith(b"\xff\xd8\xff")


def test_nonexistent_photo_id_returns_404(client: TestClient, guest_token: str):
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = client.get(f"/api/photos/{fake_id}/file", headers=auth_headers(guest_token))
    assert res.status_code == 404
