const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const Stripe = require('stripe');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    firstName,
    lastName,
    email,
    companyName,
    phone,
    accountPhone,
    billingEmail,
    startTrial,
    trialDays,
    venues
  } = req.body;

  if (!firstName || !lastName || !email || !companyName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Calculate trial end date
    let trialEndsAt = null;
    if (startTrial && trialDays) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + parseInt(trialDays));
      trialEndsAt = trialEnd.toISOString();
    }

    // Create Stripe customer first
    const customerEmail = billingEmail || email.toLowerCase();
    let stripeCustomerId = null;

    try {
      const stripeCustomer = await stripe.customers.create({
        email: customerEmail,
        name: companyName,
        phone: accountPhone || phone || null,
        metadata: {
          source: 'admin_created',
          master_user_email: email.toLowerCase(),
          master_user_name: `${firstName} ${lastName}`
        }
      });
      stripeCustomerId = stripeCustomer.id;
      console.log('Stripe customer created:', stripeCustomerId);
    } catch (stripeError) {
      console.error('Failed to create Stripe customer:', stripeError);
      // Continue without Stripe customer - can be created later
    }

    // Create account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: companyName,
        phone: accountPhone || phone || null,
        billing_email: customerEmail,
        is_paid: false,
        trial_ends_at: trialEndsAt,
        demo_account: false,
        stripe_customer_id: stripeCustomerId
      })
      .select()
      .single();

    if (accountError) throw accountError;

    // Create user (without password - they'll set it via invitation)
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: 'master',
        account_id: account.id
      })
      .select()
      .single();

    if (userError) throw userError;

    // Create venues if provided
    let createdVenues = [];
    if (venues && venues.length > 0) {
      for (const venue of venues) {
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .insert({
            account_id: account.id,
            name: venue.name,
            venue_type: venue.type || null,
            table_count: venue.table_count || 1,
            address: venue.address || null,
            primary_color: '#000000',
            secondary_color: '#ffffff'
          })
          .select()
          .single();

        if (venueError) {
          console.error('Error creating venue:', venueError);
          continue;
        }

        createdVenues.push(venueData);

        // Create feedback questions if provided
        if (venue.questions && venue.questions.length > 0) {
          const questionsToInsert = venue.questions.map((q, index) => ({
            venue_id: venueData.id,
            question_text: q.question,
            question_type: q.type || 'rating',
            order_index: index,
            is_active: true
          }));

          const { error: questionsError } = await supabase
            .from('feedback_questions')
            .insert(questionsToInsert);

          if (questionsError) {
            console.error('Error creating questions:', questionsError);
          }
        }

        // Generate QR codes for tables
        const tablesToInsert = [];
        for (let i = 1; i <= (venue.table_count || 1); i++) {
          tablesToInsert.push({
            venue_id: venueData.id,
            table_number: i.toString(),
            qr_code: `${venueData.id}-${i}`
          });
        }

        if (tablesToInsert.length > 0) {
          const { error: tablesError } = await supabase
            .from('tables')
            .insert(tablesToInsert);

          if (tablesError) {
            console.error('Error creating tables:', tablesError);
          }
        }
      }
    }

    // Generate invitation token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Store invitation (reuse manager_invitations table for simplicity)
    const { error: invitationError } = await supabase
      .from('manager_invitations')
      .insert({
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        invited_by: null, // Admin created
        account_id: account.id,
        venue_ids: [], // Master users don't need specific venue access
        token: token,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });

    if (invitationError) throw invitationError;

    // Send invitation email
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://my.getchatters.com'}/set-password?token=${token}`;

    try {
      await resend.emails.send({
        from: 'Chatters <noreply@getchatters.com>',
        to: email,
        subject: 'Welcome to Chatters - Set Your Password',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to Chatters</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Chatters!</h1>
              </div>

              <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Hi ${firstName},</h2>

                <p style="color: #6b7280; font-size: 16px; margin: 20px 0;">
                  Your Chatters account has been created for <strong>${companyName}</strong>. You're all set to start collecting customer feedback and improving your venue's experience!
                </p>

                ${startTrial ? `
                  <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">
                      <strong>Trial Period:</strong> Your ${trialDays}-day trial has been activated and expires on ${new Date(trialEndsAt).toLocaleDateString()}.
                    </p>
                  </div>
                ` : ''}

                <p style="color: #6b7280; font-size: 16px; margin: 20px 0;">
                  Click the button below to set your password and access your dashboard:
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationUrl}"
                     style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Set Your Password
                  </a>
                </div>

                <p style="color: #9ca3af; font-size: 14px; margin: 20px 0;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${invitationUrl}" style="color: #10b981; word-break: break-all;">${invitationUrl}</a>
                </p>

                <p style="color: #9ca3af; font-size: 14px; margin: 20px 0;">
                  This invitation link will expire in 7 days.
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <p style="color: #6b7280; font-size: 14px; margin: 10px 0;">
                  Need help getting started? Check out our <a href="https://chatters.canny.io/changelog" style="color: #10b981; text-decoration: none;">documentation</a> or reply to this email.
                </p>

                <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0;">
                  Best regards,<br>
                  The Chatters Team
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                <p>
                  © ${new Date().getFullYear()} Chatters. All rights reserved.<br>
                  <a href="https://getchatters.com" style="color: #10b981; text-decoration: none;">getchatters.com</a>
                </p>
              </div>
            </body>
          </html>
        `
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      success: true,
      message: 'Account created successfully',
      account: {
        id: account.id,
        name: account.name,
        stripe_customer_id: stripeCustomerId
      },
      user: {
        id: user.id,
        email: user.email
      },
      venues: createdVenues.map(v => ({
        id: v.id,
        name: v.name
      }))
    });

  } catch (error) {
    console.error('Error creating account:', error);
    return res.status(500).json({
      error: 'Failed to create account',
      message: error.message
    });
  }
};

// Generate random token
function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
