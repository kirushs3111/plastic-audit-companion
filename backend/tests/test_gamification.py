from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def _make_household(client: TestClient, token: str, name: str = "Test House") -> str:
    return client.post(
        "/api/households",
        json={"household_name": name, "address": "1 Test St", "city": "Chennai"},
        headers=auth_headers(token),
    ).json()["id"]


def _submit_entries(client: TestClient, token: str, household_id: str, entries: list[dict]) -> None:
    session = client.post(
        "/api/audit-sessions", json={"household_id": household_id}, headers=auth_headers(token)
    ).json()
    for entry in entries:
        res = client.post(
            f"/api/audit-sessions/{session['id']}/entries",
            json=entry,
            headers=auth_headers(token),
        )
        assert res.status_code == 201, res.text
    res = client.post(f"/api/audit-sessions/{session['id']}/submit", headers=auth_headers(token))
    assert res.status_code == 200, res.text


def _known_entry(room: str, item: str, code: int, qty: int) -> dict:
    return {
        "room": room,
        "item": item,
        "identification_method": "known",
        "plastic_code": code,
        "quantity": qty,
        "photos": [],
    }


def test_hunts_start_at_zero_progress(client: TestClient, guest_token: str):
    res = client.get("/api/hunts", headers=auth_headers(guest_token))
    assert res.status_code == 200
    hunts = {h["plastic_code"]: h for h in res.json()["hunts"]}
    assert len(hunts) == 7
    assert hunts[1]["abbreviation"] == "PET"
    assert hunts[1]["progress"] == 0
    assert hunts[1]["completed"] is False


