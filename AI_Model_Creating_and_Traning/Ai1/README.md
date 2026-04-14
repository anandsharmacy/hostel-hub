# Hostel Voice Assistant - Implementation Guide

Welcome! This is a complete implementation of the **Multi-Role Hostel Voice Assistant** using LiveKit Agents, OpenAI Realtime API, Supabase, and Flutter.

## 📁 Project Structure

```
/Users/anandsharma/Ai1/
├── main.py                           # LiveKit Agent server entry point
├── api.py                            # Legacy temperature control (reference)
├── supabase_client.py                # Supabase integration with RLS
├── hostel_services.py                # All @llm.ai_callable voice functions
├── hindi_support.py                  # Multilingual (EN/HI) support
├── voice_api.py                      # FastAPI backend for token generation
├── training_data_generator.py        # Generate synthetic training data
├── voice_service.dart                # Flutter voice service (copy to app)
├── .env.example                      # Environment template
└── requirements.txt                  # Python dependencies
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Supabase project** (with tables: cleaning_request, appliance_complaint, store_order, medicine_request, salon_queue, etc.)
- **LiveKit server** (Cloud or self-hosted: ws://localhost:7880)
- **OpenAI API key** (for Realtime Model)
- **Flutter 3.11+** (for mobile app integration)

### Step 1: Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LiveKit
LIVEKIT_URL=ws://your-livekit-server:7880
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# OpenAI (for Realtime Model)
OPENAI_API_KEY=your-openai-key

# Optional: Other providers
DEEPGRAM_API_KEY=your-deepgram-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Run Voice Agent Server

```bash
python -m livekit.agents run main:app
```

Or use the CLI directly:

```bash
livekit-agents run main:entrypoint
```

The server will start and wait for connections from the Flutter app.

### Step 4: Start FastAPI Backend Service

In a separate terminal:

```bash
pip install fastapi uvicorn
python voice_api.py
```

This API server handles:
- JWT verification
- LiveKit token generation
- User context extraction

### Step 5: Generate Training Data

```bash
python training_data_generator.py ./training_data
```

This creates:
- `training_data.json` - Intent classification dataset
- `conversation_scenarios.json` - Multi-turn examples
- `test_cases.json` - Validation test cases

## 🎯 Core Features

### Student Voice Commands (7 primary)

1. **Book Cleaning Service** 🧹
   - "Book a cleaning service for tomorrow"
   - "My room needs cleaning"
   - Parameters: hostel_name, date, time_slot, special_requests

2. **Report Appliance Issues** 🔧
   - "The fan is not working"
   - "AC broken in my room"
   - Parameters: appliance_type, description, image

3. **Place Store Orders** 🛒
   - "Order a water bottle"
   - "Buy me snacks from store"
   - Parameters: items, quantity, delivery_preference

4. **Request Medicine** 💊
   - "I need medicine"
   - "I have a fever"
   - Parameters: medicine_name, prescription, urgency

5. **View Requests** 📋
   - "Check my request status"
   - "What are my pending requests?"
   - Returns: Aggregated cleaning, appliance, orders, medicine

6. **Join Salon Queue** 💇
   - "Join the barber queue"
   - "I want a haircut"
   - Parameters: hostel_name, service_type

7. **Get Notifications** 📢
   - "What are my notifications?"
   - "Show me announcements"
   - Returns: Recent announcements + request updates

### Multi-Role Support

| Role | Commands | Use Case |
|------|----------|----------|
| **Student** | 7 core services | Booking, ordering, requesting, viewing status |
| **Admin** | Approve requests, dashboard, announcements | Management & oversight |
| **Vendor** | Check inventory, update orders | Store operations |
| **Barber** | Queue status, mark complete | Salon operations |
| **Laundry** | Order tracking, delivery schedule | Laundry operations |

### Multilingual Support

- **English** - Default, comprehensive command coverage
- **Hindi** - Devanagari script + transliteration, common hostel terminology

Language automatically detected from user input. Responses locale same language.

## 🔌 Integration Points

### Supabase Tables Required

```sql
-- Existing tables your app uses:
- cleaning_request
- appliance_complaint
- store_order
- medicine_request
- salon_queue
- laundry_order
- announcement
- user_role (profiles table)
```

Each table needs RLS policies that respect `user_role` from JWT claims.

### Flutter Integration

Copy `voice_service.dart` to your Flutter project:

```bash
cp voice_service.dart /path/to/your/flutter/app/lib/services/
```

Add dependencies to `pubspec.yaml`:

```yaml
dependencies:
  livekit_flutter: ^0.5.0
  permission_handler: ^11.4.0
  riverpod: ^2.0.0
  supabase_flutter: ^1.10.0
