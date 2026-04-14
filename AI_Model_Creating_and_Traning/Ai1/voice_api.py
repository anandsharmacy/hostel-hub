"""
FastAPI Backend Service for Hostel Voice Assistant
Handles LiveKit token generation, JWT verification, and voice session management.
"""

from fastapi import FastAPI, Depends, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import jwt
import logging
from datetime import datetime
from urllib.parse import urlparse
from livekit import api
from livekit.api import AccessToken

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

logger = logging.getLogger("voice-api")
logger.setLevel(logging.INFO)

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

ALLOWED_LANGUAGES = {"en", "hi"}
ALLOWED_VOICE_GENDERS = {"male", "female"}
ALLOWED_USER_ROLES = {"student", "admin", "vendor", "super_user", "barber", "laundry"}
MAX_ROOM_NAME_LENGTH = 120

if not all([LIVEKIT_API_KEY, LIVEKIT_API_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY]):
    raise ValueError("Missing required environment variables")

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def _extract_project_ref_from_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    try:
        host = (urlparse(url).hostname or "").strip()
        if not host:
            return None
        # Supabase host pattern: <project_ref>.supabase.co
        return host.split(".", 1)[0] or None
    except Exception:
        return None

# ============================================================================
# MODELS
# ============================================================================


class TokenRequest(BaseModel):
    """Request for LiveKit token generation."""
    room_name: str
    language: str = "en"
    voice_gender: str = "female"  # Default to female voice


class TokenResponse(BaseModel):
    """Response with LiveKit token."""
    token: str
    url: str
    room_name: str


class UserContext(BaseModel):
    """Extracted user context from JWT."""
    user_id: str
    user_role: str
    email: str
    access_token: Optional[str] = None


# ============================================================================
# JWT & SUPABASE VERIFICATION
# ============================================================================


