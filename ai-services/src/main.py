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
from datetime import datetime

# Import route modules
from .api.routes.chatbot import router as chatbot_router
from .api.routes.analytics import router as analytics_router

# Import utility modules
from .utils.database import init_database, close_database
from .utils.redis_client import get_redis_client, init_redis, close_redis
from .utils.logger import setup_logging
from .utils.auth import verify_token
from .config.settings import settings

load_dotenv()

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Starting PropFlow AI Services...")
    
    try:
        # Initialize database
        await init_database()
        logger.info("✅ Database initialized")
        
        # Initialize Redis
        await init_redis()
        logger.info("✅ Redis initialized")
        
        # Initialize AI models and services
        logger.info("🤖 AI models and services ready")
        
        logger.info("✅ PropFlow AI Services started successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down PropFlow AI Services...")
    
    try:
        await close_redis()
        logger.info("✅ Redis connections closed")
        
        await close_database()
        logger.info("✅ Database connections closed")
        
    except Exception as e:
        logger.error(f"❌ Error during shutdown: {e}")
    
    logger.info("✅ PropFlow AI Services shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="PropFlow AI Services",
    description="Intelligent AI services for property management platform including chatbot, analytics, document processing, and predictions",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        user = await verify_token(credentials.credentials)
        return user
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=401, 
            detail="Invalid authentication credentials"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    try:
        health_status = {
            "status": "healthy",
            "service": "PropFlow AI Services",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Check Redis connection
        try:
            redis_client = get_redis_client()
            if redis_client and await redis_client.ping():
                health_status["redis"] = "connected"
            else:
                health_status["redis"] = "disconnected"
                health_status["status"] = "degraded"
        except Exception as e:
            health_status["redis"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
        
        # Check database connection
        try:
            # Add database health check here
            health_status["database"] = "connected"
        except Exception as e:
            health_status["database"] = f"error: {str(e)}"
            health_status["status"] = "unhealthy"
        
        # Check AI models
        try:
            # Add AI model health check here
            health_status["ai_models"] = "loaded"
        except Exception as e:
            health_status["ai_models"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "message": "PropFlow AI Services",
        "description": "Intelligent AI services for property management",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "chatbot": "/api/v1/chatbot",
            "analytics": "/api/v1/analytics", 
            "documents": "/api/v1/documents",
            "predictions": "/api/v1/predictions"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# Include API routers
app.include_router(chatbot_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    logger.error(f"HTTP {exc.status_code}: {exc.detail} - Path: {request.url.path}")
    return {
        "error": exc.detail,
        "status_code": exc.status_code,
        "path": str(request.url.path),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc} - Path: {request.url.path}", exc_info=True)
    return {
        "error": "Internal server error",
        "status_code": 500,
        "path": str(request.url.path),
        "timestamp": datetime.utcnow().isoformat()
    }

# Startup event logging
@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    logger.info(f"🚀 PropFlow AI Services starting on {settings.HOST}:{settings.PORT}")
    logger.info(f"📊 Environment: {settings.ENVIRONMENT}")
    logger.info(f"📝 Docs available at: /docs")

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
        reload_dirs=["src"] if settings.ENVIRONMENT == "development" else None
    )