import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_URL = Deno.env.get("APP_URL") || "https://my.getchatters.com";

interface NPSSubmission {
  id: string;
  venue_id: string;
  customer_email: string;
  scheduled_send_at: string;
  venues: {
    name: string;
    logo: string;
    nps_question: string;
    primary_color: string;
    nps_enabled: boolean;
    account_id: string;
  };
}

// Accounts where NPS emails should be logged but NOT actually sent via Resend
// This is used for demo accounts or accounts with email sending restrictions
const SKIP_SENDING_ACCOUNT_IDS = [
  'af1d9502-a1a9-4873-8776-9b7177ed30c3', // LWM Pub Group Ltd (demo account)
];

serve(async (req) => {
  try {
    // Verify this is a cron request or authorized request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY || "")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all NPS submissions that are scheduled to be sent and haven't been sent yet
    // Only for venues that have NPS enabled
    const now = new Date().toISOString();
    const { data: submissions, error: fetchError } = await supabase
      .from("nps_submissions")
      .select("*, venues(name, logo, nps_question, primary_color, nps_enabled, account_id)")
      .lte("scheduled_send_at", now)
      .is("sent_at", null)
      .limit(50); // Process max 50 per run

    if (fetchError) {
      console.error("Error fetching submissions:", fetchError);
      throw fetchError;
    }

    if (!submissions || submissions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending NPS emails to send" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${submissions.length} NPS emails...`);

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Send emails using Resend
    for (const submission of submissions as NPSSubmission[]) {
      try {
        // Skip if venue has NPS disabled
        if (!submission.venues?.nps_enabled) {
          console.log(`Skipping ${submission.customer_email} - NPS disabled for venue`);
          // Mark as skipped so we don't retry
          await supabase
            .from("nps_submissions")
            .update({
              sent_at: new Date().toISOString(),
              send_error: "NPS disabled for venue"
            })
            .eq("id", submission.id);
          results.skipped = (results.skipped || 0) + 1;
          continue;
        }

        // For demo/restricted accounts: log as sent but don't actually send via Resend
        if (SKIP_SENDING_ACCOUNT_IDS.includes(submission.venues?.account_id)) {
          console.log(`Demo mode: ${submission.customer_email} - logging as sent without sending`);
          await supabase
            .from("nps_submissions")
            .update({
              sent_at: new Date().toISOString()
              // No send_error - it's intentionally not sent
            })
            .eq("id", submission.id);
          results.sent++;
          continue;
        }

        const npsUrl = `${APP_URL}/nps?id=${submission.id}`;
        const venueName = submission.venues.name || "Our venue";
        const npsQuestion =
          submission.venues.nps_question ||
          "How likely are you to recommend us to a friend or colleague?";

        // Create email HTML
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We'd love your feedback</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${
    submission.venues.logo
      ? `<div style="text-align: center; margin-bottom: 30px;">
    <img src="${submission.venues.logo}" alt="${venueName}" style="height: 60px;">
  </div>`
      : ""
  }

  <div style="background: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: ${
      submission.venues.primary_color || "#111827"
    }; font-size: 24px; margin-top: 0;">
      Thank you for visiting ${venueName}!
    </h1>

    <p style="font-size: 16px; color: #4b5563;">
      We hope you had a great experience. We'd love to hear your feedback.
    </p>

    <p style="font-size: 18px; font-weight: 600; color: #1f2937; margin-top: 30px; margin-bottom: 20px;">
      ${npsQuestion}
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${npsUrl}"
         style="display: inline-block; background: ${
           submission.venues.primary_color || "#3b82f6"
         }; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Rate Your Experience
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; text-align: center;">
      This will take less than 30 seconds
    </p>
  </div>

  <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 30px;">
    <p>
      You're receiving this because you recently visited ${venueName}.<br>
      <a href="${npsUrl}" style="color: #9ca3af;">Click here to respond</a> or ignore this email if you prefer not to participate.
    </p>
  </div>
</body>
</html>
        `;

        // Send via Resend
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${venueName} <feedback@getchatters.com>`,
            to: [submission.customer_email],
            subject: `How was your visit to ${venueName}?`,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          throw new Error(`Resend API error: ${errorText}`);
        }

        // Mark as sent
        const { error: updateError } = await supabase
          .from("nps_submissions")
          .update({ sent_at: new Date().toISOString() })
          .eq("id", submission.id);

        if (updateError) {
          console.error("Error updating submission:", updateError);
          throw updateError;
        }

        results.sent++;
        console.log(`✓ Sent NPS email to ${submission.customer_email}`);
      } catch (error) {
        results.failed++;
        const errorMessage = `Failed for ${submission.customer_email}: ${error.message}`;
        results.errors.push(errorMessage);
        console.error(errorMessage);

        // Log error in database
        await supabase
          .from("nps_submissions")
          .update({
            send_error: error.message,
          })
          .eq("id", submission.id);
      }
    }

    console.log(
      `NPS email batch complete: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`
    );

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-nps-emails function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
