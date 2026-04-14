# Voice Assistant AI Implementation TODO

This guide outlines the steps to implement and integrate the Multi-Role Hostel Voice Assistant into the Hostel Hub project.

## 🛠 Prerequisites & Credentials
Use the following keys extracted from `Doc1.docx` for your configuration:

### LiveKit Configuration
- **LIVEKIT_URL**: `wss://aiassistanthostelhub-ft8vki8c.livekit.cloud`
- **LIVEKIT_API_KEY**: `API8mJeQjPPNXDs`
- **LIVEKIT_API_SECRET**: `yeDDoYBOqyHYJ0uHC6c2bXVG4aeKil0E1fGw5zp7xeQA`

### OpenAI Configuration
- **OPENAI_API_KEY**: `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`

### ElevenLabs Configuration
- **ELEVEN_API_KEY**: `sk_7e4018a605b8512f5d418cda2d7189e8923d333711726807`
- **ELEVEN_MALE_VOICE_ID**: `3q1O5DQXIrVQuDoV5F1K`
- **ELEVEN_FEMALE_VOICE_ID**: `o6qTxWUeRyzRYZyUNDVJ`

### Supabase Configuration
- **SUPABASE_URL**: `https://zvbhaehxojklmzylpjri.supabase.co`
- **SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2YmhhZWh4b2prbG16eWxwanJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTUyNjUsImV4cCI6MjA4ODM5MTI2NX0.D0yYFJe3e4qdnVgYZ9ouUxuBncNLukH_WahrKW1FFrU`
- **SUPABASE_SERVICE_ROLE_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2YmhhZWh4b2prbG16eWxwanJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxNTI2NSwiZXhwIjoyMDg4MzkxMjY1fQ.0xrOHuy_ldfhwr9MIPoBPz7EcEBx2D8lZ82vu0N2nUo`

---

## 📋 Implementation Steps

### Phase 1: Backend Setup (Python)
Navigate to `AI_Model_Creating_and_Traning/Ai1`.

1.  **Create `.env` file**:
    - Copy the keys above into a new `.env` file in the `Ai1` directory.
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    pip install livekit-plugins-elevenlabs elevenlabs fastapi uvicorn
    ```
3.  **Run Voice Agent Server**:
    ```bash
    python -m livekit.agents run main.py
    ```
4.  **Run FastAPI Backend**:
    ```bash
    python voice_api.py
    ```
    *This server will handle JWT verification and LiveKit token generation.*

### Phase 2: Supabase Integration
Ensure all required tables are present. The project already contains migrations for:
- `cleaning_requests`
- `appliance_complaints`
- `store_orders`
- `medicine_requests`
- `salon_queue`
- `laundry_orders`

Verify RLS policies in Supabase dashboard to allow the Voice Assistant (using the service role key) to perform CRUD operations.

### Phase 3: Frontend Integration (React/Vite)
Since the project is a React application, you need to adapt the provided Flutter logic.

1.  **Install LiveKit React SDK**:
    ```bash
    npm install @livekit/components-react livekit-client
    ```
2.  **Create Voice Assistant Component**:
    - Create `src/components/chat/VoiceAssistant.tsx`.
    - Implement a connection logic that:
        1. Calls your FastAPI backend (`/api/voice/generate-token`) to get a LiveKit token.
        2. Uses `LiveKitRoom` and `AudioConference` from `@livekit/components-react`.
3.  **Update UI**:
    - Add a floating action button or a dedicated section in the `StudentDashboard` to trigger the Voice Assistant.

### Phase 4: Training & Refinement
1.  **Generate Synthetic Training Data**:
    ```bash
    python training_data_generator.py ./training_data
    ```
2.  **Test Voice Commands**:
    - Test booking a cleaning service: *"Book a cleaning for tomorrow morning"*
    - Test reporting an issue: *"The fan in my room isn't working"*
    - Test ordering items: *"I want to order a water bottle"*

---

## 📁 Key Files to Reference
- `AI_Model_Creating_and_Traning/Ai1/main.py`: Core logic for the voice agent.
- `AI_Model_Creating_and_Traning/Ai1/hostel_services.py`: LLM callable functions for hostel tasks.
- `AI_Model_Creating_and_Traning/Ai1/voice_api.py`: FastAPI server for token handling.
- `AI_Model_Creating_and_Traning/Ai1/elevenlabs_voice_implementation_plan.md`: Details for ElevenLabs modular voice integration.
