from langchain.tools import BaseTool
from typing import Dict, Any, Optional, List
import json
import logging
from datetime import datetime
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class MaintenanceRequestInput(BaseModel):
    user_id: str = Field(..., description="ID of the user making the request")
    property_id: str = Field(..., description="ID of the property")
    unit_id: Optional[str] = Field(None, description="ID of the specific unit")
    category: str = Field(..., description="Category of maintenance (plumbing, electrical, etc.)")
    priority: str = Field(..., description="Priority level (low, medium, high, urgent)")
    title: str = Field(..., description="Brief title of the issue")
    description: str = Field(..., description="Detailed description of the issue")
    preferred_contact_method: Optional[str] = Field(None, description="Preferred contact method")

class MaintenanceStatusInput(BaseModel):
    request_id: Optional[str] = Field(None, description="Specific maintenance request ID")
    user_id: Optional[str] = Field(None, description="User ID to get all requests for")
    status_filter: Optional[str] = Field(None, description="Filter by status (pending, in_progress, completed)")

class MaintenanceRequestTool(BaseTool):
    name = "maintenance_request"
    description = """
    Create a maintenance request for property issues like plumbing, electrical, 
    HVAC, appliances, or general repairs. Use this when tenants report problems 
    that need maintenance attention.
    """
    args_schema = MaintenanceRequestInput

    def _run(
        self,
        user_id: str,
        property_id: str,
        category: str,
        priority: str,
        title: str,
        description: str,
        unit_id: Optional[str] = None,
        preferred_contact_method: Optional[str] = None,
        **kwargs
    ) -> str:
        """Create a maintenance request"""
        try:
            # Validate inputs
            valid_categories = [
                "plumbing", "electrical", "hvac", "appliance", "structural", 
                "landscaping", "security", "cleaning", "other"
            ]
            valid_priorities = ["low", "medium", "high", "urgent"]
            
            if category.lower() not in valid_categories:
                return f"Invalid category. Please choose from: {', '.join(valid_categories)}"
            
            if priority.lower() not in valid_priorities:
                return f"Invalid priority. Please choose from: {', '.join(valid_priorities)}"
            
            # Create the maintenance request
            request_data = {
                "user_id": user_id,
                "property_id": property_id,
                "unit_id": unit_id,
                "category": category.lower(),
                "priority": priority.lower(),
                "title": title,
                "description": description,
                "preferred_contact_method": preferred_contact_method,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self._create_maintenance_request(request_data)
            
            if result['success']:
                priority_emoji = {
                    "low": "🟢",
                    "medium": "🟡", 
                    "high": "🟠",
                    "urgent": "🔴"
                }
                
                category_emoji = {
                    "plumbing": "🚰",
                    "electrical": "⚡",
                    "hvac": "❄️",
                    "appliance": "📱",
                    "structural": "🏗️",
                    "landscaping": "🌿",
                    "security": "🔒",
                    "cleaning": "🧹",
                    "other": "🔨"
                }
                
                return f"""
✅ **Maintenance Request Submitted Successfully!**

📋 **Request Details:**
🆔 Request ID: {result['request_id']}
{category_emoji.get(category, '🔨')} Category: {category.title()}
{priority_emoji.get(priority, '🟡')} Priority: {priority.title()}
📝 Issue: {title}

📍 **Property:** {result.get('property_name', property_id)}
{f"🏠 Unit: {unit_id}" if unit_id else ""}

⏰ **Timeline:**
- **Low Priority:** 5-7 business days
- **Medium Priority:** 2-3 business days  
- **High Priority:** Within 24 hours
- **Urgent:** Within 4 hours

📱 **Next Steps:**
1. You'll receive a confirmation email shortly
2. Our maintenance team will review and assign a technician
3. You'll be contacted to schedule access
4. Track progress by asking me for updates anytime

💬 **Questions?** Just ask me "What's the status of request {result['request_id']}?"
                """.strip()
            else:
                return f"Sorry, I couldn't submit your maintenance request: {result.get('error', 'Unknown error')}"
                
        except Exception as e:
            logger.error(f"Error creating maintenance request: {e}")
            return f"I encountered an error while submitting your maintenance request: {str(e)}"

    def _create_maintenance_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create maintenance request - replace with actual API call"""
        import uuid
        
        # Mock creation - replace with actual API call
        return {
            "success": True,
            "request_id": f"MR{uuid.uuid4().hex[:8].upper()}",
            "property_name": "Downtown Apartment Complex",
            "estimated_completion": "2024-01-15"
        }

class MaintenanceStatusTool(BaseTool):
    name = "maintenance_status"
    description = """
    Check the status of maintenance requests. Can get status for a specific request ID
    or all requests for a user. Shows current status, assigned technician, and timeline.
    """
    args_schema = MaintenanceStatusInput

    def _run(
        self,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        **kwargs
    ) -> str:
        """Get maintenance request status"""
        try:
            if request_id:
                # Get specific request
                request_details = self._get_maintenance_request(request_id)
                if not request_details:
                    return f"Maintenance request {request_id} not found."
                
                return self._format_single_request(request_details)
            
            elif user_id:
                # Get all requests for user
                requests = self._get_user_maintenance_requests(user_id, status_filter)
                if not requests:
                    status_text = f" with status '{status_filter}'" if status_filter else ""
                    return f"No maintenance requests found{status_text}."
                
                return self._format_multiple_requests(requests)
            
            else:
                return "Please provide either a request ID or user ID to check maintenance status."
                
        except Exception as e:
            logger.error(f"Error getting maintenance status: {e}")
            return f"I encountered an error while checking maintenance status: {str(e)}"

    def _get_maintenance_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get specific maintenance request - replace with actual API call"""
        # Mock data - replace with actual API call
        mock_requests = {
            "MR12345678": {
                "id": "MR12345678",
                "title": "Leaky Kitchen Faucet",
                "category": "plumbing",
                "priority": "medium",
                "status": "in_progress",
                "description": "Kitchen faucet is dripping constantly",
                "property_name": "Downtown Apartment Complex",
                "unit": "2B",
                "created_at": "2024-01-10T10:00:00Z",
                "assigned_technician": "John Smith",
                "estimated_completion": "2024-01-12",
                "last_update": "Technician scheduled for tomorrow morning",
                "contact_phone": "+1 (555) 123-4567"
            }
        }
        return mock_requests.get(request_id)

    def _get_user_maintenance_requests(
        self, 
        user_id: str, 
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all maintenance requests for user - replace with actual API call"""
        # Mock data - replace with actual API call
        mock_requests = [
            {
                "id": "MR12345678",
                "title": "Leaky Kitchen Faucet", 
                "category": "plumbing",
                "priority": "medium",
                "status": "in_progress",
                "created_at": "2024-01-10T10:00:00Z",
                "property_name": "Downtown Apartment Complex",
                "unit": "2B"
            },
            {
                "id": "MR87654321",
                "title": "AC Not Working",
                "category": "hvac", 
                "priority": "high",
                "status": "pending",
                "created_at": "2024-01-11T14:30:00Z",
                "property_name": "Downtown Apartment Complex",
                "unit": "2B"
            }
        ]
        
        if status_filter:
            mock_requests = [r for r in mock_requests if r['status'] == status_filter.lower()]
        
        return mock_requests

    def _format_single_request(self, request: Dict[str, Any]) -> str:
        """Format single maintenance request details"""
        status_emoji = {
            "pending": "⏳",
            "in_progress": "🔧", 
            "completed": "✅",
            "cancelled": "❌",
            "on_hold": "⏸️"
        }
        
        priority_emoji = {
            "low": "🟢",
            "medium": "🟡",
            "high": "🟠", 
            "urgent": "🔴"
        }
        
        category_emoji = {
            "plumbing": "🚰",
            "electrical": "⚡",
            "hvac": "❄️",
            "appliance": "📱",
            "structural": "🏗️",
            "landscaping": "🌿",
            "security": "🔒",
            "cleaning": "🧹",
            "other": "🔨"
        }
        
        response = f"""
🔧 **Maintenance Request Status**

📋 **Request:** {request['title']}
🆔 **ID:** {request['id']}
{status_emoji.get(request['status'], '❓')} **Status:** {request['status'].title()}
{priority_emoji.get(request['priority'], '🟡')} **Priority:** {request['priority'].title()}
{category_emoji.get(request['category'], '🔨')} **Category:** {request['category'].title()}

📍 **Location:** {request['property_name']}
{f"🏠 **Unit:** {request['unit']}" if request.get('unit') else ""}

📅 **Created:** {datetime.fromisoformat(request['created_at'].replace('Z', '+00:00')).strftime('%B %d, %Y at %I:%M %p')}
        """.strip()
        
        if request.get('assigned_technician'):
            response += f"\n👨‍🔧 **Technician:** {request['assigned_technician']}"
            
        if request.get('estimated_completion'):
            response += f"\n⏰ **Estimated Completion:** {request['estimated_completion']}"
            
        if request.get('last_update'):
            response += f"\n📝 **Latest Update:** {request['last_update']}"
            
        if request.get('contact_phone'):
            response += f"\n📞 **Contact:** {request['contact_phone']}"
        
        return response

    def _format_multiple_requests(self, requests: List[Dict[str, Any]]) -> str:
        """Format multiple maintenance requests"""
        status_emoji = {
            "pending": "⏳",
            "in_progress": "🔧",
            "completed": "✅", 
            "cancelled": "❌",
            "on_hold": "⏸️"
        }
        
        priority_emoji = {
            "low": "🟢",
            "medium": "🟡",
            "high": "🟠",
            "urgent": "🔴"
        }
        
        response = f"📋 **Your Maintenance Requests** ({len(requests)} total)\n\n"
        
        for i, request in enumerate(requests, 1):
            response += f"**{i}. {request['title']}**\n"
            response += f"🆔 {request['id']} | "
            response += f"{status_emoji.get(request['status'], '❓')} {request['status'].title()} | "
            response += f"{priority_emoji.get(request['priority'], '🟡')} {request['priority'].title()}\n"
            response += f"📅 {datetime.fromisoformat(request['created_at'].replace('Z', '+00:00')).strftime('%m/%d/%Y')}\n\n"
        
        response += "💡 **Tip:** Ask me about a specific request using its ID for more details!"
        
        return response

class MaintenanceScheduleTool(BaseTool):
    name = "maintenance_schedule"
    description = """
    Schedule or reschedule maintenance appointments. Use this when users need to 
    coordinate timing for maintenance work or request schedule changes.
    """

    def _run(
        self, 
        request_id: str,
        preferred_date: str,
        preferred_time: str,
        notes: Optional[str] = None,
        **kwargs
    ) -> str:
        """Schedule maintenance appointment"""
        try:
            # Validate request exists
            request_details = self._get_maintenance_request(request_id)
            if not request_details:
                return f"Maintenance request {request_id} not found."
            
            # Schedule the appointment
            schedule_data = {
                "request_id": request_id,
                "preferred_date": preferred_date,
                "preferred_time": preferred_time,
                "notes": notes
            }
            
            result = self._schedule_maintenance(schedule_data)
            
            if result['success']:
                return f"""
📅 **Maintenance Appointment Scheduled**

🔧 **Request:** {request_details['title']}
🆔 **ID:** {request_id}
📅 **Date:** {preferred_date}
🕐 **Time:** {preferred_time}
👨‍🔧 **Technician:** {result.get('technician_name', 'TBD')}

📝 **Important Notes:**
• Please ensure someone is available to provide access
• Clear the work area if possible
• Secure any pets
• Contact us if you need to reschedule

📞 **Contact:** {result.get('contact_phone', 'Will be provided')}

You'll receive a confirmation email with all the details.
                """.strip()
            else:
                return f"Sorry, I couldn't schedule your appointment: {result.get('error', 'Unknown error')}"
                
        except Exception as e:
            logger.error(f"Error scheduling maintenance: {e}")
            return f"I encountered an error while scheduling your appointment: {str(e)}"

    def _schedule_maintenance(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule maintenance - replace with actual API call"""
        # Mock scheduling - replace with actual API call
        return {
            "success": True,
            "appointment_id": "APT123456",
            "technician_name": "John Smith",
            "contact_phone": "+1 (555) 123-4567"
        }