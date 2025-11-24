import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Demo account ID
const DEMO_ACCOUNT_ID = "af1d9502-a1a9-4873-8776-9b7177ed30c3";

// Feedback templates
const feedbackTemplates = {
  positive: [
    "Absolutely fantastic experience! The food was delicious and the service was top-notch.",
    "Had a wonderful time here. Great atmosphere and friendly staff.",
    "Excellent meal, everything was perfect. Highly recommend!",
    "Best pub food I've had in ages. Will definitely be back!",
    "Lovely venue, great drinks selection, and the staff were amazing.",
    "Perfect spot for a Sunday roast. Everything was cooked to perfection.",
    "Really enjoyed our visit. Staff were particularly helpful.",
    "Great value for money and the portions were generous.",
    "Beautiful setting and the food exceeded expectations.",
    "Couldn't fault anything. From start to finish, it was brilliant.",
    "The atmosphere was perfect and our server was so attentive.",
    "Wonderful experience, will definitely recommend to friends.",
    "Such a gem! Food was superb and service was impeccable.",
    "Loved every minute. The team here really know what they're doing.",
    "Outstanding! One of the best meals I've had this year."
  ],
  neutral: [
    "Nice place, food was good. Service could be a bit faster.",
    "Decent experience overall. Would come back.",
    "Good atmosphere, standard pub fare. Nothing special but nothing bad.",
    "Solid meal, reasonably priced. Busy but that's expected.",
    "Pleasant enough. The food was okay, maybe a bit hit and miss.",
    "Average experience. Food was fine, service was okay.",
    "Not bad for a quick bite. Would prefer more vegetarian options.",
    "Acceptable. Nothing to complain about but nothing remarkable either.",
    "Food was tasty but took a while to arrive.",
    "Good location, decent food. Could improve on presentation."
  ],
  negative: [
    "Disappointing experience. Food took ages to arrive and wasn't even hot.",
    "Not impressed. The service was slow and the food was mediocre.",
    "Expected better. The place was busy and staff seemed rushed.",
    "Overpriced for what you get. Won't be rushing back.",
    "Poor experience. Very disappointing given the reviews.",
    "Food was cold when it arrived. Had to send it back.",
    "Waited 45 minutes for our food, then it was wrong order.",
    "Not up to standard. The quality has really gone downhill."
  ]
};

// Generate random time between 11am and 10pm for a given date
function getRandomTimeInRange(date: Date): Date {
  const result = new Date(date);
  // Random hour between 11 (11am) and 22 (10pm)
  const hour = 11 + Math.floor(Math.random() * 11);
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  result.setHours(hour, minute, second, 0);
  return result;
}

