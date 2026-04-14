"""
Training Data Generator for Hostel Voice Assistant.
Generates synthetic utterances and intent-function mappings from API schema.
Produces training datasets for model fine-tuning and testing.
"""

import json
import random
import logging
from typing import List, Dict, Any
from enum import Enum
from datetime import datetime, timedelta

logger = logging.getLogger("training-data-generator")
logger.setLevel(logging.INFO)


# ============================================================================
# UTTERANCE TEMPLATES
# ============================================================================

CLEANING_SERVICE_UTTERANCES = {
    "en": [
        "Book a cleaning service for tomorrow",
        "I need my room cleaned",
        "Schedule a room cleaning for next monday at 2 PM",
        "Can you book a cleaning for my room?",
        "I want to request a cleaning service",
        "Book cleaning for {date} at {time}",
        "My room needs cleaning",
        "Please arrange a cleaning service for {date}",
        "Can you clean my hostel room?",
        "Schedule cleaning for tomorrow morning",
        "I'd like to book a cleaning appointment",
        "Cleaning service for {date} please",
        "Room cleaning request for {date} at {time}",
        "Can I book the cleaning service?",
        "Clean my room on {date}",
    ],
    "hi": [
        "मेरे कमरे की सफाई बुक करो",
        "कल सफाई करवानी है",
        "कमरा साफ करो {date} को",
        "सफाई सेवा बुक करना है",
        "मेरे कमरे में सफाई चाहिए",
        "सफाई के लिए अनुरोध करो",
        "{date} को सफाई की व्यवस्था करो",
        "कल सुबह सफाई हो जाए",
        "मेरे कमरे को साफ करवा दो",
        "सफाई सेवा {date} के लिए",
    ],
}

APPLIANCE_COMPLAINT_UTTERANCES = {
    "en": [
        "Report an appliance issue",
        "The fan in my room is not working",
        "My AC is broken",
        "The light in my room is flickering",
        "There's an electrical issue in my room",
        "The heater is not working properly",
        "Report appliance problem with {appliance}",
        "My {appliance} is broken",
        "{appliance} is not working",
        "I have a problem with my {appliance}",
        "Can you fix the {appliance}?",
        "The {appliance} needs repair",
        "Broken {appliance} in my room",
        "My door lock is not working",
        "Help! The {appliance} is damaged",
    ],
    "hi": [
        "पंखा काम नहीं कर रहा",
        "एसी खराब है",
        "रोशनी में समस्या है",
        "{appliance} टूटा हुआ है",
        "कमरे में {appliance} काम नहीं कर रहा",
        "दरवाजे का ताला खराब है",
        "{appliance} की मरम्मत करो",
        "समस्या रिपोर्ट करो",
        "{appliance} में समस्या है",
        "मेरे कमरे का {appliance} टूटा है",
    ],
}

STORE_ORDER_UTTERANCES = {
    "en": [
        "Place a store order",
        "I want to order a water bottle",
        "Buy me some snacks",
        "Order supplies from the store",
        "Can I order {item} from the store?",
        "I need {item}",
        "Please order {item} for me",
        "Get me {item} from the hostel store",
        "Stock up on {item}",
        "I'd like to purchase {item}",
        "Order these items: {items}",
        "Shopping from hostel store",
        "Can you get me {item}?",
        "I need to buy {item}",
        "Order {item} delivery to my room",
    ],
    "hi": [
        "दुकान से ऑर्डर करो",
        "मुझे {item} चाहिए",
        "दुकान से {item} मंगवा दो",
        "{item} खरीद लाओ",
        "मैं {item} चाहता हूँ",
        "दुकान से {items} मंगवाने हैं",
        "बोतल और साबुन खरीदना है",
        "{item} के लिए ऑर्डर करो",
        "कुछ सप्लाई चाहिए",
    ],
}

