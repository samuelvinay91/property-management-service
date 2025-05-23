from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import logging
from typing import Optional
import redis
import os
from dotenv import load_dotenv

from src.api.chatbot_routes import router as chatbot_router
from src.api.analytics_routes import router as analytics_router
from src.api.document_routes import router as document_router
from src.api.prediction_routes import router as prediction_router
from src.utils.database import init_db
from src.utils.redis_client import get_redis_client
from src.utils.logger import setup_logger
from src.utils.auth import verify_token

load_dotenv()

# Setup logging
logger = setup_logger(__name__)
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI Services...")
    await init_db()
    redis_client = get_redis_client()
    if redis_client:
        logger.info("Redis connection established")
    else:
        logger.warning("Redis connection failed")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Services...")

app = FastAPI(
    title="PropFlow AI Services",
    description="AI-powered services for property management platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        user = await verify_token(credentials.credentials)
        return user
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Health check
@app.get("/health")
async def health_check():
    try:
        redis_client = get_redis_client()
        redis_status = "connected" if redis_client and redis_client.ping() else "disconnected"
        
        return {
            "status": "healthy",
            "service": "ai-services",
            "version": "1.0.0",
            "redis": redis_status,
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "PropFlow AI Services",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Include routers
app.include_router(chatbot_router, prefix="/api/v1/chatbot", tags=["Chatbot"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(document_router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(prediction_router, prefix="/api/v1/predictions", tags=["Predictions"])

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP exception: {exc.detail}")
    return {
        "error": exc.detail,
        "status_code": exc.status_code,
        "timestamp": "2024-01-01T00:00:00Z"
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return {
        "error": "Internal server error",
        "status_code": 500,
        "timestamp": "2024-01-01T00:00:00Z"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_SERVICE_PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development",
        log_level="info"
    )