def verify_supabase_jwt(authorization: str) -> dict:
    """
    Verify Supabase JWT token and extract user claims.
    
    Args:
        authorization: Authorization header value (Bearer <token>)
    
    Returns:
        Decoded JWT payload
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid authorization header",
            )
        
        token = authorization.split(" ", 1)[1].strip()
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing bearer token",
            )

        # For Supabase projects using JWT signing keys, local HS256 verification may fail.
        # Validate token against Supabase Auth API, then enrich claims from unverified payload.
        user_resp = supabase.auth.get_user(token)
        if user_resp is None or user_resp.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token verification failed",
            )

        decoded = jwt.decode(
            token,
            options={
                "verify_signature": False,
                "verify_exp": False,
                "verify_aud": False,
                "verify_iss": False,
            },
        )

        user = user_resp.user
        if isinstance(decoded, dict):
            decoded.setdefault("sub", user.id)
            if getattr(user, "email", None):
                decoded.setdefault("email", user.email)
            if getattr(user, "app_metadata", None):
                decoded.setdefault("app_metadata", user.app_metadata or {})
            if getattr(user, "user_metadata", None):
                decoded.setdefault("user_metadata", user.user_metadata or {})

        expected_ref = _extract_project_ref_from_url(SUPABASE_URL)
        issuer = decoded.get("iss") if isinstance(decoded, dict) else None
        token_ref = _extract_project_ref_from_url(issuer)
        if expected_ref and token_ref and expected_ref != token_ref:
            logger.warning(
                "JWT project mismatch detected (token project != configured project): token_ref=%s expected_ref=%s",
                token_ref,
                expected_ref,
            )

        logger.info(f"JWT verified for user {decoded.get('sub')}")
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"JWT invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed",
        )


def get_auth_token_diagnostics(authorization: str) -> dict:
    """Return safe auth diagnostics to debug Invalid JWT issues quickly."""
    if not authorization or not authorization.startswith("Bearer "):
        return {
            "authorization_header_valid": False,
            "reason": "Missing or malformed Authorization header",
        }

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return {
            "authorization_header_valid": False,
            "reason": "Missing bearer token",
        }

    diagnostics = {
        "authorization_header_valid": True,
        "token_present": True,
        "token_length": len(token),
        "configured_project_ref": _extract_project_ref_from_url(SUPABASE_URL),
        "configured_auth_issuer": f"{SUPABASE_URL}/auth/v1" if SUPABASE_URL else None,
        "supabase_jwt_secret_configured": bool(SUPABASE_JWT_SECRET),
    }

    try:
        decoded = jwt.decode(
            token,
            options={
                "verify_signature": False,
                "verify_exp": False,
                "verify_aud": False,
                "verify_iss": False,
            },
        )
        iss = decoded.get("iss") if isinstance(decoded, dict) else None
        aud = decoded.get("aud") if isinstance(decoded, dict) else None
        sub = decoded.get("sub") if isinstance(decoded, dict) else None
        exp = decoded.get("exp") if isinstance(decoded, dict) else None

        diagnostics.update(
            {
                "token_issuer": iss,
                "token_audience": aud,
                "token_user_id": sub,
                "token_exp": exp,
                "token_project_ref": _extract_project_ref_from_url(iss),
            }
        )
        diagnostics["project_ref_matches"] = (
            diagnostics["configured_project_ref"] == diagnostics["token_project_ref"]
            if diagnostics["configured_project_ref"] and diagnostics["token_project_ref"]
            else None
        )
    except Exception as e:
        diagnostics["token_decode_error"] = str(e)

    return diagnostics


def extract_user_context(jwt_payload: dict) -> UserContext:
    """
    Extract user context from JWT payload.
    
    Args:
        jwt_payload: Decoded JWT claims
    
    Returns:
        UserContext with user details
    """
    user_id = jwt_payload.get("sub", "anonymous")
    email = jwt_payload.get("email", "")
    
    # Get user role from JWT custom claims
    # (Supabase allows custom claims via app_metadata)
    app_metadata = jwt_payload.get("app_metadata", {})
    user_metadata = jwt_payload.get("user_metadata", {})
    user_role = (app_metadata.get("user_role") or user_metadata.get("user_role") or "student").lower()
    if user_role not in ALLOWED_USER_ROLES:
        user_role = "student"
    
    return UserContext(
        user_id=user_id,
        user_role=user_role,
        email=email,
    )


def normalize_language(language: str) -> str:
    normalized = (language or "en").lower().strip()
    return normalized if normalized in ALLOWED_LANGUAGES else "en"


def normalize_voice_gender(voice_gender: str) -> str:
    normalized = (voice_gender or "female").lower().strip()
    return normalized if normalized in ALLOWED_VOICE_GENDERS else "female"


def validate_room_name(room_name: str) -> str:
    value = (room_name or "").strip()
    if not value:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="room_name is required",
        )
    if len(value) > MAX_ROOM_NAME_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="room_name is too long",
        )
    safe_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_")
    if any(ch not in safe_chars for ch in value):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="room_name contains unsupported characters",
        )
    return value


def get_current_user_context(authorization: str = Header(..., alias="Authorization")) -> UserContext:
    token = authorization.split(" ", 1)[1].strip()
    jwt_payload = verify_supabase_jwt(authorization)
    user_context = extract_user_context(jwt_payload)
    user_context.access_token = token
    return user_context


# ============================================================================
# LIVEKIT TOKEN GENERATION
# ============================================================================


def generate_livekit_token(
    user_id: str,
    user_role: str,
    room_name: str,
    language: str = "en",
    voice_gender: str = "female",
    supabase_jwt: Optional[str] = None,
) -> str:
    """
    Generate LiveKit access token with user context in metadata.
    
    Args:
        user_id: User ID from Supabase
        user_role: User's role (student, admin, vendor, etc.)
        room_name: LiveKit room name
        language: Language preference (en or hi)
        voice_gender: Voice gender preference (male or female)
    
    Returns:
        Signed LiveKit token
    """
    try:
        # Create access token
        at = AccessToken(
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
        )
        
        # Set token claims
        at.identity = user_id
        at.name = user_id  # Can be customized with user's name
        
        # Add metadata (accessible by voice agent via room.metadata)
        import json
        normalized_language = normalize_language(language)
        normalized_voice_gender = normalize_voice_gender(voice_gender)
        safe_room_name = validate_room_name(room_name)
        metadata = {
            "user_id": user_id,
            "user_role": user_role,
            "language": normalized_language,
            "voice_gender": normalized_voice_gender,
            "issued_at": datetime.utcnow().isoformat() + "Z",
        }
        if supabase_jwt:
            metadata["supabase_jwt"] = supabase_jwt
        at.metadata = json.dumps(metadata)
        at.add_grant(
            api.VideoGrant(
                room_join=True,
                room=safe_room_name,
                can_publish=True,
                can_publish_data=True,
                can_subscribe=True,
            )
        )

        token = at.to_jwt()
        logger.info(f"Generated token for user {user_id} in room {room_name}")
        
        return token
        
    except Exception as e:
        logger.error(f"Token generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate token",
        )


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Hostel Voice Assistant API",
    description="Backend API for LiveKit voice agent integration",
    version="1.0.0",
)

# Add CORS middleware (allow requests from Flutter app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


import httpx
from fastapi.responses import StreamingResponse
import json

# Add these constants
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
GEMINI_MODEL = "gemini-2.0-flash"

class ChatRequest(BaseModel):
    messages: list[dict]

# Reuse the existing verify_supabase_jwt logic for chat as well
@app.post("/api/chat")
async def chat_endpoint(
    request: ChatRequest,
    user_context: UserContext = Depends(get_current_user_context),
):
    """
    Local implementation of the Chat Assistant using Gemini.
    """
    try:
        # Construct the system prompt (simpler version for now, could be enhanced)
        system_prompt = f"You are a helpful AI assistant for the NMIMS Hostel Management Portal. The user is a {user_context.user_role} with ID {user_context.user_id}. Be concise and friendly."
        
        payload = {
            "model": GEMINI_MODEL,
            "messages": [{"role": "system", "content": system_prompt}] + request.messages,
            "stream": True,
        }

        async def generate():
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    GEMINI_OPENAI_URL,
                    headers={
                        "Authorization": f"Bearer {GEMINI_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=60.0,
                ) as response:
                    if response.status_code == 429:
                        yield f"data: {json.dumps({'choices': [{'delta': {'content': 'The AI is currently busy. Please wait a moment.'}}]})}\n\n"
                        return
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            yield line + "\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "livekit_url": LIVEKIT_URL,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/voice/generate-token", response_model=TokenResponse)
async def generate_voice_token(
    request: TokenRequest,
    user_context: UserContext = Depends(get_current_user_context),
) -> TokenResponse:
    """
    Generate LiveKit token for voice session.
    
    Args:
        request: Token request with room_name and language
        authorization: Authorization header (JWT from Supabase)
    
    Returns:
        TokenResponse with LiveKit token and connection URL
    """
    try:
        # Generate LiveKit token
        token = generate_livekit_token(
            user_id=user_context.user_id,
            user_role=user_context.user_role,
            room_name=request.room_name,
            language=request.language,
            voice_gender=request.voice_gender,
            supabase_jwt=user_context.access_token,
        )
        
        # Return token and connection details
        return TokenResponse(
            token=token,
            url=LIVEKIT_URL,
            room_name=request.room_name,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate token",
        )


@app.get("/api/voice/user-info")
async def get_user_info(user_context: UserContext = Depends(get_current_user_context)) -> dict:
    """
    Get current user info from JWT.
    
    Args:
        authorization: Authorization header
    
    Returns:
        User information
    """
    try:
        return {
            "user_id": user_context.user_id,
            "user_role": user_context.user_role,
            "email": user_context.email,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user info",
        )


@app.post("/api/voice/start-session")
async def start_voice_session(
    request: TokenRequest,
    user_context: UserContext = Depends(get_current_user_context),
) -> dict:
    """
    Start a new voice session.
    Initializes LiveKit room and returns connection details.
    
    Args:
        request: Token request
        authorization: Authorization header
    
    Returns:
        Session details with token and room info
    """
    try:
        # Generate unique room name (format: voice_<user_id>_<timestamp>)
        import time
        room_name = f"voice_{user_context.user_id}_{int(time.time())}"
        
        # Generate token for this specific room
        token = generate_livekit_token(
            user_id=user_context.user_id,
            user_role=user_context.user_role,
            room_name=room_name,
            language=request.language,
            voice_gender=request.voice_gender,
            supabase_jwt=user_context.access_token,
        )
        
        logger.info(f"Started voice session for {user_context.user_id}")
        
        return {
            "success": True,
            "token": token,
            "url": LIVEKIT_URL,
            "room_name": room_name,
            "user_id": user_context.user_id,
            "user_role": user_context.user_role,
            "language": request.language,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start session",
        )


@app.post("/api/voice/end-session")
async def end_voice_session(
    room_name: str,
    user_context: UserContext = Depends(get_current_user_context),
) -> dict:
    """
    End a voice session and clean up room.
    
    Args:
        room_name: Name of the room to close
        authorization: Authorization header
    
    Returns:
        Confirmation message
    """
    try:
        # Delete the room (disconnect all participants)
        # Note: Requires LiveKit server API access
        validated_room_name = validate_room_name(room_name)
        logger.info(f"Ended voice session for room {validated_room_name} by {user_context.user_id}")
        
        return {
            "success": True,
            "message": f"Session {room_name} ended",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to end session",
        )


@app.get("/api/voice/auth-debug")
async def auth_debug(
    authorization: str = Header(..., alias="Authorization"),
) -> dict:
    """Debug endpoint to validate incoming Supabase JWT and expose safe diagnostics."""
    diagnostics = get_auth_token_diagnostics(authorization)

    try:
        user_payload = verify_supabase_jwt(authorization)
        return {
            "success": True,
            "diagnostics": diagnostics,
            "verified_user_id": user_payload.get("sub"),
            "verified_email": user_payload.get("email"),
        }
    except HTTPException as e:
        return {
            "success": False,
            "status_code": e.status_code,
            "error": e.detail,
            "diagnostics": diagnostics,
        }


@app.get("/api/voice/rooms")
async def list_active_rooms(user_context: UserContext = Depends(get_current_user_context)) -> dict:
    """
    List all active voice rooms (admin only).
    
    Args:
        authorization: Authorization header
    
    Returns:
        List of active rooms
    """
    try:
        # Check if user is admin
        if user_context.user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can view all rooms",
            )
        
        # Get room list from LiveKit
        # This would require LiveKit SDK API call
        logger.info(f"Admin {user_context.user_id} requested room list")
        
        return {
            "success": True,
            "rooms": [],  # Would be populated from LiveKit API
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing rooms: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list rooms",
        )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )
