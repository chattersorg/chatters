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
  customer_name: string | null;
  scheduled_send_at: string;
  venues: {
    name: string;
    logo: string;
    nps_question: string;
    primary_color: string;
    nps_enabled: boolean;
    account_id: string;
    nps_email_subject: string | null;
    nps_email_greeting: string | null;
    nps_email_body: string | null;
    nps_email_button_text: string | null;
    nps_email_header_image: string | null;
    nps_email_nav_link_1_text: string | null;
    nps_email_nav_link_1_url: string | null;
    nps_email_nav_link_2_text: string | null;
    nps_email_nav_link_2_url: string | null;
    nps_email_nav_link_3_text: string | null;
    nps_email_nav_link_3_url: string | null;
    nps_email_background_color: string | null;
    nps_email_card_color: string | null;
    nps_email_text_color: string | null;
    nps_email_button_color: string | null;
    nps_email_button_text_color: string | null;
    nps_email_signoff: string | null;
    nps_email_signoff_name: string | null;
    nps_email_footer_link_1_text: string | null;
    nps_email_footer_link_1_url: string | null;
    nps_email_footer_link_2_text: string | null;
    nps_email_footer_link_2_url: string | null;
    nps_email_footer_link_3_text: string | null;
    nps_email_footer_link_3_url: string | null;
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
      .select(`
        *,
        venues(
          name, logo, nps_question, primary_color, nps_enabled, account_id,
          nps_email_subject, nps_email_greeting, nps_email_body, nps_email_button_text,
          nps_email_header_image,
          nps_email_nav_link_1_text, nps_email_nav_link_1_url,
          nps_email_nav_link_2_text, nps_email_nav_link_2_url,
          nps_email_nav_link_3_text, nps_email_nav_link_3_url,
          nps_email_background_color, nps_email_card_color, nps_email_text_color,
          nps_email_button_color, nps_email_button_text_color,
          nps_email_signoff, nps_email_signoff_name,
          nps_email_footer_link_1_text, nps_email_footer_link_1_url,
          nps_email_footer_link_2_text, nps_email_footer_link_2_url,
          nps_email_footer_link_3_text, nps_email_footer_link_3_url
        )
      `)
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
        const customerName = submission.customer_name || "there";
        const npsQuestion =
          submission.venues.nps_question ||
          "How likely are you to recommend us to a friend or colleague?";

        // Get customizable email content with defaults and placeholder replacement
        const emailSubject = (submission.venues.nps_email_subject || "How was your visit to {venue_name}?")
          .replace(/{venue_name}/g, venueName)
          .replace(/{customer_name}/g, customerName);
        const emailGreeting = (submission.venues.nps_email_greeting || "Thank you for visiting {venue_name}!")
          .replace(/{venue_name}/g, venueName)
          .replace(/{customer_name}/g, customerName);
        const emailBody = (submission.venues.nps_email_body || "We hope you had a great experience. We'd love to hear your feedback.")
          .replace(/{venue_name}/g, venueName)
          .replace(/{customer_name}/g, customerName);
        const emailButtonText = submission.venues.nps_email_button_text || "Rate Your Experience";

        // Get color settings with defaults
        const backgroundColor = submission.venues.nps_email_background_color || "#f5f5dc";
        const cardColor = submission.venues.nps_email_card_color || "#ffffff";
        const textColor = submission.venues.nps_email_text_color || "#111827";
        const buttonColor = submission.venues.nps_email_button_color || submission.venues.primary_color || "#4E74FF";
        const buttonTextColor = submission.venues.nps_email_button_text_color || "#ffffff";

        // Get sign-off settings
        const signoff = submission.venues.nps_email_signoff || "Thank you";
        const signoffName = submission.venues.nps_email_signoff_name || "";

        // Build navigation links HTML
        const navLinks: { text: string; url: string }[] = [];
        if (submission.venues.nps_email_nav_link_1_text && submission.venues.nps_email_nav_link_1_url) {
          navLinks.push({ text: submission.venues.nps_email_nav_link_1_text, url: submission.venues.nps_email_nav_link_1_url });
        }
        if (submission.venues.nps_email_nav_link_2_text && submission.venues.nps_email_nav_link_2_url) {
          navLinks.push({ text: submission.venues.nps_email_nav_link_2_text, url: submission.venues.nps_email_nav_link_2_url });
        }
        if (submission.venues.nps_email_nav_link_3_text && submission.venues.nps_email_nav_link_3_url) {
          navLinks.push({ text: submission.venues.nps_email_nav_link_3_text, url: submission.venues.nps_email_nav_link_3_url });
        }

        const navLinksHtml = navLinks.length > 0 ? `
          <tr>
            <td style="background-color: ${cardColor}; padding: 12px 20px; text-align: center;">
              ${navLinks.map(link => `
                <a href="${link.url}" style="color: ${textColor}; text-decoration: none; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 12px;">
                  ${link.text}
                </a>
              `).join('')}
            </td>
          </tr>
        ` : '';

        // Build footer links HTML
        const footerLinks: { text: string; url: string }[] = [];
        if (submission.venues.nps_email_footer_link_1_text && submission.venues.nps_email_footer_link_1_url) {
          footerLinks.push({ text: submission.venues.nps_email_footer_link_1_text, url: submission.venues.nps_email_footer_link_1_url });
        }
        if (submission.venues.nps_email_footer_link_2_text && submission.venues.nps_email_footer_link_2_url) {
          footerLinks.push({ text: submission.venues.nps_email_footer_link_2_text, url: submission.venues.nps_email_footer_link_2_url });
        }
        if (submission.venues.nps_email_footer_link_3_text && submission.venues.nps_email_footer_link_3_url) {
          footerLinks.push({ text: submission.venues.nps_email_footer_link_3_text, url: submission.venues.nps_email_footer_link_3_url });
        }

        const footerLinksHtml = footerLinks.length > 0 ? `
          <p style="margin: 8px 0 0 0;">
            ${footerLinks.map((link, index) => `
              <a href="${link.url}" style="color: #6b7280; text-decoration: underline; font-size: 12px;">${link.text}</a>${index < footerLinks.length - 1 ? ' <span style="color: #d1d5db;">|</span> ' : ''}
            `).join('')}
          </p>
        ` : '';

        // Build header image HTML
        const headerImageHtml = submission.venues.nps_email_header_image ? `
          <tr>
            <td style="padding: 0;">
              <img src="${submission.venues.nps_email_header_image}" alt="" style="width: 100%; height: auto; display: block; border-radius: 8px 8px 0 0;">
            </td>
          </tr>
        ` : '';

        // Build sign-off HTML
        const signoffHtml = signoff || signoffName ? `
          <div style="margin-top: 24px;">
            ${signoff ? `<p style="font-size: 15px; color: ${textColor}; margin: 0;">${signoff}${signoffName ? ',' : ''}</p>` : ''}
            ${signoffName ? `<p style="font-size: 15px; color: ${textColor}; margin: 4px 0 0 0; font-weight: 600;">${signoffName}</p>` : ''}
          </div>
        ` : '';

        // Process body text to support multiple paragraphs
        const bodyParagraphs = emailBody.split('\n').filter(p => p.trim()).map(p =>
          `<p style="font-size: 15px; color: ${textColor}; line-height: 1.6; margin: 0 0 16px 0;">${p}</p>`
        ).join('');

        // Create email HTML - table-based layout for mobile email client compatibility
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We'd love your feedback</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: ${backgroundColor}; font-family: Arial, Helvetica, sans-serif;">
  <!-- Email Container -->
  <table cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: ${cardColor}; border-radius: 8px; overflow: hidden;">
    <tbody>
      <!-- Header Image -->
      ${headerImageHtml}

      <!-- Navigation Links -->
      ${navLinksHtml}

      <!-- Logo Header -->
      <tr>
        <td style="padding: 24px 20px; border-bottom: 1px solid #e5e7eb;">
          <table cellpadding="0" cellspacing="0" style="width: 100%;">
            <tbody>
              <tr>
                ${submission.venues.logo ? `
                <td style="width: 50px; vertical-align: middle;">
                  <img src="${submission.venues.logo}" alt="${venueName}" style="height: 40px; width: auto; display: block;">
                </td>
                ` : ''}
                <td style="vertical-align: middle; text-align: ${submission.venues.logo ? 'right' : 'left'}; font-size: 18px; font-weight: 600; color: ${textColor};">
                  ${venueName}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>

      <!-- Main Content -->
      <tr>
        <td style="padding: 32px 20px;">
          <h1 style="color: ${textColor}; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">
            ${emailGreeting}
          </h1>

          ${bodyParagraphs}

          <!-- Question -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
            <p style="font-size: 16px; font-weight: 600; color: ${textColor}; margin: 0; line-height: 1.4;">
              ${npsQuestion}
            </p>
          </div>

          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" style="width: 100%;">
            <tbody>
              <tr>
                <td style="text-align: center; padding-bottom: 16px;">
                  <a href="${npsUrl}" style="display: inline-block; background-color: ${buttonColor}; color: ${buttonTextColor}; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                    ${emailButtonText}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">
            Takes less than 30 seconds
          </p>

          <!-- Sign-off -->
          ${signoffHtml}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
          <p style="text-align: center; font-size: 12px; color: #6b7280; margin: 0;">
            ${venueName} &copy; ${new Date().getFullYear()}
          </p>
          ${footerLinksHtml ? `<div style="text-align: center;">${footerLinksHtml}</div>` : ''}
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin: 12px 0 0 0; line-height: 1.6;">
            You're receiving this because you recently visited ${venueName}.<br>
            <a href="${npsUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Powered by footer -->
  <p style="text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af;">
    Powered by Chatters
  </p>
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
            subject: emailSubject,
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
