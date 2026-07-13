from fastapi.testclient import TestClient

from app.core.limiter import limiter


def test_guest_endpoint_is_rate_limited_when_enabled(client: TestClient):
    """
    Every other test runs with the limiter disabled (see conftest.py) so
    TestClient's shared fake IP doesn't cause unrelated failures. This
    test is the one place we turn it back on, to prove the limiter
    actually blocks excess requests rather than just trusting the
    decorator is wired up correctly.
    """
    limiter.enabled = True
    try:
        statuses = [client.post("/api/auth/guest").status_code for _ in range(15)]
    finally:
        limiter.enabled = False

    assert 201 in statuses
    assert 429 in statuses, "expected at least one request to be rate limited"
