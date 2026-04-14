"""
Supabase client integration for hostel voice assistant.
Handles authenticated Supabase connections, RLS, and role-scoped queries.
"""

import os
import logging
from typing import Optional, Any
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger("supabase-client")
logger.setLevel(logging.INFO)

load_dotenv()


class HostelSupabaseClient:
    """
    Authenticated Supabase client with RLS support.
    Manages all database operations for voice assistant.
    """

    def __init__(self, jwt_token: Optional[str] = None, service_role: bool = False):
        """
        Initialize Supabase client.
        
        Args:
            jwt_token: User's JWT token from Supabase Auth (for RLS enforcement)
            service_role: If True, use service_role_key for admin operations
        """
        self.supabase_url = os.getenv("SUPABASE_URL")
        
        if service_role:
            api_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        else:
            api_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not api_key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
        
        self.client: Client = create_client(self.supabase_url, api_key)
        self.jwt_token = jwt_token
        self.service_role = service_role

        if jwt_token and not service_role:
            self._apply_user_token(jwt_token)
        
        logger.info(f"Initialized Supabase client (service_role={service_role})")

    def _apply_user_token(self, jwt_token: str) -> None:
        """Attach user JWT to PostgREST requests so RLS policies evaluate against the caller."""
        try:
            self.client.postgrest.auth(jwt_token)
            logger.info("Applied user JWT to Supabase PostgREST client")
        except Exception as e:
            logger.warning(f"Could not apply user JWT to Supabase client: {e}")

    def get_cleaning_requests(
        self, user_id: str, status: Optional[str] = None
    ) -> list[dict]:
        """
        Get cleaning requests for a user (RLS enforced).
        
        Args:
            user_id: User ID from JWT
            status: Filter by status (pending, in_progress, completed, cancelled)
        
        Returns:
            List of cleaning request dicts
        """
        try:
            query = self.client.table("cleaning_request").select("*").eq("user_id", user_id)
            
            if status:
                query = query.eq("status", status)
            
            response = query.order("created_at", desc=True).execute()
            logger.info(f"Fetched {len(response.data)} cleaning requests for user {user_id}")
            return response.data
            
        except Exception as e:
            logger.error(f"Error fetching cleaning requests: {e}")
            return []

    def create_cleaning_request(
        self,
        user_id: str,
        hostel_name: str,
        requested_date: str,
        requested_time: str,
        special_requests: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Create a new cleaning request.
        
        Args:
            user_id: User ID from JWT
            hostel_name: Name of hostel
            requested_date: Requested cleaning date (YYYY-MM-DD)
            requested_time: Requested cleaning time (HH:MM)
            special_requests: Optional special requests
        
        Returns:
            Created record dict or None if failed
        """
        try:
            data = {
                "user_id": user_id,
                "hostel_name": hostel_name,
                "requested_date": requested_date,
                "requested_time": requested_time,
                "special_requests": special_requests or "",
                "status": "pending",
            }
            
            response = self.client.table("cleaning_request").insert(data).execute()
            logger.info(f"Created cleaning request: {response.data[0]['id']}")
            return response.data[0] if response.data else None
            
        except Exception as e:
            logger.error(f"Error creating cleaning request: {e}")
            return None

    def get_appliance_complaints(
        self, user_id: str, status: Optional[str] = None
    ) -> list[dict]:
        """
        Get appliance complaints for a user.
        
        Args:
            user_id: User ID from JWT
            status: Filter by status (open, in_progress, resolved)
        
        Returns:
            List of complaint dicts
        """
        try:
            query = self.client.table("appliance_complaint").select("*").eq("user_id", user_id)
            
            if status:
                query = query.eq("status", status)
            
            response = query.order("created_at", desc=True).execute()
            logger.info(f"Fetched {len(response.data)} appliance complaints for user {user_id}")
            return response.data
            
        except Exception as e:
            logger.error(f"Error fetching appliance complaints: {e}")
            return []

    def create_appliance_complaint(
        self,
        user_id: str,
        appliance_type: str,
        description: str,
        image_url: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Create an appliance complaint.
        
        Args:
            user_id: User ID from JWT
            appliance_type: Type of appliance (fan, ac, heater, light, etc.)
            description: Description of issue
            image_url: Optional signed URL to image in Supabase Storage
        
        Returns:
            Created record dict or None if failed
        """
        try:
            data = {
                "user_id": user_id,
                "appliance_type": appliance_type,
                "description": description,
                "image_url": image_url or "",
                "status": "open",
            }
            
            response = self.client.table("appliance_complaint").insert(data).execute()
            logger.info(f"Created appliance complaint: {response.data[0]['id']}")
            return response.data[0] if response.data else None
            
        except Exception as e:
            logger.error(f"Error creating appliance complaint: {e}")
            return None

    def get_store_orders(
        self, user_id: str, status: Optional[str] = None
    ) -> list[dict]:
        """
        Get store orders for a user.
        
        Args:
            user_id: User ID from JWT
            status: Filter by status (pending, confirmed, delivered, cancelled)
        
        Returns:
            List of order dicts
        """
        try:
            query = self.client.table("store_order").select("*").eq("user_id", user_id)
            
            if status:
                query = query.eq("status", status)
            
            response = query.order("created_at", desc=True).execute()
            logger.info(f"Fetched {len(response.data)} store orders for user {user_id}")
            return response.data
            
        except Exception as e:
            logger.error(f"Error fetching store orders: {e}")
            return []

    def create_store_order(
        self,
        user_id: str,
        items: list[dict],
        delivery_preference: str = "hostel_delivery",
    ) -> Optional[dict]:
        """
        Create a store order.
        
        Args:
            user_id: User ID from JWT
            items: List of items [{"name": "...", "quantity": 1, "category": "..."}]
            delivery_preference: "hostel_delivery" or "room_delivery"
        
        Returns:
            Created record dict or None if failed
        """
        try:
            data = {
                "user_id": user_id,
                "items": items,
                "delivery_preference": delivery_preference,
                "status": "pending",
            }
            
            response = self.client.table("store_order").insert(data).execute()
            logger.info(f"Created store order: {response.data[0]['id']}")
            return response.data[0] if response.data else None
            
        except Exception as e:
            logger.error(f"Error creating store order: {e}")
            return None

    def get_medicine_requests(
        self, user_id: str, status: Optional[str] = None
    ) -> list[dict]:
        """
        Get medicine requests for a user.
        
        Args:
            user_id: User ID from JWT
            status: Filter by status (pending, approved, fulfilled, rejected)
        
        Returns:
            List of request dicts
        """
        try:
            query = self.client.table("medicine_request").select("*").eq("user_id", user_id)
            
            if status:
                query = query.eq("status", status)
            
            response = query.order("created_at", desc=True).execute()
            logger.info(f"Fetched {len(response.data)} medicine requests for user {user_id}")
            return response.data
            
        except Exception as e:
            logger.error(f"Error fetching medicine requests: {e}")
            return []

    def create_medicine_request(
        self,
        user_id: str,
        medicine_name: Optional[str] = None,
        prescription_url: Optional[str] = None,
        urgency: str = "normal",
    ) -> Optional[dict]:
        """
        Create a medicine request.
        
        Args:
            user_id: User ID from JWT
            medicine_name: Name of medicine (optional if prescription provided)
            prescription_url: Signed URL to prescription in Supabase Storage
            urgency: "normal", "moderate", or "urgent"
        
        Returns:
            Created record dict or None if failed
        """
        try:
            data = {
                "user_id": user_id,
                "medicine_name": medicine_name or "",
                "prescription_url": prescription_url or "",
                "urgency": urgency,
                "status": "pending",
            }
            
            response = self.client.table("medicine_request").insert(data).execute()
            logger.info(f"Created medicine request: {response.data[0]['id']}")
            return response.data[0] if response.data else None
            
        except Exception as e:
            logger.error(f"Error creating medicine request: {e}")
            return None

    def get_salon_queue(self, hostel_name: str) -> list[dict]:
        """
        Get current salon queue for a hostel.
        
        Args:
            hostel_name: Name of hostel
        
        Returns:
            List of queue entries ordered by position
        """
        try:
            response = (
                self.client.table("salon_queue")
                .select("*")
                .eq("hostel_name", hostel_name)
                .eq("status", "waiting")
                .order("queue_position", asc=True)
                .execute()
            )
            logger.info(f"Fetched {len(response.data)} queue entries for {hostel_name}")
            return response.data
            
        except Exception as e:
            logger.error(f"Error fetching salon queue: {e}")
            return []

    def get_user_queue_position(self, user_id: str, hostel_name: str) -> Optional[int]:
        """
        Get a user's position in salon queue.
        
        Args:
            user_id: User ID from JWT
            hostel_name: Name of hostel
        
        Returns:
            Queue position or None if not in queue
        """
        try:
            response = (
                self.client.table("salon_queue")
                .select("queue_position")
                .eq("user_id", user_id)
                .eq("hostel_name", hostel_name)
                .eq("status", "waiting")
                .execute()
            )
            
            if response.data:
                position = response.data[0]["queue_position"]
                logger.info(f"User {user_id} is at position {position} in {hostel_name}")
                return position
            
            logger.info(f"User {user_id} is not in queue for {hostel_name}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching queue position: {e}")
            return None

    def add_to_salon_queue(
        self, user_id: str, hostel_name: str, service_type: str = "general"
    ) -> Optional[dict]:
        """
        Add user to salon queue.
        
        Args:
            user_id: User ID from JWT
            hostel_name: Name of hostel
            service_type: Type of service (general, haircut, shave, etc.)
        
        Returns:
            Queue entry record or None if already in queue
        """
        try:
            # Check if already in queue
            existing = (
                self.client.table("salon_queue")
                .select("id")
                .eq("user_id", user_id)
                .eq("status", "waiting")
                .execute()
            )
            
            if existing.data:
                logger.info(f"User {user_id} already in queue")
                return None
            
            # Get next queue position
            queue = self.get_salon_queue(hostel_name)
            next_position = len(queue) + 1
            
            data = {
                "user_id": user_id,
                "hostel_name": hostel_name,
                "service_type": service_type,
                "queue_position": next_position,
                "status": "waiting",
            }
            
            response = self.client.table("salon_queue").insert(data).execute()
            logger.info(f"Added user {user_id} to queue at position {next_position}")
            return response.data[0] if response.data else None
            
        except Exception as e:
            logger.error(f"Error adding to queue: {e}")
            return None

    def get_all_user_requests(self, user_id: str) -> dict[str, list]:
        """
        Get all pending/active requests for a user (aggregate view).
        
        Returns:
            Dict with keys: cleaning, appliances, orders, medicine, queue
        """
        return {
            "cleaning": [
                r for r in self.get_cleaning_requests(user_id)
                if r["status"] != "completed"
            ],
            "appliances": [
                r for r in self.get_appliance_complaints(user_id)
                if r["status"] != "resolved"
            ],
            "orders": [
                r for r in self.get_store_orders(user_id)
                if r["status"] not in ["delivered", "cancelled"]
            ],
            "medicine": [
                r for r in self.get_medicine_requests(user_id)
                if r["status"] not in ["fulfilled", "rejected"]
            ],
        }

    def upload_file_to_storage(
        self, bucket: str, path: str, file_data: bytes
    ) -> Optional[str]:
        """
        Upload a file to Supabase Storage (appliance photos, prescriptions, etc.).
        
        Args:
            bucket: Storage bucket name (e.g., "complaint-images", "prescriptions")
            path: File path in bucket (e.g., "user_123/complaint_456.jpg")
            file_data: File binary data
        
        Returns:
            Signed URL (5-min expiry) or None if upload failed
        """
        try:
            response = self.client.storage.from_(bucket).upload(path, file_data)
            logger.info(f"Uploaded file to {bucket}/{path}")
            
            # Get signed URL (5 minutes expiry)
            signed_url = self.client.storage.from_(bucket).create_signed_url(path, 300)
            return signed_url
            
        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            return None

    def get_announcements(self, hostel_name: Optional[str] = None) -> list[dict]:
        """
        Get recent announcements.
        
        Args:
            hostel_name: If provided, filter to hostel-specific announcements
        
        Returns:
            List of announcement dicts
        """
        try:
            query = self.client.table("announcement").select("*")
            
            if hostel_name:
                query = query.eq("hostel_name", hostel_name)
            
            response = query.order("created_at", desc=True).limit(10).execute()
            logger.info(f"Fetched {len(response.data)} announcements")
            return response.data
            
        except Exception as e:
            logger.error(f"Error fetching announcements: {e}")
            return []
