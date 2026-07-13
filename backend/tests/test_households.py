from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_create_and_get_household(client: TestClient, guest_token: str):
    res = client.post(
        "/api/households",
        json={"household_name": "Test House", "address": "1 Test St", "city": "Chennai", "number_of_residents": 4},
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 201
    household_id = res.json()["id"]

    res = client.get(f"/api/households/{household_id}", headers=auth_headers(guest_token))
    assert res.status_code == 200
    assert res.json()["household_name"] == "Test House"


def test_household_requires_address(client: TestClient, guest_token: str):
    res = client.post(
        "/api/households",
        json={"household_name": "No Address", "city": "Chennai"},
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 422


def test_household_address_roundtrips(client: TestClient, guest_token: str):
    res = client.post(
        "/api/households",
        json={"household_name": "With Address", "address": "12 Palm Street", "city": "Chennai"},
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 201
    household_id = res.json()["id"]
    assert res.json()["address"] == "12 Palm Street"

    res = client.get(f"/api/households/{household_id}", headers=auth_headers(guest_token))
    assert res.json()["address"] == "12 Palm Street"


def test_household_requires_auth(client: TestClient):
    res = client.post(
        "/api/households", json={"household_name": "X", "address": "1 Test St", "city": "Y"}
    )
    assert res.status_code == 401


def test_cannot_access_another_users_household(client: TestClient, guest_token: str):
    res = client.post(
        "/api/households",
        json={"household_name": "Alice House", "address": "1 Test St", "city": "Chennai"},
        headers=auth_headers(guest_token),
    )
    household_id = res.json()["id"]

    other_guest = client.post("/api/auth/guest").json()["access_token"]
    res = client.get(f"/api/households/{household_id}", headers=auth_headers(other_guest))
    assert res.status_code == 404


def test_list_my_households_only_shows_own(client: TestClient, guest_token: str):
    client.post(
        "/api/households",
        json={"household_name": "Mine", "address": "1 Test St", "city": "Chennai"},
        headers=auth_headers(guest_token),
    )
    other_guest = client.post("/api/auth/guest").json()["access_token"]
    client.post(
        "/api/households",
        json={"household_name": "Not Mine", "address": "1 Test St", "city": "Chennai"},
        headers=auth_headers(other_guest),
    )

    res = client.get("/api/households", headers=auth_headers(guest_token))
    assert res.status_code == 200
    names = [h["household_name"] for h in res.json()]
    assert names == ["Mine"]
