

## Plan: Add Medical Section to Store Orders

### Current State
- The `storeCategories` array in `StoreOrderForm.tsx` only includes `['Stationery', 'Fruits', 'Gym Supplements']`
- A "Medicine" category already exists in the database (Sanitary Pad is already there for girls)
- The inventory query on line 69 filters to only those 3 categories, excluding Medicine items

### Changes

**Step 1: Add medical items to database (data insert)**
Insert items into `inventory_items` for both boys and girls sections:
- Sanitary Pads (girls only, already exists)
- Hot Water Bag — both sections
- Band-Aid (Pack of 10) — both sections
- Cotton Roll — both sections
- ORS Sachets (Pack of 5) — both sections
- Ice Pack — both sections

**Step 2: Update `StoreOrderForm.tsx`**
- Add `'Medicine'` to the `storeCategories` array (line 18)
- Update the inventory query `.in('category', ...)` filter to include `'Medicine'` (line 69)

No other file changes needed — the rest of the component is fully dynamic.

---

# Extended Flutter Documentation — AI Chatbot & Laundry Details

## 12. AI Chatbot System

### Architecture
The chatbot uses a **tool-calling agent pattern**: a Supabase Edge Function (`chat`) acts as the backend, calling the Lovable AI Gateway (OpenAI-compatible API at `https://ai.gateway.lovable.dev/v1/chat/completions`) with model `google/gemini-3-flash-preview`. Authentication is via `LOVABLE_API_KEY` (auto-provisioned secret).

### Edge Function: `supabase/functions/chat/index.ts`

**Config** (`supabase/config.toml`):
```toml
[functions.chat]
verify_jwt = false
```

**Flow:**
1. Receives `{ messages: ChatMessage[] }` from client
2. Validates user via auth token → fetches profile + role from DB
3. Builds role-specific system prompt with user's profile info (name, hostel, room)
4. First AI call (non-streaming) with tools enabled (students only)
5. If AI returns a tool call → executes it against DB → second AI call (streaming) to generate friendly response
6. If no tool call → re-sends as streaming request → streams SSE back to client

**Authentication:**
```typescript
const authHeader = req.headers.get("authorization") || "";
const token = authHeader.replace("Bearer ", "");
const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
// Returns 401 if invalid
```

**Error handling:**
- 429 → "Rate limit exceeded. Please try again shortly."
- 402 → "AI credits exhausted. Please add credits."
- 401 → Unauthorized

### Tool Definitions (Students Only)

5 tools available:

#### 1. `book_cleaning`
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| preferred_date | string | Yes | YYYY-MM-DD format |
| start_hour | number | Yes | 8-15 (e.g. 10 = 10 AM) |
| end_hour | number | Yes | 10-17 (e.g. 14 = 2 PM) |
| notes | string | No | Additional notes |

**Logic:** Queries existing requests for the date, counts overlapping ones, calculates queue position (each +30min). If arrival exceeds end_hour, returns "slot full". Otherwise inserts into `cleaning_requests`.

#### 2. `order_store_items`
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| items | array | Yes | `[{name: string, quantity: number}]` |
| category | string | Yes | Stationery, Fruits, or Gym Supplements |

Inserts into `store_orders` with student's profile info.

#### 3. `file_appliance_complaint`
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| appliance | string | Yes | e.g. AC, Fan, Geyser |
| description | string | Yes | Issue description |

Inserts into `appliance_complaints`.

#### 4. `request_medicine`
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| medicine_name | string | Yes | Medicine name |
| notes | string | No | Symptoms/dosage notes |

Inserts into `medicine_requests`.

#### 5. `check_my_requests`
No parameters. Fetches last 5 of each request type (cleaning, store, complaints, medicine) for the user. Returns formatted markdown summary.

### System Prompts by Role

| Role | Tools | Prompt Focus |
|------|-------|-------------|
| student | All 5 tools | Can book cleaning, order items, file complaints, request medicine, check requests. Uses profile info automatically. |
| admin | None | Guidance-only. Answers questions about managing cleaning/maintenance. |
| vendor | None | Guidance-only. Answers about inventory, orders, announcements. |
| super_user | None | Guidance-only. Answers about approvals and role management. |

All prompts include: current date, user's name/hostel/room from profile.

### Frontend: Client Service (`src/lib/chatService.ts`)

```typescript
type ChatMessage = { role: "user" | "assistant"; content: string };

streamChat({
  messages: ChatMessage[],
  token: string,           // session.access_token
  onDelta: (text) => void, // called per SSE token
  onDone: () => void,
  onError: (error) => void,
})
```

**Handles two response types:**
- `application/json` → tool-call fallback (non-streaming), reads `choices[0].message.content`
- `text/event-stream` → SSE streaming, parses line-by-line for `data: {JSON}` chunks

**Error codes handled:** 429 (rate limit), 402 (credits), 401 (auth)

### Frontend: Chat UI (`src/components/chat/AIChatBot.tsx`)

**Layout:**
- Floating action button (FAB): bottom-right, 56px circle, primary color, `MessageCircle` icon
- Chat panel: 360px wide × 500px tall, rounded-2xl, border, shadow-2xl
- Header: Bot icon + "AI Assistant" label + close button
- Messages: scrollable area, user messages right-aligned (primary bg), assistant left-aligned (muted bg), avatar circles
- Loading: 3 bouncing dots animation
- Input: text field + voice button (left) + send button (right)

