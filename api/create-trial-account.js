import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Default questions based on venue type (mirrors admin create-account flow)
const DEFAULT_QUESTIONS = {
  pub: [
    { question: 'How was the quality of your drinks?', type: 'rating' },
    { question: 'How was the atmosphere?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'Was the pub clean and well-maintained?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  gastropub: [
    { question: 'How was the quality of your food?', type: 'rating' },
    { question: 'How was the quality of your drinks?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'How was the atmosphere?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  bar: [
    { question: 'How was the quality of your drinks?', type: 'rating' },
    { question: 'How was the atmosphere and music?', type: 'rating' },
    { question: 'How was the service from our bar staff?', type: 'rating' },
    { question: 'How was the cleanliness?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  cafe: [
    { question: 'How was the quality of your food and drinks?', type: 'rating' },
    { question: 'How was the service?', type: 'rating' },
    { question: 'How was the atmosphere?', type: 'rating' },
    { question: 'Was the cafe clean and comfortable?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  hotel: [
    { question: 'How was your check-in experience?', type: 'rating' },
    { question: 'How was the cleanliness of your room?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'How were the hotel facilities?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  restaurant: [
    { question: 'How was the quality of your food?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'How was the atmosphere?', type: 'rating' },
    { question: 'How was the value for money?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  fine_dining: [
    { question: 'How was the quality and presentation of your food?', type: 'rating' },
    { question: 'How was the wine and drinks selection?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'How was the overall dining experience?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  competitive_socialising: [
    { question: 'How was your activity experience?', type: 'rating' },
    { question: 'How was the quality of food and drinks?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'Was the venue clean and well-maintained?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ]
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, firstName, lastName, venueName, venueType } = req.body;

  if (!email || !password || !firstName || !lastName || !venueName || !venueType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // 2. Create auth user (use admin API to avoid changing client auth context)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true
    });
    if (authError) throw new Error(authError.message);

    // 3. Create account with trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: venueName,
        billing_email: email.toLowerCase(),
        country: 'GB',
        is_paid: false,
        trial_ends_at: trialEndsAt.toISOString(),
        demo_account: false,
        stripe_customer_id: null,
        stripe_subscription_id: null
      })
      .select()
      .single();

    if (accountError) throw new Error(accountError.message);

    // 4. Enable feedback module
    const { error: moduleError } = await supabase
      .from('account_modules')
      .insert({
        account_id: account.id,
        module_code: 'feedback',
        enabled_at: new Date().toISOString(),
        disabled_at: null,
        stripe_subscription_item_id: null
      });

    if (moduleError) {
      console.error('Error enabling feedback module:', moduleError);
    }

    // 5. Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        role: 'master',
        account_id: account.id
      });

    if (userError) throw new Error(userError.message);

    // 6. Create venue (no 'email' column in venues table)
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: venueName,
        account_id: account.id,
        table_count: 1,
        country: 'GB',
        primary_color: '#000000'
      })
      .select()
      .single();

    if (venueError) throw new Error(venueError.message);

    // 7. Create default feedback questions based on venue type
    // Table is 'questions' with columns: question, order, active, venue_id
    const defaultQuestions = DEFAULT_QUESTIONS[venueType] || DEFAULT_QUESTIONS.restaurant;
    const questionsToInsert = defaultQuestions.map((q, index) => ({
      venue_id: venue.id,
      question: q.question,
      order: index,
      active: true
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Error creating feedback questions:', questionsError);
    }

    return res.status(200).json({ message: 'Account created with trial' });
  } catch (err) {
    console.error('Trial account creation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
