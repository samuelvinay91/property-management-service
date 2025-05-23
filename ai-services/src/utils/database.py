import asyncio
import logging
from typing import Optional
from contextlib import asynccontextmanager
import asyncpg
from asyncpg import Pool
from config.settings import settings

logger = logging.getLogger(__name__)

# Global connection pool
_pool: Optional[Pool] = None

async def init_database() -> None:
    """Initialize database connection pool"""
    global _pool
    
    try:
        _pool = await asyncpg.create_pool(
            dsn=settings.DATABASE_URL,
            min_size=settings.DB_POOL_MIN_SIZE,
            max_size=settings.DB_POOL_MAX_SIZE,
            max_queries=50000,
            max_inactive_connection_lifetime=300,
            command_timeout=60,
        )
        
        # Test connection
        async with _pool.acquire() as conn:
            await conn.fetchval('SELECT 1')
            
        logger.info("✅ Database connection pool initialized")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise

async def close_database() -> None:
    """Close database connection pool"""
    global _pool
    
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("✅ Database connection pool closed")

def get_db_pool() -> Optional[Pool]:
    """Get database connection pool"""
    return _pool

@asynccontextmanager
async def get_db_session():
    """Get database session from pool"""
    if not _pool:
        raise RuntimeError("Database pool not initialized")
    
    async with _pool.acquire() as conn:
        try:
            yield conn
        except Exception as e:
            logger.error(f"Database session error: {e}")
            raise

async def execute_query(query: str, *args) -> list:
    """Execute a query and return results"""
    async with get_db_session() as conn:
        return await conn.fetch(query, *args)

async def execute_one(query: str, *args):
    """Execute a query and return one result"""
    async with get_db_session() as conn:
        return await conn.fetchrow(query, *args)

async def execute_scalar(query: str, *args):
    """Execute a query and return scalar value"""
    async with get_db_session() as conn:
        return await conn.fetchval(query, *args)

# Database migration utilities
async def run_migrations():
    """Run database migrations"""
    try:
        async with get_db_session() as conn:
            # Create conversations table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL,
                    title VARCHAR(255),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            # Create messages table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL,
                    message TEXT NOT NULL,
                    response TEXT,
                    context JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            # Create indexes
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
                ON conversations(user_id)
            """)
            
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
                ON messages(conversation_id)
            """)
            
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_user_id 
                ON messages(user_id)
            """)
            
            logger.info("✅ Database migrations completed")
            
    except Exception as e:
        logger.error(f"❌ Failed to run migrations: {e}")
        raise

# Health check
async def check_database_health() -> dict:
    """Check database health"""
    try:
        if not _pool:
            return {"status": "error", "message": "Pool not initialized"}
        
        async with get_db_session() as conn:
            result = await conn.fetchval('SELECT 1')
            
            if result == 1:
                return {
                    "status": "healthy", 
                    "pool_size": _pool.get_size(),
                    "available_connections": _pool.get_idle_size()
                }
            else:
                return {"status": "error", "message": "Query failed"}
                
    except Exception as e:
        return {"status": "error", "message": str(e)}