MEDICINE_REQUEST_UTTERANCES = {
    "en": [
        "Request medicine",
        "I need medicine",
        "I have a fever",
        "I'm sick and need help",
        "Can I get {medicine}?",
        "I need {medicine} urgently",
        "Request {medicine}",
        "I have a cold",
        "I need cough syrup",
        "Prescription medicine request",
        "I'll upload my prescription",
        "Emergency medicine needed",
        "I'm not feeling well",
        "Can you help with {medicine}?",
        "Medicine for {condition}",
    ],
    "hi": [
        "दवा चाहिए",
        "बुखार है",
        "{medicine} की जरूरत है",
        "बीमार हूँ",
        "दवा मांगनी है",
        "कफ सिरप चाहिए",
        "{medicine} दे दो",
        "सिर दर्द है",
        "जुकाम हो गया",
    ],
}

REQUEST_STATUS_UTTERANCES = {
    "en": [
        "Check my request status",
        "What's the status of my requests?",
        "View my pending requests",
        "Show me all my requests",
        "What requests do I have?",
        "Check cleaning request status",
        "Where's my order?",
        "Has my medicine been processed?",
        "Status of my appliance complaint",
        "All my active requests",
        "What do I have pending?",
        "Show pending requests",
    ],
    "hi": [
        "मेरे अनुरोध की स्थिति",
        "मेरे सभी अनुरोध दिखाओ",
        "क्या स्थिति है?",
        "मेरे पेंडिंग अनुरोध",
        "सभी चल रहे अनुरोध",
    ],
}

SALON_QUEUE_UTTERANCES = {
    "en": [
        "Join the barber queue",
        "I want a haircut",
        "Add me to the salon queue",
        "What's my position in the queue?",
        "I need a shave",
        "Queue for barber",
        "Haircut service",
        "When is my turn?",
        "Check barber queue",
        "I want to join the queue",
        "Barber appointment",
        "Hair cutting queue",
    ],
    "hi": [
        "नाई की कतार में लगा दो",
        "बाल कटवाने हैं",
        "कतार में मेरा नंबर क्या है?",
        "नाई के पास जाना है",
        "कतार में शामिल करो",
        "मेरी बारी कब है?",
    ],
}

NOTIFICATIONS_UTTERANCES = {
    "en": [
        "Get my notifications",
        "What are my notifications?",
        "Show announcements",
        "Any updates for me?",
        "Check my messages",
        "What's new?",
        "Read announcements",
        "What announcements are there?",
        "Any important updates?",
        "Tell me my notifications",
    ],
    "hi": [
        "मेरी सूचनाएं दिखाओ",
        "कोई अपडेट है?",
        "घोषणाएं क्या हैं?",
        "क्या नया है?",
        "मेरे लिए संदेश",
    ],
}


# ============================================================================
# ENUMS AND VARIABLES FOR SUBSTITUTION
# ============================================================================

DATES = [
    "tomorrow",
    "next monday",
    "next week",
    "in 2 days",
    "on friday",
    "this weekend",
    "next month",
]

TIMES = [
    "morning",
    "afternoon",
    "evening",
    "2 PM",
    "3 PM",
    "after 5 PM",
    "early morning",
]

APPLIANCES = [
    "fan",
    "AC",
    "heater",
    "light",
    "electrical outlet",
    "door lock",
    "window",
    "bed",
]

ITEMS = [
    "water bottle",
    "towel",
    "soap",
    "shampoo",
    "toothbrush",
    "snacks",
    "magazine",
    "notebook",
    "pen",
    "charger",
]

MEDICINES = [
    "paracetamol",
    "cough syrup",
    "antibiotic",
    "cold medicine",
    "headache tablet",
    "bandage",
    "ointment",
]


# ============================================================================
# TRAINING DATA GENERATION
# ============================================================================

