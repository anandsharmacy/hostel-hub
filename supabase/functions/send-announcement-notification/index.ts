import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnnouncementPayload {
  title: string;
  message: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is a vendor
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Failed to verify token:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Request from user:", userId);

    // Parse request body
    const { title, message }: AnnouncementPayload = await req.json();
    
    if (!title || !message) {
      console.error("Missing title or message");
      return new Response(
        JSON.stringify({ error: "Title and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending notification for announcement:", title);

    // Get all student emails using service role client
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all users with student role
    const { data: studentRoles, error: rolesError } = await serviceClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "student")
      .eq("approved", true);

    if (rolesError) {
      console.error("Error fetching student roles:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch students" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!studentRoles || studentRoles.length === 0) {
      console.log("No students found to notify");
      return new Response(
        JSON.stringify({ success: true, emailsSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get emails for these users from auth.users
    const userIds = studentRoles.map((r) => r.user_id);
    const { data: authUsers, error: authError } = await serviceClient.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user emails" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter to get only student emails
    const studentEmails = authUsers.users
      .filter((user) => userIds.includes(user.id) && user.email)
      .map((user) => user.email as string);

    if (studentEmails.length === 0) {
      console.log("No student emails found");
      return new Response(
        JSON.stringify({ success: true, emailsSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending emails to ${studentEmails.length} students`);

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Send email to all students (batch send)
    const { error: emailError } = await resend.emails.send({
      from: "NMIMS Hostel <onboarding@resend.dev>",
      to: studentEmails,
      subject: `📢 New Announcement: ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📢 New Announcement</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 16px;">${title}</h2>
            <p style="color: #4b5563; margin-bottom: 24px; white-space: pre-wrap;">${message}</p>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated notification from the NMIMS Hostel Management Portal.
                <br>Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending emails:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send emails", details: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully sent emails to ${studentEmails.length} students`);

    return new Response(
      JSON.stringify({ success: true, emailsSent: studentEmails.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
