from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "ActDesk Autonomous Support API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "actdesk-dev-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database — will be overridden by .env
    DATABASE_URL: str = "postgresql://actdesk:Waheguru%4013@localhost:5432/actdesk_db"

    # Redis / Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_IN_MEMORY_CACHE: bool = True

    # Mongo (Atlas)
    MONGO_URL: str = "mongodb://localhost:27017"
    MONGO_DB: str = "actdesk"

    # Cache TTLs
    SESSION_TTL_SECONDS: int = 1800
    ORDER_STATUS_CACHE_TTL_SECONDS: int = 60
    IDEMPOTENCY_TTL_SECONDS: int = 86400

    # Rate limits
    RATE_LIMIT_PER_MINUTE: int = 60
    OTP_RATE_LIMIT_PER_MINUTE: int = 5
    FEEDBACK_RATE_LIMIT_PER_MINUTE: int = 10

    # Demo
    DEFAULT_OTP: str = "123456"

    # Seed credentials
    SEED_ADMIN_USERNAME: str = "Ishleen"
    SEED_ADMIN_PASSWORD: str = "Ishleen@123"
    SEED_ADMIN_EMAIL: str = "admin@actdesk.com"
    SEED_AGENT_USERNAME: str = "agent"
    SEED_AGENT_PASSWORD: str = "agent123"
    SEED_AGENT_EMAIL: str = "agent@actdesk.com"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # "http://localhost:8000",
        "*",
        "http://127.0.0.1:8000",
    ]

    # ---- THE CRITICAL PART ----
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()