class TrainingDataGenerator:
    """Generates synthetic training data for hostel voice assistant."""
    
    def __init__(self, output_dir: str = "./training_data"):
        """
        Initialize generator.
        
        Args:
            output_dir: Directory to save generated training data
        """
        self.output_dir = output_dir
        import os
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_utterances(self, templates: Dict[str, List[str]], count_per_lang: int = 50) -> List[Dict[str, Any]]:
        """
        Generate utterances from templates with variable substitution.
        
        Args:
            templates: Dict with language keys and utterance template lists
            count_per_lang: Number of utterances to generate per language
        
        Returns:
            List of training data dicts with text, intent, language fields
        """
        training_data = []
        
        for language, template_list in templates.items():
            for _ in range(count_per_lang):
                template = random.choice(template_list)
                
                # Substitute placeholders
                utterance = template
                if "{date}" in template:
                    utterance = utterance.replace("{date}", random.choice(DATES))
                if "{time}" in template:
                    utterance = utterance.replace("{time}", random.choice(TIMES))
                if "{appliance}" in template:
                    utterance = utterance.replace("{appliance}", random.choice(APPLIANCES))
                if "{item}" in template:
                    utterance = utterance.replace("{item}", random.choice(ITEMS))
                if "{items}" in template:
                    utterance = utterance.replace("{items}", ", ".join(random.sample(ITEMS, k=random.randint(2, 4))))
                if "{medicine}" in template:
                    utterance = utterance.replace("{medicine}", random.choice(MEDICINES))
                if "{condition}" in template:
                    conditions = ["headache", "fever", "cold", "cough", "stomach pain"]
                    utterance = utterance.replace("{condition}", random.choice(conditions))
                
                training_data.append({
                    "text": utterance,
                    "language": language,
                })
        
        return training_data
    
    def generate_intent_dataset(self) -> List[Dict[str, Any]]:
        """
        Generate complete training dataset with intents and functions.
        
        Returns:
            List of training data with intent-to-function mappings
        """
        dataset = []
        
        # Student intents
        student_intents = {
            "booking_cleaning_service": CLEANING_SERVICE_UTTERANCES,
            "reporting_appliance_issue": APPLIANCE_COMPLAINT_UTTERANCES,
            "placing_store_order": STORE_ORDER_UTTERANCES,
            "requesting_medicine": MEDICINE_REQUEST_UTTERANCES,
            "viewing_request_status": REQUEST_STATUS_UTTERANCES,
            "joining_salon_queue": SALON_QUEUE_UTTERANCES,
            "getting_notifications": NOTIFICATIONS_UTTERANCES,
        }
        
        for intent, utterances in student_intents.items():
            training_samples = self.generate_utterances(utterances, count_per_lang=30)
            for sample in training_samples:
                sample["intent"] = intent
                sample["function"] = intent.replace("_", "")  # Function name
                sample["role"] = "student"
                dataset.append(sample)
        
        logger.info(f"Generated {len(dataset)} training samples for student intents")
        return dataset
    
    def save_training_data(self, filename: str = "training_data.json"):
        """
        Generate and save training dataset to JSON file.
        
        Args:
            filename: Output file name
        """
        dataset = self.generate_intent_dataset()
        
        filepath = f"{self.output_dir}/{filename}"
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Saved {len(dataset)} training samples to {filepath}")
        return filepath
    
    def generate_conversation_scenarios(self, count: int = 50) -> List[Dict[str, Any]]:
        """
        Generate realistic multi-turn conversation scenarios.
        
        Args:
            count: Number of scenarios to generate
        
        Returns:
            List of conversation scenario dicts
        """
        scenarios = []
        
        for _ in range(count):
            # Student cleaning booking scenario
            scenario = {
                "scenario_type": "cleaning_booking",
                "language": random.choice(["en", "hi"]),
                "turns": [
                    {
                        "speaker": "user",
                        "text": random.choice(CLEANING_SERVICE_UTTERANCES.get(
                            random.choice(["en", "hi"]), CLEANING_SERVICE_UTTERANCES["en"]
                        )),
                    },
                    {
                        "speaker": "assistant",
                        "text": "Sure! I can help you book a cleaning service. When would you like the cleaning done?",
                    },
                    {
                        "speaker": "user",
                        "text": f"Tomorrow at {random.choice(TIMES)}",
                    },
                    {
                        "speaker": "assistant",
                        "text": "Perfect! Your cleaning is booked for tomorrow. Any special requests?",
                    },
                    {
                        "speaker": "user",
                        "text": "No, just the standard cleaning. Thank you!",
                    },
                    {
                        "speaker": "assistant",
                        "text": "✓ Booking confirmed! Your cleaning is scheduled.",
                    },
                ],
            }
            scenarios.append(scenario)
        
        logger.info(f"Generated {len(scenarios)} conversation scenarios")
        return scenarios
    
    def save_conversation_scenarios(self, filename: str = "conversation_scenarios.json"):
        """
        Save conversation scenarios to JSON file.
        
        Args:
            filename: Output file name
        """
        scenarios = self.generate_conversation_scenarios(count=50)
        
        filepath = f"{self.output_dir}/{filename}"
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(scenarios, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Saved {len(scenarios)} conversation scenarios to {filepath}")
        return filepath
    
    def generate_test_cases(self) -> List[Dict[str, Any]]:
        """
        Generate test cases for validation.
        
        Returns:
            List of test case dicts
        """
        test_cases = [
            # Happy path cases
            {
                "intent": "booking_cleaning_service",
                "utterance": "Book a cleaning service for tomorrow",
                "expected_function": "book_cleaning_service",
                "expected_params": {"date": "tomorrow"},
                "language": "en",
            },
            {
                "intent": "reporting_appliance_issue",
                "utterance": "The fan is not working",
                "expected_function": "report_appliance_issue",
                "expected_params": {"appliance_type": "fan"},
                "language": "en",
            },
            {
                "intent": "placing_store_order",
                "utterance": "Order a water bottle from the store",
                "expected_function": "place_store_order",
                "expected_params": {"items": ["water bottle"]},
                "language": "en",
            },
            # Hindi cases
            {
                "intent": "booking_cleaning_service",
                "utterance": "कल सफाई करवानी है",
                "expected_function": "book_cleaning_service",
                "expected_params": {"date": "tomorrow"},
                "language": "hi",
            },
            {
                "intent": "requesting_medicine",
                "utterance": "बुखार है, दवा चाहिए",
                "expected_function": "request_medicine",
                "expected_params": {"urgency": "moderate"},
                "language": "hi",
            },
            # Edge cases
            {
                "intent": "joining_salon_queue",
                "utterance": "What's my position in the barber queue?",
                "expected_function": "get_queue_status",
                "expected_params": {},
                "language": "en",
            },
            {
                "intent": "viewing_request_status",
                "utterance": "Show me all my pending requests",
                "expected_function": "view_my_requests",
                "expected_params": {},
                "language": "en",
            },
        ]
        
        return test_cases
    
    def save_test_cases(self, filename: str = "test_cases.json"):
        """
        Save test cases to JSON file.
        
        Args:
            filename: Output file name
        """
        test_cases = self.generate_test_cases()
        
        filepath = f"{self.output_dir}/{filename}"
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(test_cases, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Saved {len(test_cases)} test cases to {filepath}")
        return filepath
    
    def generate_all(self):
        """Generate and save all training datasets."""
        logger.info("Starting training data generation...")
        
        self.save_training_data()
        self.save_conversation_scenarios()
        self.save_test_cases()
        
        logger.info("Training data generation complete!")
        logger.info(f"Output directory: {self.output_dir}")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import sys
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Generate training data
    output_dir = sys.argv[1] if len(sys.argv) > 1 else "./training_data"
    generator = TrainingDataGenerator(output_dir=output_dir)
    generator.generate_all()
    
    # Print summary
    print(f"\n✓ Training data generated successfully!")
    print(f"  Output directory: {output_dir}")
    print(f"\nGenerated files:")
    print(f"  • training_data.json - Intent classification training data")
    print(f"  • conversation_scenarios.json - Multi-turn conversation examples")
    print(f"  • test_cases.json - Test cases for validation")
