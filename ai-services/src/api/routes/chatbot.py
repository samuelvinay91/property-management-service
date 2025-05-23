from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime

from ..auth import get_current_user
from ...chatbot.intelligent_agent import chatbot_service
from ...models.conversation import Conversation
from ...utils.database import get_db_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

class ChatMessage(BaseModel):
    message: str = Field(..., description="User message")
    conversation_id: Optional[str] = Field(None, description="Conversation ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")

class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str]
    timestamp: str
    status: str
    suggestions: Optional[List[str]] = None

class ConversationHistoryResponse(BaseModel):
    messages: List[Dict[str, Any]]
    total_count: int
    conversation_id: str

@router.post("/chat", response_model=ChatResponse)
async def send_message(
    message_data: ChatMessage,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Send a message to the AI chatbot"""
    try:
        # Process the message
        result = await chatbot_service.send_message(
            user_id=current_user["id"],
            message=message_data.message,
            conversation_id=message_data.conversation_id,
            context=message_data.context
        )
        
        # Get suggested actions if this is a new conversation
        suggestions = None
        if not message_data.conversation_id:
            suggestions = await chatbot_service.agent.get_suggested_actions(
                current_user["id"]
            )
        
        return ChatResponse(
            response=result["response"],
            conversation_id=result.get("conversation_id"),
            timestamp=result.get("timestamp", datetime.utcnow().isoformat()),
            status=result["status"],
            suggestions=[s.get("title") for s in suggestions[:3]] if suggestions else None
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process message"
        )

@router.get("/conversations/{conversation_id}/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    conversation_id: str,
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get conversation history"""
    try:
        messages = await chatbot_service.get_conversation_history(
            user_id=current_user["id"],
            conversation_id=conversation_id,
            limit=limit
        )
        
        return ConversationHistoryResponse(
            messages=messages,
            total_count=len(messages),
            conversation_id=conversation_id
        )
        
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve conversation history"
        )

@router.get("/suggestions")
async def get_suggested_actions(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get suggested actions for the user"""
    try:
        suggestions = await chatbot_service.agent.get_suggested_actions(
            current_user["id"]
        )
        
        return {
            "suggestions": suggestions,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get suggestions"
        )

@router.post("/voice")
async def process_voice_message(
    # This would handle file upload for voice messages
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Process voice message (placeholder for future implementation)"""
    return {
        "message": "Voice processing not yet implemented",
        "status": "not_implemented"
    }

@router.get("/health")
async def chatbot_health():
    """Health check for chatbot service"""
    try:
        # Test basic functionality
        test_result = await chatbot_service.send_message(
            user_id="health_check",
            message="ping",
            context={"test": True}
        )
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "chatbot_status": test_result["status"]
        }
        
    except Exception as e:
        logger.error(f"Chatbot health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# WebSocket endpoint for real-time chat (optional enhancement)
from fastapi import WebSocket, WebSocketDisconnect
import json

@router.websocket("/ws/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time chat"""
    await websocket.accept()
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process message
            result = await chatbot_service.send_message(
                user_id=user_id,
                message=message_data.get("message", ""),
                conversation_id=message_data.get("conversation_id"),
                context=message_data.get("context")
            )
            
            # Send response
            await websocket.send_text(json.dumps(result))
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket connection closed for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        await websocket.close(code=1000)