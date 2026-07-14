"""
Application configuration using pydantic-settings.

All values are read from environment variables (or a .env file).
No defaults are provided for secrets — they MUST be set.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the Watch Party backend.

    Environment variables are case-insensitive.
    A .env file in the working directory is loaded automatically.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        # Allow extra fields so future env vars don't crash the app on startup
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    app_name: str = "Watch Party"
    app_version: str = "0.1.0"
    environment: Literal["development", "staging", "production", "testing"] = "development"
    debug: bool = False

    # ── Server ───────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:3000"

    # ── Database (Supabase PostgreSQL) ────────────────────────────────────────
    # Must use postgresql+asyncpg:// scheme for async operation
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/watchparty"

    # ── Security ──────────────────────────────────────────────────────────────
    # REQUIRED in production — generate with: python -c "import secrets; print(secrets.token_hex(32))"
    secret_key: str = "INSECURE_DEFAULT_CHANGE_IN_PRODUCTION"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # ── Storage Credential Encryption (AES-256-GCM) ───────────────────────────
    # Base64url-encoded 32-byte key.
    # Generate: python -c "import secrets,base64; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"
    encryption_key: str = "INSECURE_DEFAULT_CHANGE_IN_PRODUCTION_base64_32_bytes"

    # ── HLS AES-128 Key Serving ───────────────────────────────────────────────
    # Short-lived token secret for serving HLS encryption keys.
    # Generate: python -c "import secrets; print(secrets.token_hex(32))"
    hls_key_signing_secret: str = "INSECURE_DEFAULT_CHANGE_IN_PRODUCTION"

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_origins: list[str] = ["http://localhost:3000"]

    # ── Logging ───────────────────────────────────────────────────────────────
    log_level: str = "INFO"
    log_format: Literal["json", "pretty"] = "pretty"

    # ── External Metadata APIs ────────────────────────────────────────────────
    tmdb_api_key: str = ""
    omdb_api_key: str = ""

    # ── Derived properties ────────────────────────────────────────────────────

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def is_testing(self) -> bool:
        return self.environment == "testing"

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        valid = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in valid:
            raise ValueError(f"LOG_LEVEL must be one of {valid}, got '{v}'")
        return upper

    @model_validator(mode="after")
    def warn_insecure_defaults(self) -> "Settings":
        """Raise hard error if production is started with insecure defaults."""
        insecure_markers = {"INSECURE_DEFAULT", "CHANGE_IN_PRODUCTION"}
        if self.environment == "production":
            for field, value in [
                ("SECRET_KEY", self.secret_key),
                ("ENCRYPTION_KEY", self.encryption_key),
                ("HLS_KEY_SIGNING_SECRET", self.hls_key_signing_secret),
            ]:
                if any(m in value for m in insecure_markers):
                    raise ValueError(
                        f"{field} must be set to a real secret in production. "
                        "See .env.example for generation instructions."
                    )
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance.

    Use FastAPI's Depends(get_settings) for dependency injection,
    or call get_settings() directly outside of request context.
    """
    return Settings()
