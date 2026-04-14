# Quick Start Guide - Hostel Voice Assistant

Get started with the voice assistant in 5 minutes!

## 1️⃣ Setup Environment (2 min)

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
# Fill in:
# - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# - LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET  
# - OPENAI_API_KEY
```

## 2️⃣ Install Dependencies (1 min)

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

## 3️⃣ Start Voice Agent Server (1-2 min)

```bash
# Start the LiveKit Agent entrypoint
python -m livekit.agents run main:app

# You should see:
# [INFO] main.py: Initializing agent
# [INFO] main.py: Listening for connections...
```

## 4️⃣ Start API Service (new terminal)

```bash
# Activate venv again in new terminal
source venv/bin/activate

# Start FastAPI backend
python voice_api.py

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 5️⃣ Generate Training Data (1 min)

```bash
python training_data_generator.py

# Creates:
# - ./training_data/training_data.json
# - ./training_data/conversation_scenarios.json
# - ./training_data/test_cases.json
```

## ✅ Verify It Works

### Test 1: Generate Token

```bash
curl -X POST http://localhost:8000/api/voice/generate-token \
  -H "Authorization: Bearer test-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"room_name": "test_room", "language": "en"}'

# Expected response:
# {"token": "...", "url": "wss://...", "room_name": "test_room"}
```

### Test 2: Check Health

```bash
curl http://localhost:8000/health

# Expected response:
# {"status": "ok", "livekit_url": "wss://...", "timestamp": "..."}
```

## 📱 Flutter Integration

### Option A: Copy Files to Your Project

```bash
# Copy voice service
cp voice_service.dart /path/to/your/flutter/app/lib/services/

# Add to pubspec.yaml:
# livekit_flutter: ^0.5.0
# permission_handler: ^11.4.0
# riverpod: ^2.0.0
```

### Option B: Use as Reference

- See `voice_service.dart` for WebRTC pattern
- Adapt to your Flutter project structure
- Update server URLs to match your deployment

## 🧪 Test Voice Commands

Once everything is running, test these voice commands:

### English
- "Book a cleaning service for tomorrow"
- "The fan is not working"
- "Order a water bottle from the store"
- "I need medicine for my fever"
- "What are my pending requests?"
- "Join the barber queue"
- "Show me my notifications"

### Hindi
- "कल सफाई करवानी है"
- "पंखा काम नहीं कर रहा"
- "दुकान से पानी की बोतल मंगवा दो"
- "बुखार है, दवा चाहिए"
- "मेरे अनुरोध दिखाओ"

## 🐛 Troubleshooting

### Issue: "Cannot connect to LiveKit"
```
→ Check LIVEKIT_URL format (should be wss:// or ws://)
→ Verify LiveKit server is running
→ Check firewall/port access
```

### Issue: "OpenAI API key invalid"
```
→ Verify OPENAI_API_KEY is set in .env
→ Test key at: https://platform.openai.com/account/api-keys
```

### Issue: "Supabase connection failed"
```
→ Verify SUPABASE_URL is correct format
→ Check anon key has proper permissions
→ Verify VPN/firewall allows connection
```

### Issue: "No response from voice agent"
```
→ Check agent is running: look for "[INFO] Agent listening..."
→ Verify room_name was created
→ Check logs for error messages
```

## 📊 Monitor Running System

### Check Agent Status
```bash
ps aux | grep "livekit.agents"
```

### View API Logs
```bash
# Terminal should show requests:
# INFO:     127.0.0.1:12345 - "POST /api/voice/generate-token HTTP/1.1" 200
```

### Test Latency
```bash
time curl http://localhost:8000/health
```

## 🚀 Next Steps

1. **Update Supabase RLS**: Allow voice agent service account
2. **Deploy**: Move to production LiveKit server
3. **Test with Users**: Validate voice commands work naturally
4. **Collect Data**: Gather real utterances for model improvement
5. **Monitor**: Set up logging and alerting

## 📞 Support

For detailed documentation, see [README.md](./README.md)

For component documentation:
- Voice functions: see `hostel_services.py`
- Database operations: see `supabase_client.py`
- Multilingual features: see `hindi_support.py`
- API endpoints: see `voice_api.py`
- Flutter integration: see `voice_service.dart`

---

**Status**: ✅ Phase 1 Complete - Voice Agent Ready  
**Time to Production**: ~2-3 weeks with proper testing & deployment setup  
**Questions?** Refer to README.md or check the code comments
