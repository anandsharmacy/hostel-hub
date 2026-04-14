# ElevenLabs Voice Implementation Plan

This document outlines the steps to implement modular voice selection (Male/Female) using **ElevenLabs TTS** for the Hostel Voice Assistant.

## Overview
Currently, the assistant uses `openai.realtime.RealtimeModel` with `MultimodalAgent`, which provides an end-to-end (STT + LLM + TTS) solution. To use ElevenLabs for the voice output while keeping OpenAI for the intelligence, we will transition to the LiveKit `VoiceAgent` architecture.

---

## 1. Prerequisites
- **ElevenLabs API Key**: Obtain from your ElevenLabs dashboard.
- **Voice IDs**:
  - **Male Voice ID**: (e.g., `pNInz6obpgmqSxcYvX7U` for 'Adam')
  - **Female Voice ID**: (e.g., `21m00Tcm4TlvDq8ikWAM` for 'Rachel')

---

## 2. Infrastructure Changes

### Update Environment Variables
Add the following to your `.env` file:
```bash
ELEVEN_API_KEY="your_api_key_here"
ELEVEN_MALE_VOICE_ID="your_male_voice_id"
ELEVEN_FEMALE_VOICE_ID="your_female_voice_id"
```

### Install Dependencies
Uncomment and install the ElevenLabs plugin in `requirements.txt`:
```bash
pip install livekit-plugins-elevenlabs elevenlabs
```

---

## 3. Code Implementation Steps

### Step 3.1: Update `main.py` Architecture
Transition from `MultimodalAgent` to `VoiceAgent` to allow modular TTS.

1.  **Import necessary plugins**:
    ```python
    from livekit.plugins import openai, elevenlabs
    from livekit.agents import VoiceAgent
    ```

2.  **Modify `entrypoint` function**:
    - Initialize `openai.STT()` for speech-to-text.
    - Initialize `openai.LLM()` for logic.
    - Initialize `elevenlabs.TTS()` for voice output.

### Step 3.2: Implement Voice Selection Logic
Modify the `entrypoint` to dynamically select the `voice_id` based on user metadata.

```python
# Extract gender preference from room metadata
metadata = json.loads(ctx.room.metadata)
voice_gender = metadata.get("voice_gender", "female") # Default to female

# Select Voice ID
voice_id = os.getenv("ELEVEN_MALE_VOICE_ID") if voice_gender == "male" else os.getenv("ELEVEN_FEMALE_VOICE_ID")

# Initialize TTS
tts = elevenlabs.TTS(api_key=os.getenv("ELEVEN_API_KEY"), voice_id=voice_id)
```

### Step 3.3: Update Agent Initialization
```python
agent = VoiceAgent(
    stt=openai.STT(),
    llm=openai.LLM(),
    tts=tts,
    fnc_ctx=services,
)
agent.start(ctx.room, participant)
```

---

## 4. Frontend Integration (Flutter)
Update the `voice_api.py` and Flutter client to pass the `voice_gender` preference.

1.  **Update `TokenRequest` model** in `voice_api.py` to include `voice_gender`.
2.  **Update `generate_livekit_token`** to include `voice_gender` in the JWT metadata.

---

## 5. Testing & Verification
- **Test Male Voice**: Set `voice_gender: "male"` in the request.
- **Test Female Voice**: Set `voice_gender: "female"` in the request.
- **Verify Latency**: Monitor the logs for ElevenLabs synthesis time.

---

## Next Steps
1.  **Configure API Keys**: Provide the ElevenLabs API Key.
2.  **Choose Voices**: Select specific voice IDs from the ElevenLabs library.
3.  **Execute Changes**: Apply the code modifications to `main.py` and `voice_api.py`.