def test_hunt_completes_at_target_quantity(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    _submit_entries(client, guest_token, hh, [_known_entry("kitchen", "bottle", 1, 5)])

    res = client.get("/api/hunts", headers=auth_headers(guest_token))
    hunts = {h["plastic_code"]: h for h in res.json()["hunts"]}
    assert hunts[1]["progress"] == 5
    assert hunts[1]["completed"] is True
    # other types remain untouched
    assert hunts[2]["completed"] is False


def test_hunt_progress_caps_at_target_even_if_more_logged(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    _submit_entries(client, guest_token, hh, [_known_entry("kitchen", "bottle", 1, 12)])

    res = client.get("/api/hunts", headers=auth_headers(guest_token))
    hunts = {h["plastic_code"]: h for h in res.json()["hunts"]}
    assert hunts[1]["progress"] == 5
    assert hunts[1]["completed"] is True


def test_badges_all_locked_with_no_audits(client: TestClient, guest_token: str):
    res = client.get("/api/badges", headers=auth_headers(guest_token))
    assert res.status_code == 200
    badges = {b["id"]: b for b in res.json()["badges"]}
    assert badges["first-steps"]["earned"] is False
    assert badges["century-club"]["progress"] == 0


def test_first_steps_badge_earned_after_one_submit(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    _submit_entries(client, guest_token, hh, [_known_entry("kitchen", "bottle", 1, 1)])

    res = client.get("/api/badges", headers=auth_headers(guest_token))
    badges = {b["id"]: b for b in res.json()["badges"]}
    assert badges["first-steps"]["earned"] is True


def test_century_club_requires_100_items(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    _submit_entries(client, guest_token, hh, [_known_entry("kitchen", "bottle", 1, 99)])

    res = client.get("/api/badges", headers=auth_headers(guest_token))
    badges = {b["id"]: b for b in res.json()["badges"]}
    assert badges["century-club"]["earned"] is False
    assert badges["century-club"]["progress"] == 99

    hh2 = _make_household(client, guest_token, "House 2")
    _submit_entries(client, guest_token, hh2, [_known_entry("kitchen", "bottle", 1, 1)])

    res = client.get("/api/badges", headers=auth_headers(guest_token))
    badges = {b["id"]: b for b in res.json()["badges"]}
    assert badges["century-club"]["earned"] is True
    assert badges["century-club"]["progress"] == 100


def test_resin_ranger_requires_all_7_types(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    entries = [_known_entry("kitchen", "bottle", code, 1) for code in range(1, 7)]
    _submit_entries(client, guest_token, hh, entries)

    res = client.get("/api/badges", headers=auth_headers(guest_token))
    badges = {b["id"]: b for b in res.json()["badges"]}
    assert badges["resin-ranger"]["earned"] is False
    assert badges["resin-ranger"]["progress"] == 6

    hh2 = _make_household(client, guest_token, "House 2")
    _submit_entries(client, guest_token, hh2, [_known_entry("kitchen", "bottle", 7, 1)])

    res = client.get("/api/badges", headers=auth_headers(guest_token))
    badges = {b["id"]: b for b in res.json()["badges"]}
    assert badges["resin-ranger"]["earned"] is True


def test_full_house_requires_all_7_rooms(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    rooms = ["kitchen", "bedroom", "bathroom", "living-room", "garden", "garage", "other"]
    entries = [_known_entry(room, "bottle", 1, 1) for room in rooms]
    _submit_entries(client, guest_token, hh, entries)

    res = client.get("/api/badges", headers=auth_headers(guest_token))
    badges = {b["id"]: b for b in res.json()["badges"]}
    assert badges["full-house"]["earned"] is True
    assert badges["full-house"]["progress"] == 7


def test_plastic_detective_badge_counts_pending_review_items(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    session = client.post(
        "/api/audit-sessions", json={"household_id": hh}, headers=auth_headers(guest_token)
    ).json()
    for _ in range(5):
        res = client.post(
            f"/api/audit-sessions/{session['id']}/entries",
            json={
                "room": "garage",
                "item": "container",
                "identification_method": "pending-review",
                "quantity": 1,
                "photos": [{"slot": "front", "storage_url": "/uploads/fake.jpg"}],
            },
            headers=auth_headers(guest_token),
        )
        assert res.status_code == 201
    client.post(f"/api/audit-sessions/{session['id']}/submit", headers=auth_headers(guest_token))

    res = client.get("/api/badges", headers=auth_headers(guest_token))
    badges = {b["id"]: b for b in res.json()["badges"]}
    assert badges["plastic-detective"]["earned"] is True
    assert badges["plastic-detective"]["progress"] == 5


def test_badges_only_count_own_submitted_audits(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    # unsubmitted session shouldn't count toward badges
    client.post("/api/audit-sessions", json={"household_id": hh}, headers=auth_headers(guest_token))

    res = client.get("/api/badges", headers=auth_headers(guest_token))
    badges = {b["id"]: b for b in res.json()["badges"]}
    assert badges["first-steps"]["earned"] is False

    other_guest = client.post("/api/auth/guest").json()["access_token"]
    other_hh = _make_household(client, other_guest, "Other House")
    _submit_entries(client, other_guest, other_hh, [_known_entry("kitchen", "bottle", 1, 50)])

    # the first guest's badges shouldn't be affected by another user's audits
    res = client.get("/api/badges", headers=auth_headers(guest_token))
    badges = {b["id"]: b for b in res.json()["badges"]}
    assert badges["century-club"]["progress"] == 0


def test_passport_requires_owned_household(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    other_guest = client.post("/api/auth/guest").json()["access_token"]

    res = client.get(f"/api/households/{hh}/passport", headers=auth_headers(other_guest))
    assert res.status_code == 404


def test_passport_groups_by_month_and_plastic_type(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    _submit_entries(
        client,
        guest_token,
        hh,
        [_known_entry("kitchen", "bottle", 1, 10), _known_entry("bathroom", "bottle", 2, 3)],
    )

    res = client.get(f"/api/households/{hh}/passport", headers=auth_headers(guest_token))
    assert res.status_code == 200
    body = res.json()
    assert body["household_id"] == hh
    assert len(body["months"]) == 1
    month = body["months"][0]
    assert month["total_items"] == 13
    by_code = {e["plastic_code"]: e["quantity"] for e in month["by_plastic_type"]}
    assert by_code == {1: 10, 2: 3}


def test_passport_excludes_pending_review_entries(client: TestClient, guest_token: str):
    hh = _make_household(client, guest_token)
    session = client.post(
        "/api/audit-sessions", json={"household_id": hh}, headers=auth_headers(guest_token)
    ).json()
    client.post(
        f"/api/audit-sessions/{session['id']}/entries",
        json={
            "room": "garage",
            "item": "container",
            "identification_method": "pending-review",
            "quantity": 4,
            "photos": [{"slot": "front", "storage_url": "/uploads/fake.jpg"}],
        },
        headers=auth_headers(guest_token),
    )
    client.post(f"/api/audit-sessions/{session['id']}/submit", headers=auth_headers(guest_token))

    res = client.get(f"/api/households/{hh}/passport", headers=auth_headers(guest_token))
    assert res.json()["months"] == []
