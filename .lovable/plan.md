

## AI Chatbot with Voice Commands and Action Execution

### Overview
Add a floating AI chatbot to all dashboard pages that can:
- Answer questions about hostel services based on the user's role
- Execute real actions via voice or text: book cleaning requests, place store orders, file appliance complaints, and request medicine
- Use the browser's built-in Web Speech API for voice input (free, no setup required)
- Stream AI responses for a real-time feel

### How It Works

1. A floating chat button appears in the bottom-right corner of every dashboard
2. Clicking it opens a chat panel where users can type or tap a microphone button to speak
3. The AI understands natural language like:
   - "Book a room cleaning for tomorrow between 10 AM and 2 PM"
   - "Order 2 notebooks and 1 pen from the store"
   - "My AC is not working, please file a complaint"
   - "I need paracetamol"
4. The AI uses tool-calling to extract structured data from the request, then executes the action via the backend
5. The AI confirms the action with details (e.g., expected arrival time for cleaning)

### Architecture

**Backend -- 2 Edge Functions:**

1. **`supabase/functions/chat/index.ts`** -- Conversational AI
   - Uses Lovable AI Gateway with `google/gemini-3-flash-preview` model
   - Role-specific system prompts (student, admin, vendor, super_user)
   - Tool-calling for action execution with these tools:
     - `book_cleaning` -- params: preferred_date, start_hour, end_hour, notes
     - `order_store_items` -- params: items (array of name + quantity), category
     - `file_appliance_complaint` -- params: appliance, description
     - `request_medicine` -- params: medicine_name, notes
     - `check_my_requests` -- returns summary of recent requests
   - When a tool call is detected, the function executes the database operation using the user's auth token (respecting RLS) and returns the result to the AI for a natural confirmation message
   - Streams the final response back to the client
   - Handles 429/402 rate limit errors

2. **`supabase/functions/chat-action/index.ts`** -- Action Executor
   - Receives tool call parameters + user auth token
   - Executes the actual database inserts (cleaning_requests, store_orders, appliance_complaints, medicine_requests)
   - Computes expected arrival time for cleaning (same queue logic as the form)
   - Fetches available inventory items for store orders
   - Returns structured results back to the chat function

**Frontend -- 3 New Files:**

1. **`src/components/chat/AIChatBot.tsx`** -- Main floating chat component
   - Floating action button with message icon
   - Expandable chat panel with message history
   - Text input field + microphone button
   - Markdown rendering for AI responses
   - Typing/streaming indicator
   - Role-aware welcome message
   - Action confirmation cards (showing what was booked/ordered)

2. **`src/components/chat/VoiceInput.tsx`** -- Voice input component
   - Uses the Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`)
   - Microphone button with visual feedback (pulsing animation when listening)
   - Auto-sends the transcribed text to the chat
   - Graceful fallback message if browser doesn't support speech recognition

3. **`src/lib/chatService.ts`** -- Streaming client helper
   - SSE parser for token-by-token rendering
   - Error handling for rate limits (429) and payment (402)

**Modified File:**

4. **`src/components/layout/DashboardLayout.tsx`** -- Add `<AIChatBot />` so it appears on all dashboard pages

### Tool-Calling Flow (for actions)

```text
User says: "Book cleaning for Feb 25, available 10 AM to 2 PM"
                |
                v
    Edge function sends to AI with tools defined
                |
                v
    AI returns tool_call: book_cleaning({
      preferred_date: "2025-02-25",
      start_hour: 10,
      end_hour: 14,
      notes: ""
    })
                |
                v
    Edge function executes: INSERT into cleaning_requests
    + computes queue position and expected arrival
                |
                v
    Returns result to AI: "Cleaning booked. Queue position: 3.
    Expected arrival: 11:30 AM - 12:00 PM"
                |
                v
    AI generates friendly confirmation message
    streamed back to user
```

### Voice Input Flow

```text
User taps microphone button
        |
        v
Browser requests mic permission (first time only)
        |
        v
Speech Recognition starts listening
(pulsing animation on mic button)
        |
        v
User speaks: "Order two notebooks"
        |
        v
Browser transcribes to text
        |
        v
Text auto-populates chat input and sends
        |
        v
Normal chat flow continues (AI processes, executes action)
```

### Role-Specific Behavior

| Role | Available Actions | Welcome Message |
|------|-------------------|-----------------|
| Student | Book cleaning, order items, file complaints, request medicine, check requests | "Hi! I can help you book cleaning, order from the store, or file complaints. Try speaking or typing!" |
| Admin | Check all requests, view summaries | "Hello! I can help you review and manage service requests." |
| Vendor | Check orders, view inventory status | "Hi! I can help you with order management and inventory." |
| Super User | View system status | "Hello! I can assist with system oversight and user management." |

### Technical Details

- **Model**: `google/gemini-3-flash-preview` (fast, good at tool-calling)
- **Streaming**: SSE-based token streaming for real-time responses
- **Auth**: User's JWT token is forwarded to the edge function, which creates a Supabase client with that token to respect RLS policies
- **Voice**: Web Speech API (works in Chrome, Edge, Safari; shows fallback in Firefox)
- **Chat history**: In-memory only (resets on page refresh, no database storage needed)
- **No new database tables**: All actions use existing tables with existing RLS policies
- **No new API keys**: Uses pre-configured `LOVABLE_API_KEY` for AI gateway

### Files Summary

| File | Action |
|------|--------|
| `supabase/functions/chat/index.ts` | Create |
| `src/lib/chatService.ts` | Create |
| `src/components/chat/AIChatBot.tsx` | Create |
| `src/components/chat/VoiceInput.tsx` | Create |
| `src/components/layout/DashboardLayout.tsx` | Modify (add chatbot) |

