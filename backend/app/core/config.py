from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central app configuration. All values are overridable via environment
    variables (or a .env file locally). See .env.example for the full list.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App ---
    app_name: str = "Plastic Audit Companion API"
    environment: str = "development"
    api_v1_prefix: str = "/api"

    # --- Database (PostgreSQL) ---
    database_url: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/pac_dev"
    )

    # --- Auth ---
    secret_key: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days, incl. guest sessions

    # --- CORS ---
    frontend_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # --- Photo storage ---
    # Photos are stored on local disk for now and served via FastAPI's
    # StaticFiles at /uploads. Swap this for Cloudinary/Firebase later by
    # replacing app/routers/photos.py's save step - the API contract
    # (POST /api/photos/upload -> {storage_url}) doesn't need to change.
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 8


@lru_cache
def get_settings() -> Settings:
    return Settings()