```

### Usage in Flutter

```dart
import 'services/voice_service.dart';

// Initialize voice service
final voiceNotifier = ref.read(voiceAssistantProvider.notifier);
await voiceNotifier.initialize();

// Connect to voice agent
await voiceNotifier.connect(
  serverUrl: 'ws://your-server:7880',
  roomName: 'voice_${userId}_${timestamp}',
  userName: userName,
  language: 'en',  // or 'hi'
);

// Use VoiceAssistantWidget in UI
VoiceAssistantWidget(
  serverUrl: 'ws://your-server:7880',
  roomName: 'voice_room',
)
```

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│        Flutter Mobile App              │
│  (iOS/Android with voice UI)          │
└────────────┬────────────────────────────┘
             │ WebRTC + JWT
             ↓
┌─────────────────────────────────────────┐
│     FastAPI Voice API (voice_api.py)   │
│  - JWT verification & validation      │
│  - LiveKit token generation           │
│  - User context extraction            │
└────────────┬────────────────────────────┘
             │ Token
             ↓
┌─────────────────────────────────────────┐
│   LiveKit Server (Cloud or self-hosted) │
│  - WebRTC connection management        │
│  - Room orchestration                  │
└────────────┬────────────────────────────┘
             │ RTC Session
             ↓
┌─────────────────────────────────────────┐
│  Voice Agent (main.py entrypoint)      │
│  ┌──────────────────────────────────┐  │
│  │ HostelServicesFunctions          │  │
│  │ - @llm.ai_callable decorators   │  │
│  │ - Role-based permissions        │  │
│  │ - Supabase integration          │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ OpenAI Realtime Model           │  │
│  │ - Speech-to-Text                │  │
│  │ - LLM reasoning                 │  │
│  │ - Text-to-Speech                │  │
│  └──────────────────────────────────┘  │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│   Supabase Backend                      │
│  - Database (PostgreSQL with RLS)      │
│  - Storage (file uploads)              │
│  - Auth (JWT validation)               │
└─────────────────────────────────────────┘
```

## 🧪 Testing

### Unit Tests (Python)

```bash
pytest test_supabase_client.py
pytest test_hostel_services.py
pytest test_hindi_support.py
```

### Integration Tests

```bash
# Start voice agent server
python -m livekit.agents run main:app

# In another terminal, test token generation
curl -X POST http://localhost:8000/api/voice/generate-token \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"room_name": "test_room", "language": "en"}'
```

### Voice Quality Testing

Use the test cases from `training_data_generator.py`:

```bash
python -c "from training_data_generator import TrainingDataGenerator; \
gen = TrainingDataGenerator(); \
test_cases = gen.generate_test_cases(); \
for case in test_cases: print(case['utterance'])"
```

## 📈 Performance Metrics

Target benchmarks:

| Metric | Target | Notes |
|--------|--------|-------|
| **Response Latency** | <2s | STT + LLM + TTS combined |
| **STT Accuracy** | >90% | Word error rate in noisy environments |
| **Function Calling** | >95% | Correct intent → function mapping |
| **Uptime** | 99.5% | Production target with monitoring |
| **Concurrent Users** | 100+ | Per LiveKit server instance |

## 🔐 Security

### JWT Verification

- All API requests validated with Supabase JWT
- User role extracted from JWT claims
- RLS enforced at Supabase level

### RLS Policies

Example policy for `cleaning_request` table:

```sql
CREATE POLICY student_cleaning_policy ON cleaning_request
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY admin_cleaning_policy ON cleaning_request
  FOR SELECT USING (
    SELECT user_role = 'admin' FROM profiles WHERE id = auth.uid()
  );
```

### Rate Limiting

Add to FastAPI (`voice_api.py`):

```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/api/voice/generate-token")
@limiter.limit("10/minute")
async def generate_voice_token(...):
    ...
```

