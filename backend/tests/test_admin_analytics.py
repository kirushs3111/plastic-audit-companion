import csv
import io

from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def _submit_one_known_entry(client: TestClient, token: str) -> None:
    hh = client.post(
        "/api/households",
        json={"household_name": "Test House", "address": "1 Test St", "city": "Chennai"},
        headers=auth_headers(token),
    ).json()
    session = client.post(
        "/api/audit-sessions", json={"household_id": hh["id"]}, headers=auth_headers(token)
    ).json()
    client.post(
        f"/api/audit-sessions/{session['id']}/entries",
        json={
            "room": "kitchen",
            "item": "bottle",
            "identification_method": "known",
            "plastic_code": 1,
            "quantity": 6,
            "photos": [],
        },
        headers=auth_headers(token),
    )
    client.post(f"/api/audit-sessions/{session['id']}/submit", headers=auth_headers(token))


def test_overview_requires_admin(client: TestClient, guest_token: str):
    res = client.get("/api/admin/overview", headers=auth_headers(guest_token))
    assert res.status_code == 403


def test_overview_counts_are_correct(client: TestClient, guest_token: str, admin_token: str):
    _submit_one_known_entry(client, guest_token)

    res = client.get("/api/admin/overview", headers=auth_headers(admin_token))
    assert res.status_code == 200
    body = res.json()
    assert body["total_entries"] == 1
    assert body["total_items"] == 6
    assert body["submitted_audit_sessions"] == 1
    assert body["by_plastic_type"][0]["plastic_code"] == 1
    assert body["by_plastic_type"][0]["total_quantity"] == 6
    assert body["by_room"][0]["room"] == "kitchen"


def test_csv_export_requires_admin(client: TestClient, guest_token: str):
    res = client.get("/api/admin/export.csv", headers=auth_headers(guest_token))
    assert res.status_code == 403


def test_csv_export_neutralizes_formula_injection(client: TestClient, guest_token: str, admin_token: str):
    """A household name starting with '=' could execute as a formula if
    an admin opens the export in Excel/Google Sheets (CWE-1236) - the
    export must prefix it with a quote to force literal-text treatment."""
    hh = client.post(
        "/api/households",
        json={
            "household_name": "=cmd|'/c calc'!A1",
            "address": "+1+1",
            "city": "@SUM(1+1)",
        },
        headers=auth_headers(guest_token),
    ).json()
    session = client.post(
        "/api/audit-sessions", json={"household_id": hh["id"]}, headers=auth_headers(guest_token)
    ).json()
    client.post(
        f"/api/audit-sessions/{session['id']}/entries",
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
    client.post(f"/api/audit-sessions/{session['id']}/submit", headers=auth_headers(guest_token))

    res = client.get("/api/admin/export.csv", headers=auth_headers(admin_token))
    reader = csv.reader(io.StringIO(res.text))
    rows = list(reader)
    data_row = rows[1]
    assert data_row[1] == "'=cmd|'/c calc'!A1"
    assert data_row[2] == "'+1+1"
    assert data_row[3] == "'@SUM(1+1)"
    # Confirm none of the raw dangerous values slipped through unprefixed.
    assert not data_row[1].startswith("=")
    assert not data_row[2].startswith("+")
    assert not data_row[3].startswith("@")


def test_csv_export_contains_entry_row(client: TestClient, guest_token: str, admin_token: str):
    _submit_one_known_entry(client, guest_token)

    res = client.get("/api/admin/export.csv", headers=auth_headers(admin_token))
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")

    reader = csv.reader(io.StringIO(res.text))
    rows = list(reader)
    assert rows[0][0] == "entry_id"
    assert len(rows) == 2
    assert rows[1][4] == "kitchen"  # room
    assert rows[1][6] == "1"  # plastic_code
    assert rows[1][7] == "6"  # quantity
