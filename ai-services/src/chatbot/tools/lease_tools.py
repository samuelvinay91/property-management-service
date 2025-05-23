from langchain.tools import BaseTool
from typing import Dict, Any, Optional, List
import json
import logging
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class LeaseManagementInput(BaseModel):
    user_id: str = Field(..., description="ID of the user")
    action: str = Field(..., description="Action to perform (view, renew, terminate, etc.)")
    lease_id: Optional[str] = Field(None, description="Specific lease ID")
    property_id: Optional[str] = Field(None, description="Property ID for new leases")
    unit_id: Optional[str] = Field(None, description="Unit ID for new leases")
    start_date: Optional[str] = Field(None, description="Lease start date")
    end_date: Optional[str] = Field(None, description="Lease end date")
    rent_amount: Optional[float] = Field(None, description="Monthly rent amount")

class LeaseDocumentInput(BaseModel):
    lease_id: str = Field(..., description="Lease ID")
    document_type: str = Field(..., description="Type of document to generate or retrieve")
    user_id: str = Field(..., description="ID of the user requesting the document")

class LeaseManagementTool(BaseTool):
    name = "lease_management"
    description = """
    Manage lease agreements including viewing current leases, renewal processes,
    lease modifications, and termination procedures. Handles all lease lifecycle operations.
    """
    args_schema = LeaseManagementInput

    def _run(
        self,
        user_id: str,
        action: str,
        lease_id: Optional[str] = None,
        property_id: Optional[str] = None,
        unit_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        rent_amount: Optional[float] = None,
        **kwargs
    ) -> str:
        """Manage lease operations"""
        try:
            action = action.lower()
            
            if action == "view":
                return self._view_leases(user_id, lease_id)
            elif action == "renew":
                return self._renew_lease(user_id, lease_id)
            elif action == "terminate":
                return self._terminate_lease(user_id, lease_id)
            elif action == "modify":
                return self._modify_lease(user_id, lease_id)
            elif action == "status":
                return self._lease_status(user_id, lease_id)
            else:
                return f"Invalid action '{action}'. Available actions: view, renew, terminate, modify, status"
                
        except Exception as e:
            logger.error(f"Error in lease management: {e}")
            return f"I encountered an error while managing your lease: {str(e)}"

    def _view_leases(self, user_id: str, lease_id: Optional[str] = None) -> str:
        """View lease information"""
        if lease_id:
            lease_details = self._get_lease_details(lease_id)
            if not lease_details:
                return f"Lease with ID {lease_id} not found."
            return self._format_lease_details(lease_details)
        else:
            leases = self._get_user_leases(user_id)
            if not leases:
                return "You don't have any active leases."
            return self._format_lease_list(leases)

    def _renew_lease(self, user_id: str, lease_id: Optional[str] = None) -> str:
        """Handle lease renewal"""
        if not lease_id:
            # Get current lease for renewal
            current_leases = self._get_user_leases(user_id)
            active_leases = [l for l in current_leases if l['status'] == 'active']
            
            if not active_leases:
                return "No active leases found for renewal."
            elif len(active_leases) > 1:
                lease_list = "\n".join([f"- {l['id']}: {l['property_name']} Unit {l['unit']}" for l in active_leases])
                return f"Multiple active leases found. Please specify which lease to renew:\n{lease_list}"
            else:
                lease_id = active_leases[0]['id']
        
        lease_details = self._get_lease_details(lease_id)
        if not lease_details:
            return f"Lease {lease_id} not found."
        
        # Check if lease is eligible for renewal
        end_date = datetime.fromisoformat(lease_details['end_date'].replace('Z', '+00:00'))
        days_until_expiry = (end_date - datetime.now()).days
        
        if days_until_expiry > 90:
            return f"""
⏰ **Lease Renewal - Too Early**

Your lease for {lease_details['property_name']} Unit {lease_details['unit']} doesn't expire until {end_date.strftime('%B %d, %Y')} ({days_until_expiry} days).

🗓️ **Renewal Timeline:**
- Renewal applications typically open 60-90 days before expiration
- We'll notify you when renewal becomes available
- Early renewal discussions can begin 90 days prior

💡 **Would you like me to:**
- Set a reminder for when renewal opens?
- Show you current lease details?
- Explain the renewal process?
            """.strip()
        
        # Start renewal process
        renewal_info = self._start_lease_renewal(lease_id)
        
        return f"""
✅ **Lease Renewal Initiated**

🏠 **Property:** {lease_details['property_name']} - Unit {lease_details['unit']}
📅 **Current Lease Expires:** {end_date.strftime('%B %d, %Y')}
💰 **Current Rent:** ${lease_details['rent_amount']:,}/month

📋 **Renewal Options:**
- **12-month renewal:** ${renewal_info['new_rent_12_month']:,}/month ({renewal_info['rent_increase_12_month']:.1f}% increase)
- **6-month renewal:** ${renewal_info['new_rent_6_month']:,}/month ({renewal_info['rent_increase_6_month']:.1f}% increase)

📅 **New Lease Dates:**
- Start: {lease_details['end_date'][:10]}
- End (12-month): {renewal_info['new_end_date_12_month']}
- End (6-month): {renewal_info['new_end_date_6_month']}

📝 **Next Steps:**
1. Review renewal terms
2. Choose lease duration
3. Sign renewal agreement
4. Submit any required documents

⏰ **Response Deadline:** {renewal_info['response_deadline']}

💬 **Ready to proceed?** Let me know which option you prefer or if you have questions about the terms.
        """.strip()

    def _terminate_lease(self, user_id: str, lease_id: Optional[str] = None) -> str:
        """Handle lease termination"""
        if not lease_id:
            return "Please provide the lease ID you want to terminate."
        
        lease_details = self._get_lease_details(lease_id)
        if not lease_details:
            return f"Lease {lease_id} not found."
        
        # Check termination rules
        end_date = datetime.fromisoformat(lease_details['end_date'].replace('Z', '+00:00'))
        days_until_expiry = (end_date - datetime.now()).days
        required_notice = lease_details.get('required_notice_days', 30)
        
        return f"""
⚠️ **Lease Termination Request**

🏠 **Property:** {lease_details['property_name']} - Unit {lease_details['unit']}
📅 **Lease Expires:** {end_date.strftime('%B %d, %Y')} ({days_until_expiry} days)

📋 **Termination Requirements:**
- **Notice Required:** {required_notice} days minimum
- **Early Termination Fee:** ${lease_details.get('early_termination_fee', 0):,}
- **Move-out Inspection:** Required
- **Security Deposit:** Refundable minus deductions

⚖️ **Your Options:**

**1. Natural Expiration** (Recommended)
- No additional fees
- Standard move-out process
- Full security deposit consideration

**2. Early Termination**
- Early termination fee applies
- Still requires {required_notice}-day notice
- Additional penalties may apply

📝 **Required Steps:**
1. Submit formal written notice
2. Schedule move-out inspection
3. Complete property condition report
4. Return all keys and access cards

⚠️ **Important:** This action requires careful consideration. 

💬 **Would you like to:**
- Submit formal termination notice?
- Schedule a consultation to discuss options?
- Learn about the move-out process?
        """.strip()

    def _modify_lease(self, user_id: str, lease_id: Optional[str] = None) -> str:
        """Handle lease modifications"""
        if not lease_id:
            return "Please provide the lease ID you want to modify."
        
        return f"""
📝 **Lease Modification Request**

🔧 **Available Modifications:**
- Add/remove authorized occupants
- Pet policy changes
- Parking space modifications
- Utility responsibility changes
- Rent payment date adjustments

📋 **Process:**
1. Submit modification request
2. Landlord review (3-5 business days)
3. Amendment drafting
4. Signature collection
5. Updated lease execution

💰 **Fees:**
- Administrative fee: $50-$100
- Background check (new occupants): $25 per person
- Pet deposit (if adding pets): $200-$500

📞 **To proceed:**
Contact our leasing office at (555) 123-4567 or submit a request through the tenant portal.

💬 **What type of modification are you interested in?**
        """.strip()

    def _lease_status(self, user_id: str, lease_id: Optional[str] = None) -> str:
        """Get lease status information"""
        if lease_id:
            lease_details = self._get_lease_details(lease_id)
            if not lease_details:
                return f"Lease {lease_id} not found."
            
            end_date = datetime.fromisoformat(lease_details['end_date'].replace('Z', '+00:00'))
            days_until_expiry = (end_date - datetime.now()).days
            
            status_emoji = {
                "active": "✅",
                "expired": "❌", 
                "pending": "⏳",
                "terminated": "🚫"
            }
            
            return f"""
📋 **Lease Status**

{status_emoji.get(lease_details['status'], '❓')} **Status:** {lease_details['status'].title()}
🏠 **Property:** {lease_details['property_name']} - Unit {lease_details['unit']}
💰 **Rent:** ${lease_details['rent_amount']:,}/month
📅 **Expires:** {end_date.strftime('%B %d, %Y')} ({days_until_expiry} days)

📊 **Account Status:**
- Rent Status: {lease_details.get('rent_status', 'Current')}
- Security Deposit: ${lease_details.get('security_deposit', 0):,}
- Late Fees: ${lease_details.get('outstanding_fees', 0):,}

📝 **Recent Activity:**
{lease_details.get('recent_activity', 'No recent activity')}

💡 **Upcoming Actions:**
{self._get_upcoming_lease_actions(lease_details)}
            """.strip()
        else:
            return self._view_leases(user_id)

    def _get_lease_details(self, lease_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed lease information - replace with actual API call"""
        # Mock data - replace with actual API call
        mock_leases = {
            "LEASE_123": {
                "id": "LEASE_123",
                "property_name": "Downtown Apartment Complex",
                "unit": "2B",
                "status": "active",
                "start_date": "2023-06-01T00:00:00Z",
                "end_date": "2024-05-31T23:59:59Z",
                "rent_amount": 2500,
                "security_deposit": 2500,
                "required_notice_days": 30,
                "early_termination_fee": 2500,
                "rent_status": "Current",
                "outstanding_fees": 0,
                "recent_activity": "Rent payment received January 1, 2024"
            }
        }
        return mock_leases.get(lease_id)

    def _get_user_leases(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all user leases - replace with actual API call"""
        # Mock data - replace with actual API call
        return [
            {
                "id": "LEASE_123",
                "property_name": "Downtown Apartment Complex",
                "unit": "2B", 
                "status": "active",
                "end_date": "2024-05-31T23:59:59Z",
                "rent_amount": 2500
            }
        ]

    def _start_lease_renewal(self, lease_id: str) -> Dict[str, Any]:
        """Start lease renewal process - replace with actual API call"""
        # Mock renewal data - replace with actual API call
        current_date = datetime.now()
        return {
            "new_rent_12_month": 2625,  # 5% increase
            "new_rent_6_month": 2750,   # 10% increase
            "rent_increase_12_month": 5.0,
            "rent_increase_6_month": 10.0,
            "new_end_date_12_month": (current_date + timedelta(days=365)).strftime('%Y-%m-%d'),
            "new_end_date_6_month": (current_date + timedelta(days=183)).strftime('%Y-%m-%d'),
            "response_deadline": (current_date + timedelta(days=30)).strftime('%B %d, %Y')
        }

    def _get_upcoming_lease_actions(self, lease_details: Dict[str, Any]) -> str:
        """Get upcoming actions for lease"""
        end_date = datetime.fromisoformat(lease_details['end_date'].replace('Z', '+00:00'))
        days_until_expiry = (end_date - datetime.now()).days
        
        if days_until_expiry <= 30:
            return "⚠️ Lease expires soon - consider renewal or move-out planning"
        elif days_until_expiry <= 90:
            return "📅 Renewal period approaching - watch for renewal offers"
        else:
            return "✅ No immediate actions required"

    def _format_lease_details(self, lease: Dict[str, Any]) -> str:
        """Format detailed lease information"""
        end_date = datetime.fromisoformat(lease['end_date'].replace('Z', '+00:00'))
        start_date = datetime.fromisoformat(lease['start_date'].replace('Z', '+00:00'))
        days_until_expiry = (end_date - datetime.now()).days
        
        return f"""
📋 **Lease Agreement Details**

🏠 **Property:** {lease['property_name']} - Unit {lease['unit']}
🆔 **Lease ID:** {lease['id']}
✅ **Status:** {lease['status'].title()}

📅 **Lease Term:**
- Start Date: {start_date.strftime('%B %d, %Y')}
- End Date: {end_date.strftime('%B %d, %Y')}
- Days Remaining: {days_until_expiry}

💰 **Financial Details:**
- Monthly Rent: ${lease['rent_amount']:,}
- Security Deposit: ${lease.get('security_deposit', 0):,}
- Outstanding Fees: ${lease.get('outstanding_fees', 0):,}

📝 **Terms:**
- Notice Required: {lease.get('required_notice_days', 30)} days
- Early Termination Fee: ${lease.get('early_termination_fee', 0):,}

📊 **Current Status:**
- Rent Status: {lease.get('rent_status', 'Current')}
- Last Activity: {lease.get('recent_activity', 'None')}

💡 **Need Help?** Ask me about renewal, modifications, or termination options.
        """.strip()

    def _format_lease_list(self, leases: List[Dict[str, Any]]) -> str:
        """Format list of leases"""
        response = f"🏠 **Your Leases** ({len(leases)} total)\n\n"
        
        for i, lease in enumerate(leases, 1):
            end_date = datetime.fromisoformat(lease['end_date'].replace('Z', '+00:00'))
            days_until_expiry = (end_date - datetime.now()).days
            
            status_emoji = {
                "active": "✅",
                "expired": "❌",
                "pending": "⏳", 
                "terminated": "🚫"
            }
            
            response += f"""
**{i}. {lease['property_name']} - Unit {lease['unit']}**
{status_emoji.get(lease['status'], '❓')} Status: {lease['status'].title()}
💰 Rent: ${lease['rent_amount']:,}/month
📅 Expires: {end_date.strftime('%m/%d/%Y')} ({days_until_expiry} days)
🆔 ID: {lease['id']}

            """.strip() + "\n\n"
        
        response += "💡 **Tip:** Ask me about a specific lease using its ID for more details!"
        
        return response

class LeaseDocumentTool(BaseTool):
    name = "lease_documents"
    description = """
    Generate and retrieve lease-related documents including lease agreements,
    amendments, renewal documents, termination notices, and receipts.
    """
    args_schema = LeaseDocumentInput

    def _run(
        self,
        lease_id: str,
        document_type: str,
        user_id: str,
        **kwargs
    ) -> str:
        """Generate or retrieve lease documents"""
        try:
            valid_document_types = [
                "lease_agreement", "amendment", "renewal", "termination_notice",
                "receipt", "move_in_checklist", "move_out_checklist"
            ]
            
            if document_type.lower() not in valid_document_types:
                return f"Invalid document type. Available types: {', '.join(valid_document_types)}"
            
            lease_details = self._get_lease_details(lease_id)
            if not lease_details:
                return f"Lease {lease_id} not found."
            
            return self._generate_document(lease_details, document_type.lower(), user_id)
            
        except Exception as e:
            logger.error(f"Error generating lease document: {e}")
            return f"I encountered an error while generating the document: {str(e)}"

    def _generate_document(self, lease: Dict[str, Any], document_type: str, user_id: str) -> str:
        """Generate specific document type"""
        document_info = self._create_document(lease['id'], document_type, user_id)
        
        document_names = {
            "lease_agreement": "Lease Agreement",
            "amendment": "Lease Amendment",
            "renewal": "Lease Renewal Agreement",
            "termination_notice": "Lease Termination Notice",
            "receipt": "Rent Receipt", 
            "move_in_checklist": "Move-In Inspection Checklist",
            "move_out_checklist": "Move-Out Inspection Checklist"
        }
        
        return f"""
📄 **Document Generated Successfully**

📋 **Document:** {document_names.get(document_type, document_type.title())}
🏠 **Property:** {lease['property_name']} - Unit {lease['unit']}
🆔 **Lease ID:** {lease['id']}
📅 **Generated:** {datetime.now().strftime('%B %d, %Y at %I:%M %p')}

📎 **Download Options:**
- PDF: {document_info['pdf_url']}
- View Online: {document_info['view_url']}

📧 **Email Delivery:**
A copy has been sent to your registered email address.

📝 **Document Details:**
- File Size: {document_info['file_size']}
- Pages: {document_info['page_count']}
- Valid Until: {document_info['expiry_date']}

🔒 **Security:** All documents are encrypted and access-controlled.

💬 **Need another document?** Just let me know what you need!
        """.strip()

    def _create_document(self, lease_id: str, document_type: str, user_id: str) -> Dict[str, Any]:
        """Create document - replace with actual document generation"""
        import uuid
        
        # Mock document creation - replace with actual document service
        return {
            "document_id": f"DOC_{uuid.uuid4().hex[:8].upper()}",
            "pdf_url": f"https://propflow.com/documents/{lease_id}/{document_type}.pdf",
            "view_url": f"https://propflow.com/documents/view/{lease_id}/{document_type}",
            "file_size": "2.3 MB",
            "page_count": "12 pages",
            "expiry_date": (datetime.now() + timedelta(days=30)).strftime('%B %d, %Y')
        }

    def _get_lease_details(self, lease_id: str) -> Optional[Dict[str, Any]]:
        """Get lease details - reuse from LeaseManagementTool"""
        # Mock data - replace with actual API call
        mock_leases = {
            "LEASE_123": {
                "id": "LEASE_123",
                "property_name": "Downtown Apartment Complex",
                "unit": "2B",
                "status": "active"
            }
        }
        return mock_leases.get(lease_id)