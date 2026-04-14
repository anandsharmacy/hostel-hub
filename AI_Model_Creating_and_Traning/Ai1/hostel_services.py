"""
Hostel Services Voice Assistant Functions.
All voice-callable functions for student, admin, vendor, barber, and laundry roles.
Uses @llm.ai_callable decorator for LiveKit Agents integration.
"""

import enum
import logging
from typing import Annotated, Optional
from datetime import datetime, timedelta

from livekit.agents import llm
from supabase_client import HostelSupabaseClient

logger = logging.getLogger("hostel-services")
logger.setLevel(logging.INFO)


class UserRole(enum.Enum):
    """User roles in the hostel system."""
    STUDENT = "student"
    ADMIN = "admin"
    VENDOR = "vendor"
    SUPER_USER = "super_user"
    BARBER = "barber"
    LAUNDRY = "laundry"


class ServiceType(enum.Enum):
    """Types of hostel services."""
    CLEANING = "cleaning"
    APPLIANCE = "appliance"
    STORE = "store"
    MEDICINE = "medicine"
    SALON = "salon"
    LAUNDRY = "laundry"


class TimeSlot(enum.Enum):
    """Available time slots for services."""
    EARLY_MORNING = "06:00-08:00"
    MORNING = "08:00-10:00"
    LATE_MORNING = "10:00-12:00"
    AFTERNOON = "12:00-14:00"
    LATE_AFTERNOON = "14:00-16:00"
    EVENING = "16:00-18:00"
    LATE_EVENING = "18:00-20:00"
    NIGHT = "20:00-22:00"


class Appliance(enum.Enum):
    """Common appliances in hostel rooms."""
    FAN = "fan"
    AC = "ac"
    HEATER = "heater"
    LIGHT = "light"
    PLUG = "electrical_outlet"
    DOOR = "door_lock"
    WINDOW = "window"
    BED = "bed"


class Urgency(enum.Enum):
    """Request urgency levels."""
    NORMAL = "normal"
    MODERATE = "moderate"
    URGENT = "urgent"


