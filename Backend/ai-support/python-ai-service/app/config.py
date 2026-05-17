from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ai-moderation"
    api_prefix: str = "/api/v1"
    model_bundle_version: str = "1.0.0-dev"
    ai_device: str = "cpu"

    # Security
    internal_jwt_secret: str = "change-me-in-production"
    internal_jwt_audience: str = "ai-moderation"

    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_request_topic: str = "moderation.requested"
    kafka_completed_topic: str = "moderation.completed"
    kafka_dlq_topic: str = "moderation.dlq"
    kafka_consumer_group: str = "ai-moderation-workers"
    kafka_enabled: bool = True

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 86400

    # Thresholds file (optional)
    thresholds_path: str = ""


settings = Settings()