// Get yesterday's date
function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const yesterday = getYesterday();
    console.log(`Generating demo data for: ${yesterday.toISOString().split('T')[0]}`);

    // Get all venues for the demo account
    const { data: venues, error: venuesError } = await supabase
      .from("venues")
      .select("id, name")
      .eq("account_id", DEMO_ACCOUNT_ID);

    if (venuesError) {
      throw new Error(`Failed to fetch venues: ${venuesError.message}`);
    }

    if (!venues || venues.length === 0) {
      return new Response(
        JSON.stringify({ error: "No demo venues found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${venues.length} demo venues`);

    const results = {
      venues: venues.length,
      feedbackCreated: 0,
      feedbackResolved: 0,
      npsCreated: 0,
    };

    for (const venue of venues) {
      console.log(`Processing venue: ${venue.name}`);

      // Get employees for this venue
      const { data: employees } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("venue_id", venue.id);

      // Get staff members for resolving feedback
      const { data: staffMembers } = await supabase
        .from("staff")
        .select("user_id")
        .eq("venue_id", venue.id);

      const staffIds = staffMembers?.map(s => s.user_id) || [];

      // Get questions for this venue
      const { data: questions } = await supabase
        .from("questions")
        .select("id")
        .eq("venue_id", venue.id);

      const questionIds = questions?.map(q => q.id) || [];

      // ========== GENERATE FEEDBACK ==========
      // Each feedback submission simulates a customer visit (session) with ~30 feedback entries per day
      const sessionCount = 18 + Math.floor(Math.random() * 5); // 18-22 sessions per venue

      for (let i = 0; i < sessionCount; i++) {
        const timestamp = getRandomTimeInRange(yesterday);
        const tableNumber = Math.floor(Math.random() * 20) + 1;

        // Create a feedback session first
        const sessionId = crypto.randomUUID();
        const { error: sessionError } = await supabase
          .from("feedback_sessions")
          .insert({
            id: sessionId,
            venue_id: venue.id,
            table_number: tableNumber,
            started_at: timestamp.toISOString(),
          });

        if (sessionError) {
          console.error(`Error creating session:`, sessionError.message);
          continue;
        }

        // Realistic distribution: 65% positive, 25% neutral, 10% negative
        const rand = Math.random();
        let rating: number;
        let templates: string[];

        if (rand < 0.65) {
          rating = Math.random() < 0.6 ? 5 : 4;
          templates = feedbackTemplates.positive;
        } else if (rand < 0.90) {
          rating = 3;
          templates = feedbackTemplates.neutral;
        } else {
          rating = Math.random() < 0.5 ? 2 : 1;
          templates = feedbackTemplates.negative;
        }

        // 60% chance of having a comment
        const hasComment = Math.random() < 0.6;
        const feedbackText = hasComment
          ? templates[Math.floor(Math.random() * templates.length)]
          : null;

        const record: Record<string, unknown> = {
          venue_id: venue.id,
          session_id: sessionId,
          rating: rating,
          additional_feedback: feedbackText,
          table_number: tableNumber,
          created_at: timestamp.toISOString(),
        };

        // Randomly assign a question if available
        if (questionIds.length > 0 && Math.random() < 0.7) {
          record.question_id = questionIds[Math.floor(Math.random() * questionIds.length)];
        }

        // Randomly assign an employee if available
        if (employees && employees.length > 0 && Math.random() < 0.5) {
          record.employee_id = employees[Math.floor(Math.random() * employees.length)].id;
        }

        // Insert feedback
        const { error: feedbackError } = await supabase
          .from("feedback")
          .insert(record);

        if (feedbackError) {
          console.error(`Error inserting feedback for ${venue.name}:`, feedbackError.message);
        } else {
          results.feedbackCreated++;
        }
      }

      console.log(`  Created ${results.feedbackCreated} feedback entries for ${venue.name}`);

      // ========== RESOLVE OLD FEEDBACK ==========
      // Get unacknowledged feedback from previous days (not today's)
      const { data: unresolvedFeedback } = await supabase
        .from("feedback")
        .select("id, created_at")
        .eq("venue_id", venue.id)
        .is("acknowledged_at", null)
        .lt("created_at", yesterday.toISOString())
        .order("created_at", { ascending: true })
        .limit(50);

      if (unresolvedFeedback && unresolvedFeedback.length > 0 && staffIds.length > 0) {
        // Resolve ~85% of unresolved feedback
        const toResolve = unresolvedFeedback.filter(() => Math.random() < 0.85);

        for (const feedback of toResolve) {
          const resolvedBy = staffIds[Math.floor(Math.random() * staffIds.length)];
          const feedbackDate = new Date(feedback.created_at);
          // Resolve within 1-48 hours of creation
          const resolveTime = new Date(feedbackDate.getTime() + (1 + Math.random() * 47) * 60 * 60 * 1000);

          await supabase
            .from("feedback")
            .update({
              acknowledged_at: resolveTime.toISOString(),
              acknowledged_by: resolvedBy,
            })
            .eq("id", feedback.id);

          results.feedbackResolved++;
        }
        console.log(`  Resolved ${toResolve.length} old feedback entries`);
      }

      // ========== GENERATE NPS SUBMISSIONS ==========
      const npsCount = 4 + Math.floor(Math.random() * 3); // 4-6 per venue
      const npsRecords = [];

      for (let i = 0; i < npsCount; i++) {
        const timestamp = getRandomTimeInRange(yesterday);

        // NPS distribution: 50% promoters (9-10), 30% passives (7-8), 20% detractors (0-6)
        const rand = Math.random();
        let score: number;

        if (rand < 0.50) {
          score = Math.random() < 0.6 ? 10 : 9;
        } else if (rand < 0.80) {
          score = Math.random() < 0.5 ? 8 : 7;
        } else {
          score = Math.floor(Math.random() * 7); // 0-6
        }

        // Generate fake email
        const fakeEmail = `demo_customer_${Date.now()}_${i}@example.com`;

        npsRecords.push({
          venue_id: venue.id,
          customer_email: fakeEmail,
          scheduled_send_at: new Date(timestamp.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Scheduled day before
          sent_at: new Date(timestamp.getTime() - 23 * 60 * 60 * 1000).toISOString(), // Sent shortly after
          score: score,
          responded_at: timestamp.toISOString(),
          created_at: new Date(timestamp.getTime() - 25 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Insert NPS submissions
      const { error: npsError } = await supabase
        .from("nps_submissions")
        .insert(npsRecords);

      if (npsError) {
        console.error(`Error inserting NPS for ${venue.name}:`, npsError.message);
      } else {
        results.npsCreated += npsRecords.length;
        console.log(`  Created ${npsRecords.length} NPS submissions`);
      }
    }

    console.log("Demo data generation complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        date: yesterday.toISOString().split('T')[0],
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating demo data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
