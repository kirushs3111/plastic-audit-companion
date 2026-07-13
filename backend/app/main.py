from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.limiter import limiter
from app.routers import admin, audits, auth, gamification, households, photos, review

settings = get_settings()

INSECURE_DEFAULT_SECRET = "dev-only-insecure-secret-change-me"

if settings.environment != "development" and settings.secret_key == INSECURE_DEFAULT_SECRET:
    raise RuntimeError(
        "SECRET_KEY is still the placeholder value from config.py, and "
        "ENVIRONMENT is not 'development'. That placeholder is sitting in "
        "the public repo, so every auth token would be forgeable. Set a "
        "real SECRET_KEY (e.g. `python -c \"import secrets; "
        "print(secrets.token_urlsafe(48))\"`) before deploying."
    )

app = FastAPI(
    title=settings.app_name,
    description="API for Plastic Audit Companion - household plastic audits, "
    "photo-based identification for unknown plastics, and the nationwide "
    "dataset it feeds.",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(households.router, prefix=settings.api_v1_prefix)
app.include_router(audits.router, prefix=settings.api_v1_prefix)
app.include_router(photos.router, prefix=settings.api_v1_prefix)
app.include_router(review.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(gamification.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}
