from slowapi import Limiter
from slowapi.util import get_remote_address

# In-memory, per-process rate limiting keyed by client IP. Enough to stop
# naive brute-force/spam against a single-instance deployment, but does
# NOT share state across multiple backend replicas - if you scale
# horizontally, swap the storage_uri for a shared Redis backend instead.
limiter = Limiter(key_func=get_remote_address)
