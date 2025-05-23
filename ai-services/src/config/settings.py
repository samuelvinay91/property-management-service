import os
from typing import List
from pydantic import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # Basic app settings
    APP_NAME: str = "PropFlow AI Services"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # CORS settings
    CORS_ORIGINS: List[str] = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://localhost:4000"
    ).split(",")
    
    # Database settings
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://propflow:propflow123@localhost:5432/propflow_ai"
    )
    
    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_EXPIRE_TIME: int = int(os.getenv("REDIS_EXPIRE_TIME", 3600))  # 1 hour
    
    # AI/ML settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    
    # LLM Provider settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")  # openai, anthropic, huggingface
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.3"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "1000"))
    
    # Vector database settings (for RAG)
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "propflow-knowledge")
    
    # Document processing
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10MB
    ALLOWED_FILE_TYPES: List[str] = os.getenv(
        "ALLOWED_FILE_TYPES",
        "pdf,doc,docx,txt,jpg,jpeg,png"
    ).split(",")
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", 100))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", 3600))  # 1 hour
    
    # External service URLs
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:4001")
    PROPERTY_SERVICE_URL: str = os.getenv("PROPERTY_SERVICE_URL", "http://localhost:4002")
    TENANT_SERVICE_URL: str = os.getenv("TENANT_SERVICE_URL", "http://localhost:4003")
    MAINTENANCE_SERVICE_URL: str = os.getenv("MAINTENANCE_SERVICE_URL", "http://localhost:4004")
    BOOKING_SERVICE_URL: str = os.getenv("BOOKING_SERVICE_URL", "http://localhost:4005")
    PAYMENT_SERVICE_URL: str = os.getenv("PAYMENT_SERVICE_URL", "http://localhost:4006")
    NOTIFICATION_SERVICE_URL: str = os.getenv("NOTIFICATION_SERVICE_URL", "http://localhost:4007")
    
    # JWT settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    # Analytics settings
    ANALYTICS_RETENTION_DAYS: int = int(os.getenv("ANALYTICS_RETENTION_DAYS", 90))
    ENABLE_ANALYTICS: bool = os.getenv("ENABLE_ANALYTICS", "true").lower() == "true"
    
    # Monitoring and observability
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    ENABLE_METRICS: bool = os.getenv("ENABLE_METRICS", "true").lower() == "true"
    
    # Feature flags
    ENABLE_VOICE_PROCESSING: bool = os.getenv("ENABLE_VOICE_PROCESSING", "false").lower() == "true"
    ENABLE_DOCUMENT_OCR: bool = os.getenv("ENABLE_DOCUMENT_OCR", "true").lower() == "true"
    ENABLE_PREDICTIVE_ANALYTICS: bool = os.getenv("ENABLE_PREDICTIVE_ANALYTICS", "true").lower() == "true"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create global settings instance
settings = Settings()