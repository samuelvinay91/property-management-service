from langchain.tools import BaseTool
from typing import Dict, Any, Optional, List
import json
import logging
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class PaymentProcessingInput(BaseModel):
    user_id: str = Field(..., description="ID of the user making the payment")
    payment_type: str = Field(..., description="Type of payment (rent, deposit, fee, etc.)")
    amount: float = Field(..., description="Payment amount")
    property_id: Optional[str] = Field(None, description="Property ID if applicable")
    lease_id: Optional[str] = Field(None, description="Lease ID if applicable")
    payment_method: str = Field(..., description="Payment method (card, bank, etc.)")
    description: Optional[str] = Field(None, description="Payment description")

class PaymentStatusInput(BaseModel):
    payment_id: Optional[str] = Field(None, description="Specific payment ID")
    user_id: Optional[str] = Field(None, description="User ID to get all payments for")
    date_range: Optional[str] = Field(None, description="Date range filter (e.g., 'last_month')")
    status_filter: Optional[str] = Field(None, description="Filter by status")

class PaymentProcessingTool(BaseTool):
    name = "payment_processing"
    description = """
    Process payments for rent, deposits, fees, or other charges. Use this when users
    want to make payments or set up payment methods. Handles secure payment processing.
    """
    args_schema = PaymentProcessingInput

    def _run(
        self,
        user_id: str,
        payment_type: str,
        amount: float,
        payment_method: str,
        property_id: Optional[str] = None,
        lease_id: Optional[str] = None,
        description: Optional[str] = None,
        **kwargs
    ) -> str:
        """Process a payment"""
        try:
            # Validate inputs
            valid_payment_types = [
                "rent", "security_deposit", "pet_deposit", "application_fee",
                "late_fee", "maintenance_fee", "utilities", "other"
            ]
            valid_payment_methods = ["credit_card", "debit_card", "bank_transfer", "ach"]
            
            if payment_type.lower() not in valid_payment_types:
                return f"Invalid payment type. Please choose from: {', '.join(valid_payment_types)}"
            
            if payment_method.lower() not in valid_payment_methods:
                return f"Invalid payment method. Please choose from: {', '.join(valid_payment_methods)}"
            
            if amount <= 0:
                return "Payment amount must be greater than zero."
            
            # Get user's payment methods
            user_payment_methods = self._get_user_payment_methods(user_id)
            if not user_payment_methods:
                return """
❌ **No Payment Methods Found**

To make a payment, you'll need to add a payment method first:
1. Go to Settings → Payment Methods
2. Add a credit card, debit card, or bank account
3. Return here to complete your payment

Would you like me to guide you through adding a payment method?
                """.strip()
            
            # Process the payment
            payment_data = {
                "user_id": user_id,
                "payment_type": payment_type.lower(),
                "amount": amount,
                "payment_method": payment_method.lower(),
                "property_id": property_id,
                "lease_id": lease_id,
                "description": description or f"{payment_type.title()} payment"
            }
            
            result = self._process_payment(payment_data)
            
            if result['success']:
                payment_type_emoji = {
                    "rent": "🏠",
                    "security_deposit": "🔒",
                    "pet_deposit": "🐕",
                    "application_fee": "📄",
                    "late_fee": "⏰",
                    "maintenance_fee": "🔧",
                    "utilities": "💡",
                    "other": "💳"
                }
                
                return f"""
✅ **Payment Processed Successfully!**

💳 **Payment Details:**
{payment_type_emoji.get(payment_type, '💳')} **Type:** {payment_type.title().replace('_', ' ')}
💰 **Amount:** ${amount:,.2f}
🆔 **Transaction ID:** {result['transaction_id']}
📅 **Date:** {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p')}

🧾 **Receipt:**
- Payment Method: {self._format_payment_method(payment_method)}
- Processing Fee: ${result.get('processing_fee', 0):.2f}
- Total Charged: ${result.get('total_amount', amount):.2f}

📧 **Confirmation:**
A receipt has been sent to your email address.

📊 **Account Status:**
{result.get('account_status', 'Payment recorded successfully')}

❓ **Questions?** Contact our billing department at billing@propflow.com
                """.strip()
            else:
                error_message = result.get('error', 'Unknown error occurred')
                return f"""
❌ **Payment Failed**

Unfortunately, we couldn't process your payment: {error_message}

🔧 **What to try:**
1. Check that your payment method has sufficient funds
2. Verify your payment information is correct
3. Try a different payment method
4. Contact your bank if the issue persists

💬 **Need Help?** I can help you:
- Check your payment methods
- Review your account balance
- Contact our billing support

Would you like me to help with any of these options?
                """.strip()
                
        except Exception as e:
            logger.error(f"Error processing payment: {e}")
            return f"I encountered an error while processing your payment: {str(e)}"

    def _get_user_payment_methods(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's saved payment methods - replace with actual API call"""
        # Mock data - replace with actual API call
        return [
            {
                "id": "pm_123",
                "type": "credit_card",
                "last_four": "4242",
                "brand": "visa",
                "is_default": True
            }
        ]

    def _process_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment - replace with actual payment gateway integration"""
        import uuid
        
        # Mock payment processing - replace with actual payment gateway
        return {
            "success": True,
            "transaction_id": f"TXN{uuid.uuid4().hex[:12].upper()}",
            "processing_fee": payment_data["amount"] * 0.029,  # 2.9% processing fee
            "total_amount": payment_data["amount"] * 1.029,
            "account_status": "Payment received and processed"
        }

    def _format_payment_method(self, payment_method: str) -> str:
        """Format payment method for display"""
        method_names = {
            "credit_card": "Credit Card",
            "debit_card": "Debit Card", 
            "bank_transfer": "Bank Transfer",
            "ach": "ACH Bank Transfer"
        }
        return method_names.get(payment_method, payment_method.title())

class PaymentStatusTool(BaseTool):
    name = "payment_status"
    description = """
    Check payment status and history. Can look up specific payments by ID or
    get payment history for a user. Shows transaction details, status, and receipts.
    """
    args_schema = PaymentStatusInput

    def _run(
        self,
        payment_id: Optional[str] = None,
        user_id: Optional[str] = None,
        date_range: Optional[str] = None,
        status_filter: Optional[str] = None,
        **kwargs
    ) -> str:
        """Get payment status and history"""
        try:
            if payment_id:
                # Get specific payment
                payment_details = self._get_payment_details(payment_id)
                if not payment_details:
                    return f"Payment with ID {payment_id} not found."
                
                return self._format_single_payment(payment_details)
            
            elif user_id:
                # Get payment history for user
                payments = self._get_user_payment_history(user_id, date_range, status_filter)
                if not payments:
                    filter_text = ""
                    if date_range:
                        filter_text += f" for {date_range}"
                    if status_filter:
                        filter_text += f" with status '{status_filter}'"
                    return f"No payments found{filter_text}."
                
                return self._format_payment_history(payments)
            
            else:
                return "Please provide either a payment ID or user ID to check payment status."
                
        except Exception as e:
            logger.error(f"Error getting payment status: {e}")
            return f"I encountered an error while checking payment status: {str(e)}"

    def _get_payment_details(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """Get specific payment details - replace with actual API call"""
        # Mock data - replace with actual API call
        mock_payments = {
            "TXN123456789": {
                "id": "TXN123456789",
                "type": "rent",
                "amount": 2500.00,
                "processing_fee": 72.50,
                "total_amount": 2572.50,
                "status": "completed",
                "payment_method": "credit_card",
                "last_four": "4242",
                "property_name": "Downtown Apartment Complex",
                "unit": "2B",
                "created_at": "2024-01-15T10:00:00Z",
                "processed_at": "2024-01-15T10:00:05Z",
                "description": "January 2024 Rent Payment"
            }
        }
        return mock_payments.get(payment_id)

    def _get_user_payment_history(
        self,
        user_id: str,
        date_range: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get user payment history - replace with actual API call"""
        # Mock data - replace with actual API call
        mock_payments = [
            {
                "id": "TXN123456789",
                "type": "rent",
                "amount": 2500.00,
                "status": "completed",
                "created_at": "2024-01-15T10:00:00Z",
                "description": "January 2024 Rent Payment"
            },
            {
                "id": "TXN987654321",
                "type": "utilities",
                "amount": 150.00,
                "status": "completed", 
                "created_at": "2024-01-10T14:30:00Z",
                "description": "January 2024 Utilities"
            },
            {
                "id": "TXN456789123",
                "type": "late_fee",
                "amount": 75.00,
                "status": "pending",
                "created_at": "2024-01-20T09:15:00Z",
                "description": "Late Fee - December 2023"
            }
        ]
        
        # Apply filters
        if status_filter:
            mock_payments = [p for p in mock_payments if p['status'] == status_filter.lower()]
        
        if date_range:
            # Simple date range filtering
            now = datetime.utcnow()
            if date_range == "last_month":
                cutoff = now - timedelta(days=30)
                mock_payments = [
                    p for p in mock_payments 
                    if datetime.fromisoformat(p['created_at'].replace('Z', '+00:00')) >= cutoff
                ]
        
        return mock_payments

    def _format_single_payment(self, payment: Dict[str, Any]) -> str:
        """Format single payment details"""
        status_emoji = {
            "completed": "✅",
            "pending": "⏳",
            "failed": "❌",
            "refunded": "↩️",
            "cancelled": "🚫"
        }
        
        payment_type_emoji = {
            "rent": "🏠",
            "security_deposit": "🔒",
            "pet_deposit": "🐕",
            "application_fee": "📄",
            "late_fee": "⏰",
            "maintenance_fee": "🔧",
            "utilities": "💡",
            "other": "💳"
        }
        
        response = f"""
💳 **Payment Details**

🆔 **Transaction ID:** {payment['id']}
{payment_type_emoji.get(payment['type'], '💳')} **Type:** {payment['type'].title().replace('_', ' ')}
{status_emoji.get(payment['status'], '❓')} **Status:** {payment['status'].title()}

💰 **Amount Breakdown:**
- Payment Amount: ${payment['amount']:.2f}
- Processing Fee: ${payment.get('processing_fee', 0):.2f}
- **Total Charged:** ${payment.get('total_amount', payment['amount']):.2f}

📋 **Details:**
- Description: {payment.get('description', 'N/A')}
- Payment Method: {self._format_payment_method(payment.get('payment_method', 'N/A'))}
        """.strip()
        
        if payment.get('last_four'):
            response += f" ending in {payment['last_four']}"
        
        response += f"""

📅 **Timeline:**
- Created: {datetime.fromisoformat(payment['created_at'].replace('Z', '+00:00')).strftime('%B %d, %Y at %I:%M %p')}
        """
        
        if payment.get('processed_at'):
            response += f"\n- Processed: {datetime.fromisoformat(payment['processed_at'].replace('Z', '+00:00')).strftime('%B %d, %Y at %I:%M %p')}"
        
        if payment.get('property_name'):
            response += f"\n\n📍 **Property:** {payment['property_name']}"
            if payment.get('unit'):
                response += f" - Unit {payment['unit']}"
        
        return response

    def _format_payment_history(self, payments: List[Dict[str, Any]]) -> str:
        """Format payment history"""
        status_emoji = {
            "completed": "✅",
            "pending": "⏳", 
            "failed": "❌",
            "refunded": "↩️",
            "cancelled": "🚫"
        }
        
        payment_type_emoji = {
            "rent": "🏠",
            "security_deposit": "🔒",
            "pet_deposit": "🐕",
            "application_fee": "📄",
            "late_fee": "⏰",
            "maintenance_fee": "🔧",
            "utilities": "💡",
            "other": "💳"
        }
        
        total_amount = sum(p['amount'] for p in payments if p['status'] == 'completed')
        pending_amount = sum(p['amount'] for p in payments if p['status'] == 'pending')
        
        response = f"""
💳 **Payment History** ({len(payments)} transactions)

📊 **Summary:**
- Total Completed: ${total_amount:,.2f}
- Pending: ${pending_amount:,.2f}

📋 **Recent Transactions:**

        """.strip()
        
        for i, payment in enumerate(payments[:10], 1):  # Show latest 10
            response += f"""
**{i}. {payment['description']}**
{payment_type_emoji.get(payment['type'], '💳')} {payment['type'].title().replace('_', ' ')} | ${payment['amount']:.2f} | {status_emoji.get(payment['status'], '❓')} {payment['status'].title()}
🆔 {payment['id']} | 📅 {datetime.fromisoformat(payment['created_at'].replace('Z', '+00:00')).strftime('%m/%d/%Y')}

            """.strip() + "\n\n"
        
        if len(payments) > 10:
            response += f"... and {len(payments) - 10} more transactions.\n\n"
        
        response += "💡 **Tip:** Ask me about a specific transaction using its ID for more details!"
        
        return response

class PaymentMethodTool(BaseTool):
    name = "payment_methods"
    description = """
    Manage payment methods including adding, removing, or updating credit cards,
    debit cards, and bank accounts for automatic payments.
    """

    def _run(
        self,
        action: str,
        user_id: str,
        payment_method_id: Optional[str] = None,
        **kwargs
    ) -> str:
        """Manage payment methods"""
        try:
            if action.lower() == "list":
                return self._list_payment_methods(user_id)
            elif action.lower() == "add":
                return self._guide_add_payment_method()
            elif action.lower() == "remove":
                if not payment_method_id:
                    return "Please provide a payment method ID to remove."
                return self._remove_payment_method(user_id, payment_method_id)
            else:
                return "Invalid action. Available actions: list, add, remove"
                
        except Exception as e:
            logger.error(f"Error managing payment methods: {e}")
            return f"I encountered an error while managing payment methods: {str(e)}"

    def _list_payment_methods(self, user_id: str) -> str:
        """List user's payment methods"""
        methods = self._get_user_payment_methods(user_id)
        
        if not methods:
            return """
💳 **No Payment Methods Found**

You haven't added any payment methods yet. Would you like to add one?

**Available Options:**
- Credit Card (Visa, MasterCard, American Express)
- Debit Card
- Bank Account (ACH Transfer)

To add a payment method, go to Settings → Payment Methods or ask me to guide you through the process.
            """.strip()
        
        response = f"💳 **Your Payment Methods** ({len(methods)} total)\n\n"
        
        for i, method in enumerate(methods, 1):
            default_text = " (Default)" if method.get('is_default') else ""
            response += f"**{i}. {method['brand'].title()} ending in {method['last_four']}**{default_text}\n"
            response += f"🆔 ID: {method['id']} | 💳 Type: {method['type'].title().replace('_', ' ')}\n\n"
        
        response += "💡 **Tip:** You can set a default payment method or remove unused ones in Settings."
        
        return response

    def _guide_add_payment_method(self) -> str:
        """Guide user to add payment method"""
        return """
💳 **Add Payment Method**

For security reasons, payment methods must be added through the secure web portal:

**Steps:**
1. Go to Settings → Payment Methods
2. Click "Add New Payment Method"
3. Choose your preferred method:
   - Credit/Debit Card
   - Bank Account (ACH)
4. Enter your information securely
5. Verify the method if required

**Security Features:**
- 256-bit SSL encryption
- PCI DSS compliant processing
- Tokenized storage (we never store your full card number)
- Fraud protection

🔒 **Your payment information is always secure and encrypted.**

Would you like me to help with anything else regarding payments?
        """.strip()

    def _remove_payment_method(self, user_id: str, payment_method_id: str) -> str:
        """Remove a payment method"""
        # Mock removal - replace with actual API call
        return f"""
✅ **Payment Method Removed**

The payment method {payment_method_id} has been successfully removed from your account.

**Important Notes:**
- Any scheduled automatic payments using this method will need to be updated
- Active subscriptions may be affected
- You can add new payment methods anytime in Settings

💡 **Recommendation:** Make sure you have at least one active payment method for rent payments.
        """.strip()

    def _get_user_payment_methods(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's payment methods"""
        # Mock data - same as in PaymentProcessingTool
        return [
            {
                "id": "pm_123",
                "type": "credit_card",
                "last_four": "4242", 
                "brand": "visa",
                "is_default": True
            }
        ]