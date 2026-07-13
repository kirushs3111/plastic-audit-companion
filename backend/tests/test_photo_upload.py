import io

from fastapi.testclient import TestClient

from tests.conftest import auth_headers

# Minimal valid magic-byte prefixes for each format, padded so they're
# non-trivial file sizes rather than a handful of bytes.
JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00" + b"\x00" * 100
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
HTML_PAYLOAD = b"<html><body><script>alert(document.cookie)</script></body></html>"


def test_upload_valid_jpeg_succeeds(client: TestClient, guest_token: str):
    res = client.post(
        "/api/photos/upload",
        files={"file": ("bottle.jpg", io.BytesIO(JPEG_BYTES), "image/jpeg")},
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["storage_url"].endswith(".jpg")
    assert body["storage_url"].startswith("/uploads/")


def test_upload_valid_png_succeeds(client: TestClient, guest_token: str):
    res = client.post(
        "/api/photos/upload",
        files={"file": ("bottle.png", io.BytesIO(PNG_BYTES), "image/png")},
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 201
    assert res.json()["storage_url"].endswith(".png")


def test_upload_requires_auth(client: TestClient):
    res = client.post(
        "/api/photos/upload",
        files={"file": ("bottle.jpg", io.BytesIO(JPEG_BYTES), "image/jpeg")},
    )
    assert res.status_code == 401


def test_upload_rejects_disallowed_declared_type(client: TestClient, guest_token: str):
    res = client.post(
        "/api/photos/upload",
        files={"file": ("payload.html", io.BytesIO(HTML_PAYLOAD), "text/html")},
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 415


def test_upload_rejects_content_that_does_not_match_declared_type(
    client: TestClient, guest_token: str
):
    """
    The core attack this endpoint defends against: an attacker names the
    file "evil.html" and lies about Content-Type, claiming image/jpeg,
    hoping the server trusts the header and serves the HTML back with a
    .html extension it derived from the filename. The server must sniff
    the actual bytes and reject the mismatch rather than trust either
    client-supplied field.
    """
    res = client.post(
        "/api/photos/upload",
        files={"file": ("evil.html", io.BytesIO(HTML_PAYLOAD), "image/jpeg")},
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 415


def test_upload_never_uses_client_supplied_extension(client: TestClient, guest_token: str):
    """Even with a legitimate image, the filename's extension must never
    end up in the stored path - only the validated content type should
    determine it."""
    res = client.post(
        "/api/photos/upload",
        files={"file": ("photo.exe", io.BytesIO(JPEG_BYTES), "image/jpeg")},
        headers=auth_headers(guest_token),
    )
    # Content matches image/jpeg, so this succeeds - but must be saved
    # with a .jpg extension, never the client-supplied .exe.
    assert res.status_code == 201
    assert res.json()["storage_url"].endswith(".jpg")
    assert not res.json()["storage_url"].endswith(".exe")


def test_upload_rejects_oversized_file(client: TestClient, guest_token: str):
    from app.core.config import get_settings

    settings = get_settings()
    oversized = JPEG_BYTES[:3] + b"\x00" * (settings.max_upload_size_mb * 1024 * 1024 + 1)

    res = client.post(
        "/api/photos/upload",
        files={"file": ("big.jpg", io.BytesIO(oversized), "image/jpeg")},
        headers=auth_headers(guest_token),
    )
    assert res.status_code == 413