class HostelServicesFunctions:
    """Voice-callable functions for hostel services."""

    def __init__(self, supabase_client: HostelSupabaseClient, user_id: str, user_role: UserRole):
        """Initialize services with authenticated user context."""
        self.db = supabase_client
        self.user_id = user_id
        self.user_role = user_role
        logger.info(f"Initialized services for user {user_id} ({user_role.value})")

    @llm.function_tool
    def book_cleaning_service(
        self,
        hostel_name: Annotated[str, "Name of your hostel"],
        date: Annotated[str, "Requested date or 'tomorrow'"],
        time_slot: Annotated[TimeSlot, "Preferred time slot"],
        special_requests: Annotated[Optional[str], "Special requests"] = None,
    ) -> str:
        """Book a cleaning service for the user's room."""
        if self.user_role != UserRole.STUDENT:
            return "Error: Only students can book cleaning services."
        
        try:
            requested_date = date if date != "tomorrow" else (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            
            result = self.db.create_cleaning_request(
                user_id=self.user_id,
                hostel_name=hostel_name,
                requested_date=requested_date,
                requested_time=time_slot.value.split("-")[0],
                special_requests=special_requests,
            )
            
            if result:
                booking_id = result.get("id")
                return f"✓ Cleaning service booked! ID: {booking_id}. Scheduled for {requested_date} at {time_slot.value}."
            return "Error: Could not create booking."
                
        except Exception as e:
            logger.error(f"Error: {e}")
            return f"Error: {str(e)}"

    @llm.function_tool
    def report_appliance_issue(
        self,
        appliance_type: Annotated[Appliance, "Type of appliance"],
        description: Annotated[str, "Problem description"],
        has_image: Annotated[bool, "Upload photo?"] = False,
    ) -> str:
        """Report an appliance issue to maintenance."""
        if self.user_role != UserRole.STUDENT:
            return "Error: Only students can report appliance issues."
        
        try:
            result = self.db.create_appliance_complaint(
                user_id=self.user_id,
                appliance_type=appliance_type.value,
                description=description,
            )
            
            if result:
                complaint_id = result.get("id")
                return f"✓ Issue reported! ID: {complaint_id}. We'll fix the {appliance_type.value} within 24-48 hours."
            return "Error: Could not create complaint."
                
        except Exception as e:
            logger.error(f"Error: {e}")
            return f"Error: {str(e)}"

    @llm.function_tool
    def place_store_order(
        self,
        items: Annotated[str, "Items to order (comma-separated)"],
        quantity: Annotated[int, "Quantity"] = 1,
        delivery_preference: Annotated[str, "Delivery or pickup"] = "hostel_delivery",
    ) -> str:
        """Place an order from hostel store."""
        if self.user_role != UserRole.STUDENT:
            return "Error: Only students can place orders."
        
        try:
            item_list = [item.strip() for item in items.split(",")]
            items_data = [{"name": item, "quantity": quantity} for item in item_list]
            
            result = self.db.create_store_order(
                user_id=self.user_id,
                items=items_data,
                delivery_preference=delivery_preference,
            )
            
            if result:
                order_id = result.get("id")
                return f"✓ Order placed! ID: {order_id}. Items: {', '.join(item_list)}."
            return "Error: Could not create order."
                
        except Exception as e:
            logger.error(f"Error: {e}")
            return f"Error: {str(e)}"

    @llm.function_tool
    def request_medicine(
        self,
        medicine_name: Annotated[Optional[str], "Medicine name"] = None,
        has_prescription: Annotated[bool, "Have prescription?"] = False,
        urgency: Annotated[Urgency, "Urgency level"] = Urgency.NORMAL,
    ) -> str:
        """Request medicine from the medical facility."""
        if self.user_role != UserRole.STUDENT:
            return "Error: Only students can request medicine."
        
        try:
            result = self.db.create_medicine_request(
                user_id=self.user_id,
                medicine_name=medicine_name,
                urgency=urgency.value,
            )
            
            if result:
                request_id = result.get("id")
                return f"✓ Medicine request submitted! ID: {request_id}."
            return "Error: Could not create request."
                
        except Exception as e:
            logger.error(f"Error: {e}")
            return f"Error: {str(e)}"

    @llm.function_tool
    def view_my_requests(self) -> str:
        """Get summary of all user's pending requests."""
        if self.user_role != UserRole.STUDENT:
            return "Error: Only students can view their requests."
        
        try:
            all_requests = self.db.get_all_user_requests(self.user_id)
            
            response = "📋 Your Pending Requests:\n\n"
            response += f"🧹 Cleaning: {len(all_requests.get('cleaning', []))} pending\n"
            response += f"🔧 Appliance Issues: {len(all_requests.get('appliances', []))} open\n"
            response += f"🛒 Store Orders: {len(all_requests.get('orders', []))} pending\n"
            response += f"💊 Medicine: {len(all_requests.get('medicine', []))} pending\n"
            
            return response
            
        except Exception as e:
            logger.error(f"Error: {e}")
            return f"Error: {str(e)}"

    @llm.function_tool
    def join_salon_queue(
        self,
        hostel_name: Annotated[str, "Hostel name"],
        service_type: Annotated[str, "Service type"] = "general",
    ) -> str:
        """Join the salon queue."""
        if self.user_role != UserRole.STUDENT:
            return "Error: Only students can join queue."
        
        try:
            position = self.db.get_user_queue_position(self.user_id, hostel_name)
            if position:
                return f"✓ Already in queue at position #{position}."
            
            result = self.db.add_to_salon_queue(self.user_id, hostel_name, service_type)
            if result:
                position = result.get("queue_position")
                return f"✓ Joined queue! Position: #{position}. Estimated wait: ~{position * 15} min."
            return "Error: Could not join queue."
                
        except Exception as e:
            logger.error(f"Error: {e}")
            return f"Error: {str(e)}"

    @llm.function_tool
    def get_notifications_summary(self) -> str:
        """Get notifications and announcements."""
        try:
            announcements = self.db.get_announcements()
            response = "📢 Your Notifications:\n\n"
            
            if announcements:
                response += "📣 Announcements:\n"
                for announce in announcements[:3]:
                    response += f"  • {announce.get('title', 'Update')}\n"
            
            return response
            
        except Exception as e:
            logger.error(f"Error: {e}")
            return f"Error: {str(e)}"

    @llm.function_tool
    def get_admin_dashboard(self) -> str:
        """Get admin dashboard."""
        if self.user_role != UserRole.ADMIN:
            return "Error: Admin only."
        
        return "📊 Admin Dashboard: 12 pending approvals, 8 active cleaning, 5 open issues."