**State management:**
- `messages: ChatMessage[]` — full conversation history (sent with every request)
- `isLoading` — disables input during streaming
- `assistantSoFar` — accumulates streaming tokens, updates last assistant message

**After tool execution:** Calls `refetchData()` from DataContext to refresh dashboard data (so new requests appear in My Requests immediately).

**Welcome messages per role:**
- student: "Hi! 👋 I can help you book cleaning, order from the store, file complaints, or request medicine."
- admin: "Hello! I can help you review and manage service requests."
- vendor: "Hi! I can help you with order management, inventory, and announcements."
- super_user: "Hello! I can assist with system oversight and user management."

### Voice Input (`src/components/chat/VoiceInput.tsx`)

Uses native **Web Speech API** (`webkitSpeechRecognition` / `SpeechRecognition`).
- Language: `en-US`
- `continuous: false`, `interimResults: false`
- On result → sends transcript directly as a message (auto-submit)
- Button: Mic icon, pulses red while listening
- Hidden if browser doesn't support Speech API

---

## 13. Laundry Service — Detailed Specifications

### Cloth Types
```
Shirt, T-Shirt, Pants, Jeans, Jacket, Blazer, Coat,
Shorts, Kurta, Saree, Bedsheet, Towel, Other
```

### Cleaning Types & Pricing

| Cleaning Type | Code | Base Price | Special Price (Blazer/Coat) |
|---------------|------|------------|---------------------------|
| Wash Only | `wash_only` | ₹7/cloth | ₹7/cloth |
| Iron Only | `iron_only` | ₹7/cloth | ₹7/cloth |
| Wash & Iron | `wash_and_iron` | ₹15/cloth | ₹15/cloth |
| Dry Clean | `dry_clean` | ₹50/cloth | ₹100/cloth |

**Special items:** Blazer and Coat get ₹100 per cloth for dry cleaning (all other types charge standard rates).

### Check-In Flow (`LaundryCheckInForm`)

**Form fields:**
1. Student Name (text input, required)
2. SAP ID (text input, required)
3. Hostel Block (text input, required)
4. Contact Number (text input, max 15 chars, required)
5. Cleaning Type (dropdown: 4 options above)
6. Clothing Items (dynamic list):
   - Each row: Cloth Type (dropdown from 13 types) + Quantity (number, 1-50) + calculated price + remove button
   - "Add Item" button to add rows
   - Minimum 1 item required

**Price calculation:** Real-time total shown at bottom = Σ(unit_price × quantity) for each item.

**Submit flow:**
1. Validates all fields + at least 1 valid item
2. Inserts into `laundry_vendor_orders` (order header with total_amount)
3. Inserts into `laundry_vendor_order_items` (one row per cloth item, with unit_price and is_special flag)
4. Shows success toast, resets form

**UI layout:** 2-column grid for student info fields, full-width cleaning type select, dynamic item list with inline pricing, total + submit button in footer row.

### Check-Out Flow (`LaundryCheckOutForm`)

**Search modes** (toggle buttons):
1. **SAP ID** — partial match (`ilike`)
2. **Name** — partial match (`ilike`)
3. **Date Range** — from/to date inputs, filters `checked_in_at`

All searches filter for `status = 'checked_in'` only.

**Results display:**
Each order card shows:
- Student name + SAP ID badge
- Cleaning type badge (e.g. "Wash & Iron")
- Grid: Hostel Block, Contact, Amount (₹), Checked-in date/time
- "Check Out" button

**Check-out action:** Updates `laundry_vendor_orders` → `status: 'checked_out'`, `checked_out_at: now()`. Removes from results list.

### Revenue Tracker (`LaundryRevenueTracker`)

**PIN gate:** 4-digit numeric PIN input. Validates against `laundry_settings.revenue_pin` for the user. On success, unlocks dashboard.

**Dashboard (unlocked):**
- **Stats cards** (2-column grid):
  - Total Revenue (₹ sum of all checked-out orders)
  - Total Orders (count of checked-out orders)
- **Charts** (2-column grid):
  - Bar chart: Revenue by cleaning type (Wash Only, Iron Only, Wash & Iron, Dry Clean)
  - Pie chart: Revenue distribution by cleaning type with percentage labels
- Uses `recharts` library (BarChart, PieChart, ResponsiveContainer)
- Colors use CSS variables: `hsl(var(--primary))`, `hsl(var(--accent))`, `hsl(var(--secondary))`, `hsl(var(--muted))`

### Change PIN Dialog (`ChangePinDialog`)

- Triggered from "Change PIN" button in dashboard header
- Fields: Current PIN, New PIN (4 digits), Confirm New PIN
- Validates current PIN against DB, checks new PIN match, updates `laundry_settings.revenue_pin`

### Data Tables Used

| Table | Purpose |
|-------|---------|
| `laundry_vendor_orders` | Order headers (student info, cleaning type, total, status) |
| `laundry_vendor_order_items` | Line items (cloth type, quantity, unit price, is_special) |
| `laundry_settings` | PIN storage per laundry user |

Note: `laundry_orders` and `laundry_order_items` (without "vendor" prefix) exist but are for student-facing laundry tracking. The laundry dashboard uses the vendor-prefixed tables exclusively.
