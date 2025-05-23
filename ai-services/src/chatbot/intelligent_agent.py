from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI, ChatAnthropic
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Pinecone
from langchain.tools import BaseTool
from typing import Dict, List, Any, Optional
import json
import logging
from datetime import datetime, timedelta

from ..utils.database import get_db_session
from ..utils.redis_client import get_redis_client
from ..models.conversation import Conversation
from .tools.property_tools import PropertySearchTool, PropertyBookingTool
from .tools.payment_tools import PaymentProcessingTool, PaymentStatusTool
from .tools.maintenance_tools import MaintenanceRequestTool, MaintenanceStatusTool
from .tools.lease_tools import LeaseManagementTool, LeaseDocumentTool

logger = logging.getLogger(__name__)

class PropertyManagementAgent:
    """Intelligent AI agent for property management tasks"""
    
    def __init__(self):
        self.llm = self._initialize_llm()
        self.memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            k=10,
            return_messages=True
        )
        self.tools = self._initialize_tools()
        self.agent = self._create_agent()
        self.agent_executor = AgentExecutor.from_agent_and_tools(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            max_iterations=5
        )
        
    def _initialize_llm(self):
        """Initialize the language model"""
        model_provider = os.getenv("LLM_PROVIDER", "openai")
        
        if model_provider == "openai":
            return ChatOpenAI(
                model="gpt-4",
                temperature=0.3,
                max_tokens=1000
            )
        elif model_provider == "anthropic":
            return ChatAnthropic(
                model="claude-3-sonnet-20240229",
                temperature=0.3,
                max_tokens=1000
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {model_provider}")
    
    def _initialize_tools(self) -> List[BaseTool]:
        """Initialize all available tools for the agent"""
        return [
            PropertySearchTool(),
            PropertyBookingTool(),
            PaymentProcessingTool(),
            PaymentStatusTool(),
            MaintenanceRequestTool(),
            MaintenanceStatusTool(),
            LeaseManagementTool(),
            LeaseDocumentTool(),
        ]
    
    def _create_agent(self):
        """Create the React agent with custom prompt"""
        prompt = PromptTemplate(
            input_variables=["tools", "tool_names", "input", "agent_scratchpad", "chat_history"],
            template="""
You are PropFlow AI, an intelligent property management assistant. You help with:

1. Property search and booking
2. Payment processing and status checks
3. Maintenance requests and tracking
4. Lease management and documentation
5. General property management questions

You have access to the following tools:
{tools}

Tool names: {tool_names}

Previous conversation:
{chat_history}

Guidelines:
- Be helpful, professional, and friendly
- Always verify user identity when handling sensitive operations
- Provide clear, actionable responses
- Ask for clarification when needed
- Use tools when appropriate to complete tasks
- Handle errors gracefully and suggest alternatives

Current conversation:
Human: {input}

Thought: I need to understand what the human is asking for and determine if I need to use any tools.
{agent_scratchpad}
"""
        )
        
        return create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
    
    async def process_message(
        self,
        message: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process a user message and return response"""
        try:
            # Load conversation history if conversation_id is provided
            if conversation_id:
                await self._load_conversation_history(conversation_id)
            
            # Add context to the input if provided
            enhanced_input = message
            if context:
                enhanced_input = f"Context: {json.dumps(context)}\nUser message: {message}"
            
            # Process the message
            response = await self.agent_executor.arun(
                input=enhanced_input,
                user_id=user_id
            )
            
            # Save conversation
            await self._save_conversation(
                user_id=user_id,
                conversation_id=conversation_id,
                user_message=message,
                ai_response=response,
                context=context
            )
            
            return {
                "response": response,
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return {
                "response": "I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.",
                "error": str(e),
                "status": "error"
            }
    
    async def _load_conversation_history(self, conversation_id: str):
        """Load previous conversation history"""
        try:
            async with get_db_session() as session:
                # Load recent messages from database
                # Implementation depends on your database schema
                pass
        except Exception as e:
            logger.error(f"Error loading conversation history: {e}")
    
    async def _save_conversation(
        self,
        user_id: str,
        conversation_id: Optional[str],
        user_message: str,
        ai_response: str,
        context: Optional[Dict[str, Any]] = None
    ):
        """Save conversation to database"""
        try:
            async with get_db_session() as session:
                # Save conversation to database
                # Implementation depends on your database schema
                pass
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
    
    async def get_suggested_actions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get suggested actions based on user context"""
        try:
            suggestions = []
            
            # Check for pending payments
            # Check for maintenance requests
            # Check for upcoming lease renewals
            # Check for property viewing requests
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error getting suggested actions: {e}")
            return []
    
    async def handle_voice_input(self, audio_data: bytes, user_id: str) -> Dict[str, Any]:
        """Process voice input and return text response"""
        try:
            # Convert speech to text
            # Process the text message
            # Return both text and audio response
            
            return {
                "text_response": "Voice processing not implemented yet",
                "audio_response_url": None,
                "status": "error"
            }
            
        except Exception as e:
            logger.error(f"Error processing voice input: {e}")
            return {
                "text_response": "Sorry, I couldn't process your voice message.",
                "error": str(e),
                "status": "error"
            }

class ChatbotService:
    """Service class for chatbot operations"""
    
    def __init__(self):
        self.agent = PropertyManagementAgent()
        self.redis_client = get_redis_client()
    
    async def send_message(
        self,
        user_id: str,
        message: str,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send a message to the chatbot"""
        
        # Rate limiting
        if await self._is_rate_limited(user_id):
            return {
                "response": "You're sending messages too quickly. Please wait a moment before trying again.",
                "status": "rate_limited"
            }
        
        # Process the message
        result = await self.agent.process_message(
            message=message,
            user_id=user_id,
            conversation_id=conversation_id,
            context=context
        )
        
        # Update rate limiting
        await self._update_rate_limit(user_id)
        
        return result
    
    async def get_conversation_history(
        self,
        user_id: str,
        conversation_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get conversation history"""
        try:
            # Retrieve from database
            return []
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return []
    
    async def _is_rate_limited(self, user_id: str) -> bool:
        """Check if user is rate limited"""
        if not self.redis_client:
            return False
        
        try:
            key = f"rate_limit:{user_id}"
            count = await self.redis_client.get(key)
            return int(count or 0) > 30  # 30 messages per minute
        except Exception:
            return False
    
    async def _update_rate_limit(self, user_id: str):
        """Update rate limiting counter"""
        if not self.redis_client:
            return
        
        try:
            key = f"rate_limit:{user_id}"
            await self.redis_client.incr(key)
            await self.redis_client.expire(key, 60)  # 1 minute expiry
        except Exception as e:
            logger.error(f"Error updating rate limit: {e}")

# Global chatbot service instance
chatbot_service = ChatbotService()