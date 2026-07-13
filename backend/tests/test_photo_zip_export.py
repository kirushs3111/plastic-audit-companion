import io
import zipfile

from fastapi.testclient import TestClient

from tests.conftest import auth_headers

JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00" + b"\x00" * 100


def _create_pending_entry_with_photo(
    client: TestClient, token: str, household_name: str = "Test House"
) -> None:
    hh = client.post(
        "/api/households",
        json={"household_name": household_name, "address": "1 Test St", "city": "Chennai"},
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
    client.post(
        f"/api/audit-sessions/{session['id']}/entries",
        json={
            "room": "garage",
            "item": "container",
            "identification_method": "pending-review",
            "quantity": 1,
            "photos": [{"slot": "front", "storage_url": upload["storage_url"]}],
        },
        headers=auth_headers(token),
    )


def test_photo_zip_export_requires_admin(client: TestClient, guest_token: str):
    res = client.get("/api/admin/export-photos.zip", headers=auth_headers(guest_token))
    assert res.status_code == 403


def test_photo_zip_export_requires_auth(client: TestClient):
    res = client.get("/api/admin/export-photos.zip")
    assert res.status_code == 401


def test_photo_zip_contains_uploaded_photo(client: TestClient, guest_token: str, admin_token: str):
    _create_pending_entry_with_photo(client, guest_token, "The Martins")

    res = client.get("/api/admin/export-photos.zip", headers=auth_headers(admin_token))
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"

    zf = zipfile.ZipFile(io.BytesIO(res.content))
    names = zf.namelist()
    assert len(names) == 1
    assert names[0].startswith("The Martins/")
    assert names[0].endswith(".jpg")

    # the actual bytes inside the zip should be the real uploaded photo
    extracted = zf.read(names[0])
    assert extracted.startswith(b"\xff\xd8\xff")


def test_photo_zip_export_empty_when_no_photos(client: TestClient, admin_token: str):
    res = client.get("/api/admin/export-photos.zip", headers=auth_headers(admin_token))
    assert res.status_code == 200
    zf = zipfile.ZipFile(io.BytesIO(res.content))
    assert zf.namelist() == []


def test_photo_zip_neutralizes_zip_slip_household_name(
    client: TestClient, guest_token: str, admin_token: str
):
    """
    household_name is free text a user fully controls, and it becomes a
    folder name inside the zip. Without sanitizing it, a household named
    "../../../../tmp/evil" could make the archive try to write outside
    the intended extraction directory when someone unzips it - the
    classic Zip Slip vulnerability (CWE-22). Every entry's path must stay
    safely inside the archive regardless of what the household is named.
    """
    _create_pending_entry_with_photo(client, guest_token, "../../../../tmp/evil")

    res = client.get("/api/admin/export-photos.zip", headers=auth_headers(admin_token))
    zf = zipfile.ZipFile(io.BytesIO(res.content))
    names = zf.namelist()
    assert len(names) == 1
    # No path traversal sequences and no absolute-path leading slash
    # should survive into the archive entry name.
    assert ".." not in names[0]
    assert not names[0].startswith("/")


def test_photo_zip_multiple_households_get_separate_folders(
    client: TestClient, guest_token: str, admin_token: str
):
    _create_pending_entry_with_photo(client, guest_token, "House A")
    other_guest = client.post("/api/auth/guest").json()["access_token"]
    _create_pending_entry_with_photo(client, other_guest, "House B")

    res = client.get("/api/admin/export-photos.zip", headers=auth_headers(admin_token))
    zf = zipfile.ZipFile(io.BytesIO(res.content))
    names = zf.namelist()
    assert len(names) == 2
    prefixes = {n.split("/")[0] for n in names}
    assert prefixes == {"House A", "House B"}
