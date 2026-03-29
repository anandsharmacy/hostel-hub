import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GEMINI_MODEL = "gemini-2.0-flash";

const tools = [
  {
    type: "function",
    function: {
      name: "book_cleaning",
      description:
        "Book a room cleaning request for the student. Use the student's profile info for name, hostel_block, room_number.",
      parameters: {
        type: "object",
        properties: {
          preferred_date: {
            type: "string",
            description: "Date in YYYY-MM-DD format",
          },
          start_hour: {
            type: "number",
            description: "Start availability hour (8-15), e.g. 10 for 10 AM",
          },
          end_hour: {
            type: "number",
            description: "End availability hour (10-17), e.g. 14 for 2 PM",
          },
          notes: { type: "string", description: "Additional notes" },
        },
        required: ["preferred_date", "start_hour", "end_hour"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "order_store_items",
      description:
        "Place a store order for items. Items come from inventory. Category is one of: Stationery, Fruits, Gym Supplements.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" },
              },
              required: ["name", "quantity"],
            },
            description: "List of items to order",
          },
          category: {
            type: "string",
            enum: ["Stationery", "Fruits", "Gym Supplements"],
          },
        },
        required: ["items", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "file_appliance_complaint",
      description: "File an appliance complaint for the student's room.",
      parameters: {
        type: "object",
        properties: {
          appliance: {
            type: "string",
            description: "The appliance name, e.g. AC, Fan, Geyser",
          },
          description: {
            type: "string",
            description: "Description of the issue",
          },
        },
        required: ["appliance", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_medicine",
      description: "Request medicine delivery to the student's room.",
      parameters: {
        type: "object",
        properties: {
          medicine_name: { type: "string", description: "Name of the medicine" },
          notes: {
            type: "string",
            description: "Additional notes about symptoms or dosage",
          },
        },
        required: ["medicine_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_my_requests",
      description:
        "Check the student's recent service requests (cleaning, orders, complaints, medicine).",
      parameters: { type: "object", properties: {} },
    },
  },
];

function getSystemPrompt(role: string, profile: any) {
  const base = `You are a helpful AI assistant for the NMIMS Hostel Management Portal. Be concise and friendly. Today's date is ${new Date().toISOString().split("T")[0]}.`;

  const profileInfo = profile
    ? `\nThe user's profile: Name: ${profile.full_name}, Hostel Block: ${profile.hostel_block || "unknown"}, Room: ${profile.room_number || "unknown"}.`
    : "";

  if (role === "student") {
    return `${base}${profileInfo}
You help students with hostel services. You can:
- Book room cleaning requests (ask for date, availability window)
- Place store orders (Stationery, Fruits, Gym Supplements)
- File appliance complaints (AC, Fan, Geyser, etc.)
- Request medicine
- Check their recent requests

When executing actions, use the student's profile info (name, hostel block, room) automatically. Don't ask the user for their name, room, or hostel unless the profile is missing.
For cleaning: start_hour range 8-15, end_hour range 10-17, minimum 2 hour gap.
For store orders: ask which items and quantities they need. Use the category that fits best.
Always confirm what you're about to do before executing.`;
  }

  if (role === "admin") {
    return `${base}${profileInfo}
You help administrators manage hostel services. You can answer questions about managing cleaning schedules, appliance maintenance, and viewing request summaries. You don't have action tools - guide admins to use the dashboard.`;
  }

  if (role === "vendor") {
    return `${base}${profileInfo}
You help vendors with inventory and order management. You can answer questions about inventory tracking, order fulfillment, restocking, and announcements. Guide vendors to use the dashboard for actions.`;
  }

  return `${base}${profileInfo}
You help super users with system oversight, user approvals, and role management. Guide them to use the dashboard for actions.`;
}

function formatHour(hour: number): string {
  const wholeHour = Math.floor(hour);
  const minutes = hour % 1 === 0.5 ? "30" : "00";
  const ampm = wholeHour >= 12 ? "PM" : "AM";
  const h12 = wholeHour % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function parseHourFromTimeString(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hour = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return hour + (minutes >= 30 ? 0.5 : 0);
}

async function executeToolCall(
  toolName: string,
  args: any,
  userId: string,
  profile: any
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const studentName = profile?.full_name || "Unknown";
  const hostelBlock = profile?.hostel_block || "Unknown";
  const roomNumber = profile?.room_number || "Unknown";

  if (toolName === "book_cleaning") {
    const startHour = args.start_hour;
    const endHour = args.end_hour;
    const availabilityStart = formatHour(startHour);
    const availabilityEnd = formatHour(endHour);

    // Calculate queue position
    const { data: existing } = await supabase
      .from("cleaning_requests")
      .select("availability_start, availability_end")
      .eq("preferred_date", args.preferred_date)
      .in("status", ["pending", "in-progress"])
      .not("availability_start", "is", null)
      .not("availability_end", "is", null);

    const overlapping = (existing || []).filter((row: any) => {
      const rowStart = parseHourFromTimeString(row.availability_start);
      const rowEnd = parseHourFromTimeString(row.availability_end);
      return rowStart < endHour && rowEnd > startHour;
    });

    const queueCount = overlapping.length;
    const arrivalStart = startHour + queueCount * 0.5;
    const arrivalEnd = arrivalStart + 0.5;

    if (arrivalEnd > endHour) {
      return {
        success: false,
        message:
          "This time slot is full. Please choose a wider availability window or a different date.",
      };
    }

    const expectedArrivalStart = formatHour(arrivalStart);
    const expectedArrivalEnd = formatHour(arrivalEnd);

    const { error } = await supabase.from("cleaning_requests").insert({
      user_id: userId,
      student_name: studentName,
      hostel_block: hostelBlock,
      room_number: roomNumber,
      preferred_date: args.preferred_date,
      preferred_time: `${availabilityStart} - ${availabilityEnd}`,
      availability_start: availabilityStart,
      availability_end: availabilityEnd,
      expected_arrival_start: expectedArrivalStart,
      expected_arrival_end: expectedArrivalEnd,
      notes: args.notes || "",
      status: "pending",
    });

    if (error) return { success: false, message: `Error: ${error.message}` };
    return {
      success: true,
      message: `Cleaning booked for ${args.preferred_date}. Queue position: ${queueCount + 1}. Expected arrival: ${expectedArrivalStart} - ${expectedArrivalEnd}.`,
    };
  }

  if (toolName === "order_store_items") {
    const { error } = await supabase.from("store_orders").insert({
      user_id: userId,
      student_name: studentName,
      hostel_block: hostelBlock,
      room_number: roomNumber,
      category: args.category,
      items: args.items,
      status: "pending",
    });

    if (error) return { success: false, message: `Error: ${error.message}` };
    const itemList = args.items
      .map((i: any) => `${i.quantity}x ${i.name}`)
      .join(", ");
    return {
      success: true,
      message: `Store order placed: ${itemList}. Category: ${args.category}. Status: pending.`,
    };
  }

  if (toolName === "file_appliance_complaint") {
    const { error } = await supabase.from("appliance_complaints").insert({
      user_id: userId,
      student_name: studentName,
      hostel_block: hostelBlock,
      room_number: roomNumber,
      appliance: args.appliance,
      description: args.description,
      status: "pending",
    });

    if (error) return { success: false, message: `Error: ${error.message}` };
    return {
      success: true,
      message: `Complaint filed for ${args.appliance}: "${args.description}". Status: pending.`,
    };
  }

  if (toolName === "request_medicine") {
    const { error } = await supabase.from("medicine_requests").insert({
      user_id: userId,
      student_name: studentName,
      hostel_block: hostelBlock,
      room_number: roomNumber,
      medicine_name: args.medicine_name,
      notes: args.notes || null,
      status: "pending",
    });

    if (error) return { success: false, message: `Error: ${error.message}` };
    return {
      success: true,
      message: `Medicine request submitted for ${args.medicine_name}. Status: pending.`,
    };
  }

  if (toolName === "check_my_requests") {
    const [cleaning, orders, complaints, medicine] = await Promise.all([
      supabase
        .from("cleaning_requests")
        .select("preferred_date, status, expected_arrival_start, expected_arrival_end")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("store_orders")
        .select("items, status, created_at, category")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("appliance_complaints")
        .select("appliance, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("medicine_requests")
        .select("medicine_name, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    let summary = "Here are your recent requests:\n\n";

    if (cleaning.data?.length) {
      summary += "**Cleaning:**\n";
      cleaning.data.forEach((r: any) => {
        summary += `- ${r.preferred_date}: ${r.status} (arrival: ${r.expected_arrival_start || "TBD"} - ${r.expected_arrival_end || "TBD"})\n`;
      });
    }

    if (orders.data?.length) {
      summary += "\n**Store Orders:**\n";
      orders.data.forEach((r: any) => {
        const items = (r.items as any[]).map((i) => `${i.quantity}x ${i.name}`).join(", ");
        summary += `- ${r.category}: ${items} - ${r.status}\n`;
      });
    }

    if (complaints.data?.length) {
      summary += "\n**Appliance Complaints:**\n";
      complaints.data.forEach((r: any) => {
        summary += `- ${r.appliance}: ${r.status}\n`;
      });
    }

    if (medicine.data?.length) {
      summary += "\n**Medicine Requests:**\n";
      medicine.data.forEach((r: any) => {
        summary += `- ${r.medicine_name || "Unspecified"}: ${r.status}\n`;
      });
    }

    if (
      !cleaning.data?.length &&
      !orders.data?.length &&
      !complaints.data?.length &&
      !medicine.data?.length
    ) {
      summary = "You don't have any recent requests.";
    }

    return { success: true, message: summary };
  }

  return { success: false, message: "Unknown action." };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    // Get user from auth header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile and role
    const [profileRes, roleRes] = await Promise.all([
      supabaseAuth.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabaseAuth.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    ]);

    const profile = profileRes.data;
    const role = roleRes.data?.role || "student";

    const { messages } = await req.json();
    const systemPrompt = getSystemPrompt(role, profile);

    // Only give tools to students
    const requestTools = role === "student" ? tools : undefined;

    // First AI call
    const aiPayload: any = {
      model: GEMINI_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: false,
    };
    if (requestTools) {
      aiPayload.tools = requestTools;
    }

    const aiResponse = await fetch(GEMINI_OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiPayload),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errText);
      throw new Error("Gemini API error");
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];

    // Check for tool calls
    if (choice?.message?.tool_calls?.length) {
      const toolCall = choice.message.tool_calls[0];
      const fnName = toolCall.function.name;
      const fnArgs = JSON.parse(toolCall.function.arguments);

      const result = await executeToolCall(fnName, fnArgs, user.id, profile);

      // Second AI call to generate friendly response
      const followupMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
        choice.message,
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        },
      ];

      const followupRes = await fetch(GEMINI_OPENAI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          messages: followupMessages,
          stream: true,
        }),
      });

      if (!followupRes.ok) {
        // Fallback: return the raw result
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: result.message,
                },
              },
            ],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(followupRes.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool call - stream the response
    // Re-do with streaming
    const streamPayload: any = {
      model: GEMINI_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    };
    if (requestTools) {
      streamPayload.tools = requestTools;
    }

    const streamResponse = await fetch(GEMINI_OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(streamPayload),
    });

    if (!streamResponse.ok) {
      throw new Error("Failed to stream response");
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
