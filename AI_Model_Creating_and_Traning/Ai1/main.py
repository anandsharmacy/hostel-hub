import asyncio
import logging
import json
from typing import Optional

from dotenv import load_dotenv

import os
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm, voice
from livekit.plugins import openai, elevenlabs

# Import hostel-specific modules
from supabase_client import HostelSupabaseClient
from hostel_services import HostelServicesFunctions, UserRole
from hindi_support import translate_system_prompt, Language, get_friendly_greeting

logger = logging.getLogger("hostel-voice-assistant")
logger.setLevel(logging.INFO)

load_dotenv()

ALLOWED_VOICE_GENDERS = {"male", "female"}


def extract_user_context(room_metadata: Optional[str]) -> tuple[str, UserRole, Language, str, Optional[str]]:
    """
    Extract user ID, role, and language preference from room metadata.
    Room metadata should contain JWT token with user claims.
    
    Args:
        room_metadata: Room metadata containing user context
    
    Returns:
        Tuple of (user_id, user_role, language, voice_gender, supabase_jwt)
    """
    try:
        if not room_metadata:
            logger.warning("No room metadata provided, using defaults")
            return "anonymous", UserRole.STUDENT, Language.ENGLISH, "female", None
        
        # Parse metadata (assuming it's JSON with user claims)
        metadata = json.loads(room_metadata) if isinstance(room_metadata, str) else room_metadata
        
        if not isinstance(metadata, dict):
            raise ValueError("Invalid room metadata payload")

        user_id = str(metadata.get("user_id", "anonymous")).strip() or "anonymous"
        role_str = metadata.get("user_role", "student").lower()
        language_str = metadata.get("language", "en").lower()
        voice_gender = metadata.get("voice_gender", "female").lower()
        supabase_jwt = metadata.get("supabase_jwt")

        if voice_gender not in ALLOWED_VOICE_GENDERS:
            voice_gender = "female"
        
        # Map role string to enum
        try:
            user_role = UserRole[role_str.upper()]
        except KeyError:
            user_role = UserRole.STUDENT
        
        # Map language string to enum
        try:
            language = Language[language_str.upper()]
        except KeyError:
            language = Language.ENGLISH
        
        logger.info(
            f"Extracted user context: user_id={user_id}, role={user_role.value}, language={language.value}, voice_gender={voice_gender}"
        )
        return user_id, user_role, language, voice_gender, supabase_jwt
        
    except Exception as e:
        logger.error(f"Error extracting user context: {e}")
        return "anonymous", UserRole.STUDENT, Language.ENGLISH, "female", None


async def entrypoint(ctx: JobContext):
    """
    Main entry point for hostel voice assistant LiveKit session.
    Establishes agent with room metadata, handles user context, and manages session lifecycle.
    """
    try:
        # Connect to the room and receive participant audio.
        await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)
        participant = await ctx.wait_for_participant()

        # Extract user context from room metadata
        user_id, user_role, language, voice_gender, supabase_jwt = extract_user_context(ctx.room.metadata)
        
        logger.info(f"Starting voice session for {user_role.value} (user_id={user_id}) in language {language.value} with {voice_gender} voice")
        
        # Initialize Supabase client with user context
        try:
            db_client = HostelSupabaseClient(jwt_token=supabase_jwt, service_role=False)
        except ValueError as e:
            logger.error(f"Supabase initialization failed: {e}")
            db_client = None
        
        # Initialize hostel services with user context
        services = HostelServicesFunctions(
            supabase_client=db_client,
            user_id=user_id,
            user_role=user_role,
        )
        
        # Get system prompt in user's language
        system_prompt = translate_system_prompt(language)
        
        # Add greeting
        greeting = get_friendly_greeting(language, user_id.split("-")[0] if user_id != "anonymous" else None)
        full_prompt = f"{system_prompt}\n\nGreeting: {greeting}"
        
        # Initialize Voice Agent with ElevenLabs TTS
        voice_id = os.getenv("ELEVEN_MALE_VOICE_ID") if voice_gender == "male" else os.getenv("ELEVEN_FEMALE_VOICE_ID")
        tts = elevenlabs.TTS(api_key=os.getenv("ELEVEN_API_KEY"), voice_id=voice_id)

        # Initialize LLM with Gemini via OpenAI-compatible endpoint
        gemini_llm = openai.LLM(
            model="gemini-2.0-flash",
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=os.getenv("GEMINI_API_KEY")
        )

        # Initialize Voice Agent
        agent = voice.Agent(
            stt=openai.STT(),
            llm=gemini_llm,
            tts=tts,
            instructions=full_prompt,
            tools=[services],
        )

        # Start the agent against the connected participant.
        agent.start(ctx.room, participant)
        
        logger.info(f"Agent session started successfully for room {ctx.room.name}")

        # Keep the worker alive for the session lifecycle.
        await asyncio.Event().wait()

    except Exception as e:
        logger.error(f"Error in entrypoint: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )