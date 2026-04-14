"""
Hindi/English Multilingual Support for Hostel Voice Assistant.
Handles language detection, translation, and command mapping.
"""

import logging
from enum import Enum
from typing import Optional, Tuple

logger = logging.getLogger("hindi-support")
logger.setLevel(logging.INFO)


class Language(Enum):
    """Supported languages."""
    ENGLISH = "en"
    HINDI = "hi"


COMMAND_MAPPINGS = {
    "book_cleaning_service": {
        "en": ["book cleaning", "schedule cleaning", "clean my room"],
        "hi": ["सफाई बुक करो", "सफाई बुक करें", "कमरा साफ करवाना है"],
    },
    "report_appliance_issue": {
        "en": ["report appliance", "broken", "not working", "fan broken"],
        "hi": ["समस्या रिपोर्ट करो", "खराब है", "पंखा टूटा है"],
    },
    "place_store_order": {
        "en": ["order from store", "buy items", "place order"],
        "hi": ["दुकान से ऑर्डर करो", "खरीदना है", "खरीदारी करो"],
    },
    "request_medicine": {
        "en": ["request medicine", "need medicine", "sick", "fever"],
        "hi": ["दवा चाहिए", "दवा मांगो", "बीमार हूँ", "बुखार है"],
    },
    "view_my_requests": {
        "en": ["check status", "view requests", "my requests"],
        "hi": ["मेरे अनुरोध देखो", "स्थिति देखो", "लंबित है"],
    },
    "join_salon_queue": {
        "en": ["join barber queue", "haircut", "barber"],
        "hi": ["नाई की कतार में शामिल हो", "बाल काटवाने हैं"],
    },
    "get_notifications_summary": {
        "en": ["notifications", "announcements", "what's new"],
        "hi": ["सूचनाएं", "घोषणाएं", "क्या नया है"],
    },
}


def detect_language(text: str) -> Language:
    """Detect language from input text."""
    devanagari_range = range(0x0900, 0x097F)
    has_devanagari = any(ord(char) in devanagari_range for char in text)
    
    if has_devanagari:
        return Language.HINDI
    
    return Language.ENGLISH


def translate_system_prompt(language: Language) -> str:
    """Get system prompt in the specified language."""
    prompts = {
        Language.ENGLISH: "You are a helpful hostel voice assistant. Help students book cleaning, report issues, order from store, request medicine, check queue status, and view requests with role-based access control.",
        Language.HINDI: "आप एक सहायक कॉलेज हॉस्टल वॉयस सहायक हैं। कृपया छात्रों को सफाई बुकिंग, समस्या रिपोर्टिंग, दुकान ऑर्डर, दवा अनुरोध, कतार स्थिति जांचने में सहायता करें।",
    }
    
    return prompts.get(language, prompts[Language.ENGLISH])


def normalize_voice_input(text: str, language: Language) -> Tuple[Optional[str], Language]:
    """Normalize voice input to identify the intended command."""
    text_lower = text.lower().strip()
    
    for command, patterns in COMMAND_MAPPINGS.items():
        patterns_list = patterns.get(language.value, [])
        if any(phrase in text_lower for phrase in patterns_list):
            logger.info(f"Matched command '{command}'")
            return command, language
    
    logger.warning(f"Could not match command for: {text}")
    return None, language


def get_friendly_greeting(language: Language) -> str:
    """Get a friendly greeting."""
    greetings = {
        Language.ENGLISH: "Hello! How can I help you today?",
        Language.HINDI: "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?",
    }
    
    return greetings.get(language, greetings[Language.ENGLISH])
