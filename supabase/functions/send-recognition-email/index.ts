// supabase/functions/send-recognition-email/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

function generateRecognitionEmail(
  employeeName: string,
  managerName: string,
  venueName: string,
  stats: {
    rank: number;
    feedbackResolved: number;
    assistanceResolved: number;
    totalResolved: number;
    period: string;
  },
  personalMessage?: string
): string {
  const rankSuffix = stats.rank === 1 ? 'st' : stats.rank === 2 ? 'nd' : stats.rank === 3 ? 'rd' : 'th';
  const medalEmoji = stats.rank === 1 ? '🥇' : stats.rank === 2 ? '🥈' : stats.rank === 3 ? '🥉' : '🏆';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Outstanding Performance Recognition</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;" align="center">
        <!-- Main Container -->
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 32px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 16px;">${medalEmoji}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.2;">
                Outstanding Performance!
              </h1>
              <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 16px;">
                You're making a real difference
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi <strong>${employeeName}</strong>,
              </p>

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                We're thrilled to recognize your exceptional performance! You ranked <strong>${stats.rank}${rankSuffix}</strong> on the team leaderboard for ${stats.period.toLowerCase()}.
              </p>

              <!-- Stats Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); border-radius: 12px; margin-bottom: 24px; border: 2px solid #10b981;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px 0; color: #065f46; font-size: 18px; font-weight: 600; text-align: center;">
                      Your Performance Stats
                    </h2>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px; text-align: center; border-right: 1px solid #10b981;">
                          <div style="font-size: 32px; font-weight: 700; color: #065f46;">${stats.feedbackResolved}</div>
                          <div style="font-size: 12px; color: #047857; margin-top: 4px;">Feedback Resolved</div>
                        </td>
                        <td style="padding: 8px; text-align: center; border-right: 1px solid #10b981;">
                          <div style="font-size: 32px; font-weight: 700; color: #065f46;">${stats.assistanceResolved}</div>
                          <div style="font-size: 12px; color: #047857; margin-top: 4px;">Assistance Requests</div>
                        </td>
                        <td style="padding: 8px; text-align: center;">
                          <div style="font-size: 32px; font-weight: 700; color: #065f46;">${stats.totalResolved}</div>
                          <div style="font-size: 12px; color: #047857; margin-top: 4px;">Total Resolved</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${personalMessage ? `
              <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px 20px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6; font-style: italic;">
                  "${personalMessage}"
                </p>
                <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">
                  — ${managerName}
                </p>
              </div>
              ` : ''}

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Your dedication to resolving customer concerns and helping guests have an exceptional experience doesn't go unnoticed. Keep up the amazing work!
              </p>

              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for being an essential part of the ${venueName} team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #000000; padding: 32px; text-align: center;">
              <img src="https://getchatters.com/img/logo/chatters-logo-white-2025.svg" alt="Chatters" style="height: 20px; margin-bottom: 16px;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                This recognition was sent via Chatters
              </p>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
                ${venueName}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (!resendKey) {
      console.error('RESEND_API_KEY is not set');
      return new Response(
        JSON.stringify({ success: false, message: 'RESEND_API_KEY environment variable is not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables not set');
      return new Response(
        JSON.stringify({ success: false, message: 'Supabase environment variables are not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      employeeId,
      employeeEmail,
      employeeName,
      managerName,
      venueName,
      stats,
      personalMessage
    } = await req.json();

    // Validate required fields
    if (!employeeEmail || !employeeName || !managerName || !venueName || !stats) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate the email HTML
    const emailHtml = generateRecognitionEmail(
      employeeName,
      managerName,
      venueName,
      stats,
      personalMessage
    );

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Chatters <noreply@getchatters.com>',
        to: [employeeEmail],
        subject: `🎉 Congratulations on your outstanding performance, ${employeeName.split(' ')[0]}!`,
        html: emailHtml
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailData = await emailResponse.json();
    console.log('Recognition email sent successfully:', emailData);

    // Optional: Log recognition in database for tracking
    if (employeeId) {
      const { error: logError } = await supabase.from('staff_recognitions').insert({
        employee_id: employeeId,
        manager_name: managerName,
        venue_name: venueName,
        rank: stats.rank,
        period: stats.period,
        total_resolved: stats.totalResolved,
        personal_message: personalMessage,
        sent_at: new Date().toISOString()
      });

      if (logError) {
        // Don't fail if logging fails - recognition table might not exist yet
        console.log('Note: Could not log recognition (table may not exist):', logError.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Recognition email sent successfully',
        emailId: emailData.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending recognition email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