## 🐛 Troubleshooting

### Voice Agent Won't Connect

```
Error: Could not connect to LiveKit server
```

**Solution:**
- Check LIVEKIT_URL is correct (ws:// not http://)
- Verify LiveKit server is running: `livekit-server --dev`
- Check firewall/port access (default: 7880/7881)

### Token Generation Fails

```
Error: Token verification failed
```

**Solution:**
- Verify OPENAI_API_KEY is set
- Check Supabase JWT is valid
- Ensure service account has permissions

### Supabase RLS Issues

```
Error: new row violates row-level security policy
```

**Solution:**
- Update RLS policies to allow voice agent service account
- Use `service_role=True` when needed (internal operations)
- Verify `auth.uid()` matches user_id in JWT

### Slow Responses

**Solutions:**
- Use Deepgram for better STT performance
- Reduce LLM context with summarization
- Enable model caching (if available)
- Check network latency to LiveKit server

## 📚 API Reference

### Voice Agent Functions

#### Student Commands

```python
# Book Cleaning
def book_cleaning_service(
    hostel_name: str,
    date: str,  # "tomorrow", "2025-04-05"
    time_slot: TimeSlot,  # MORNING, AFTERNOON, EVENING, etc.
    special_requests: Optional[str] = None
) -> str

# Report Appliance Issue
def report_appliance_issue(
    appliance_type: Appliance,  # FAN, AC, LIGHT, etc.
    description: str,
    has_image: bool = False
) -> str

# Place Store Order
def place_store_order(
    items: str,  # Comma-separated: "water bottle, soap, towel"
    quantity: int = 1,
    delivery_preference: str = "hostel_delivery"
) -> str

# Request Medicine
def request_medicine(
    medicine_name: Optional[str] = None,
    has_prescription: bool = False,
    urgency: Urgency = Urgency.NORMAL
) -> str

# View Requests
def view_my_requests(
    request_type: Optional[ServiceType] = None
) -> str

# Join Salon Queue
def join_salon_queue(
    hostel_name: str,
    service_type: str = "general"
) -> str

# Get Notifications
def get_notifications_summary() -> str
```

### FastAPI Endpoints

```
POST /api/voice/generate-token
  - Generate LiveKit token
  - Requires: JWT in Authorization header
  - Returns: {token, url, room_name}

GET /api/voice/user-info
  - Get current user info
  - Requires: JWT in Authorization header
  - Returns: {user_id, user_role, email}

POST /api/voice/start-session
  - Start a new voice session
  - Requires: JWT, language preference
  - Returns: {token, url, room_name, user_id, user_role}

POST /api/voice/end-session
  - End voice session and clean up
  - Requires: room_name, JWT

GET /api/voice/rooms
  - List active rooms (admin only)
  - Requires: JWT with admin role
  - Returns: {rooms: [...]}
```

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured (no hardcoded secrets)
- [ ] HTTPS enabled for FastAPI
- [ ] LiveKit server deployed (Cloud recommended)
- [ ] Rate limiting enabled
- [ ] Logging & monitoring configured
- [ ] Backup strategy for Supabase
- [ ] RLS policies tested and verified
- [ ] Load testing completed (minimum 100 concurrent users)
- [ ] Graceful degradation when services unavailable
- [ ] Error handling for all edge cases

### Deployment Options

**Option 1: Railway.app (Recommended)**
```bash
railway link
railway up
```

**Option 2: Docker**
```bash
docker build -t hostel-voice:1.0 .
docker run -p 8000:8000 --env-file .env hostel-voice:1.0
```

**Option 3: AWS Lambda**
```bash
serverless deploy function -f voiceAgent
```

## 📞 Support & Resources

- **LiveKit Docs**: https://docs.livekit.io
- **Supabase Docs**: https://supabase.com/docs
- **OpenAI Realtime**: https://platform.openai.com/docs/guides/realtime
- **Flutter Integration**: https://livekit.io/docs/flutter
- **GitHub Issues**: [This repository]

## 📝 License

This implementation is provided as-is for the NMIMS Hostel Hub project.

---

**Version**: 1.0.0  
**Last Updated**: March 31, 2025  
**Maintainer**: AI Assistant
