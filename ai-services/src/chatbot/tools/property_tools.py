from langchain.tools import BaseTool
from typing import Dict, Any, Optional, List
import json
import httpx
import logging
from datetime import datetime, timedelta
import asyncio
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class PropertySearchInput(BaseModel):
    location: Optional[str] = Field(None, description="Location to search for properties")
    property_type: Optional[str] = Field(None, description="Type of property (apartment, house, etc.)")
    min_price: Optional[float] = Field(None, description="Minimum price range")
    max_price: Optional[float] = Field(None, description="Maximum price range")
    bedrooms: Optional[int] = Field(None, description="Number of bedrooms")
    bathrooms: Optional[int] = Field(None, description="Number of bathrooms")
    amenities: Optional[List[str]] = Field(None, description="Required amenities")

class PropertyBookingInput(BaseModel):
    property_id: str = Field(..., description="ID of the property to book")
    user_id: str = Field(..., description="ID of the user making the booking")
    booking_type: str = Field(..., description="Type of booking (viewing, inspection, etc.)")
    preferred_date: str = Field(..., description="Preferred date for the booking")
    preferred_time: str = Field(..., description="Preferred time for the booking")
    notes: Optional[str] = Field(None, description="Additional notes for the booking")

class PropertySearchTool(BaseTool):
    name = "property_search"
    description = """
    Search for properties based on criteria like location, price range, property type, etc.
    Use this tool when users want to find properties that match their requirements.
    """
    args_schema = PropertySearchInput

    def _run(
        self,
        location: Optional[str] = None,
        property_type: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        bedrooms: Optional[int] = None,
        bathrooms: Optional[int] = None,
        amenities: Optional[List[str]] = None,
        **kwargs
    ) -> str:
        """Search for properties"""
        try:
            # Build search parameters
            search_params = {}
            if location:
                search_params['location'] = location
            if property_type:
                search_params['property_type'] = property_type
            if min_price is not None:
                search_params['min_price'] = min_price
            if max_price is not None:
                search_params['max_price'] = max_price
            if bedrooms is not None:
                search_params['bedrooms'] = bedrooms
            if bathrooms is not None:
                search_params['bathrooms'] = bathrooms
            if amenities:
                search_params['amenities'] = amenities

            # Make API call to property service
            # This would be replaced with actual API call
            properties = self._search_properties(search_params)
            
            if not properties:
                return "No properties found matching your criteria. Try adjusting your search parameters."
            
            # Format response
            response = f"Found {len(properties)} properties:\n\n"
            for prop in properties[:5]:  # Limit to top 5 results
                response += f"🏠 **{prop['title']}**\n"
                response += f"📍 {prop['address']}\n"
                response += f"💰 ${prop['price']:,}/month\n"
                response += f"🛏️ {prop['bedrooms']} bed, {prop['bathrooms']} bath\n"
                response += f"📏 {prop['square_feet']} sq ft\n"
                if prop.get('amenities'):
                    response += f"✨ Amenities: {', '.join(prop['amenities'][:3])}\n"
                response += f"🆔 Property ID: {prop['id']}\n\n"
            
            if len(properties) > 5:
                response += f"... and {len(properties) - 5} more properties. Use more specific criteria to narrow results."
            
            return response
            
        except Exception as e:
            logger.error(f"Error searching properties: {e}")
            return f"I encountered an error while searching for properties: {str(e)}"

    def _search_properties(self, search_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Mock property search - replace with actual API call"""
        # This is mock data - replace with actual property service API call
        mock_properties = [
            {
                "id": "prop_123",
                "title": "Modern Downtown Apartment",
                "address": "123 Main St, Downtown",
                "price": 2500,
                "bedrooms": 2,
                "bathrooms": 2,
                "square_feet": 1200,
                "amenities": ["parking", "gym", "pool", "pet_friendly"]
            },
            {
                "id": "prop_456",
                "title": "Cozy Suburban House",
                "address": "456 Oak Ave, Suburbs",
                "price": 3200,
                "bedrooms": 3,
                "bathrooms": 2,
                "square_feet": 1800,
                "amenities": ["garden", "garage", "fireplace"]
            }
        ]
        
        # Apply basic filtering
        filtered_properties = []
        for prop in mock_properties:
            if search_params.get('min_price') and prop['price'] < search_params['min_price']:
                continue
            if search_params.get('max_price') and prop['price'] > search_params['max_price']:
                continue
            if search_params.get('bedrooms') and prop['bedrooms'] != search_params['bedrooms']:
                continue
            if search_params.get('location') and search_params['location'].lower() not in prop['address'].lower():
                continue
            filtered_properties.append(prop)
        
        return filtered_properties

class PropertyBookingTool(BaseTool):
    name = "property_booking"
    description = """
    Book a property viewing or inspection. Use this tool when users want to schedule 
    a viewing, inspection, or other property-related appointment.
    """
    args_schema = PropertyBookingInput

    def _run(
        self,
        property_id: str,
        user_id: str,
        booking_type: str,
        preferred_date: str,
        preferred_time: str,
        notes: Optional[str] = None,
        **kwargs
    ) -> str:
        """Book a property viewing or inspection"""
        try:
            # Validate inputs
            if not property_id or not user_id:
                return "Error: Property ID and User ID are required for booking."
            
            # Check property availability
            property_info = self._get_property_info(property_id)
            if not property_info:
                return f"Error: Property with ID {property_id} not found."
            
            # Create booking
            booking_data = {
                "property_id": property_id,
                "user_id": user_id,
                "booking_type": booking_type,
                "preferred_date": preferred_date,
                "preferred_time": preferred_time,
                "notes": notes or "",
                "status": "pending"
            }
            
            booking_result = self._create_booking(booking_data)
            
            if booking_result['success']:
                return f"""
✅ **Booking Request Submitted Successfully!**

📋 **Booking Details:**
🏠 Property: {property_info['title']}
📍 Address: {property_info['address']}
📅 Requested Date: {preferred_date}
🕐 Requested Time: {preferred_time}
📝 Type: {booking_type}
🆔 Booking ID: {booking_result['booking_id']}

📧 You'll receive a confirmation email once the booking is approved by the property manager.
📱 You can track your booking status in the app or ask me for updates.

Need to make changes? Just let me know!
                """.strip()
            else:
                return f"Sorry, I couldn't complete your booking: {booking_result.get('error', 'Unknown error')}"
                
        except Exception as e:
            logger.error(f"Error creating booking: {e}")
            return f"I encountered an error while processing your booking request: {str(e)}"

    def _get_property_info(self, property_id: str) -> Optional[Dict[str, Any]]:
        """Get property information - replace with actual API call"""
        # Mock property data
        properties = {
            "prop_123": {
                "id": "prop_123",
                "title": "Modern Downtown Apartment",
                "address": "123 Main St, Downtown",
                "available": True
            },
            "prop_456": {
                "id": "prop_456",
                "title": "Cozy Suburban House",
                "address": "456 Oak Ave, Suburbs",
                "available": True
            }
        }
        return properties.get(property_id)

    def _create_booking(self, booking_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a booking - replace with actual API call"""
        # Mock booking creation
        import uuid
        return {
            "success": True,
            "booking_id": f"book_{uuid.uuid4().hex[:8]}",
            "status": "pending"
        }

class PropertyDetailsTool(BaseTool):
    name = "property_details"
    description = """
    Get detailed information about a specific property including amenities, 
    photos, floor plans, and availability.
    """

    def _run(self, property_id: str, **kwargs) -> str:
        """Get detailed property information"""
        try:
            property_details = self._get_detailed_property_info(property_id)
            
            if not property_details:
                return f"Property with ID {property_id} not found."
            
            response = f"""
🏠 **{property_details['title']}**
📍 **Address:** {property_details['address']}
💰 **Price:** ${property_details['price']:,}/month
🛏️ **Bedrooms:** {property_details['bedrooms']}
🛁 **Bathrooms:** {property_details['bathrooms']}
📏 **Square Feet:** {property_details['square_feet']} sq ft
🏗️ **Year Built:** {property_details.get('year_built', 'N/A')}
🅿️ **Parking:** {property_details.get('parking', 'N/A')}

✨ **Amenities:**
{', '.join(property_details.get('amenities', []))}

📝 **Description:**
{property_details.get('description', 'No description available.')}

📊 **Availability:** {'Available' if property_details.get('available') else 'Not Available'}

Would you like to schedule a viewing or get more information about this property?
            """.strip()
            
            return response
            
        except Exception as e:
            logger.error(f"Error getting property details: {e}")
            return f"I encountered an error while retrieving property details: {str(e)}"

    def _get_detailed_property_info(self, property_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed property information - replace with actual API call"""
        # Mock detailed property data
        properties = {
            "prop_123": {
                "id": "prop_123",
                "title": "Modern Downtown Apartment",
                "address": "123 Main St, Downtown",
                "price": 2500,
                "bedrooms": 2,
                "bathrooms": 2,
                "square_feet": 1200,
                "year_built": 2020,
                "parking": "1 covered space",
                "amenities": [
                    "In-unit laundry", "Dishwasher", "Air conditioning",
                    "Balcony", "Gym access", "Rooftop terrace", "Pet friendly"
                ],
                "description": "Beautiful modern apartment in the heart of downtown with stunning city views. Features high-end finishes, stainless steel appliances, and access to building amenities.",
                "available": True
            }
        }
        return properties.get(property_id)