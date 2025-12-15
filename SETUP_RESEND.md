# Setting Up Resend for Manager Invitation Emails

The manager invitation system now sends emails via Resend when managers are invited.

## Setup Steps

### 1. Get Your Resend API Key

1. Go to [resend.com](https://resend.com) and sign up/login
2. Navigate to **API Keys** in the dashboard
3. Click **Create API Key**
4. Give it a name like "Chatters Manager Invitations"
5. Copy the API key (starts with `re_`)

### 2. Add API Key to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your Chatters project
3. Go to **Settings** → **Environment Variables**
4. Add a new environment variable: - **Key**: `RESEND_API_KEY` - **Value**: Your Resend API key (e.g., `re_xxxxxxxxxxxxx`) - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**
6. Redeploy your project for the changes to take effect

### 3. Configure Sender Domain (Optional but Recommended)

To send emails from your own domain instead of `noreply@getchatters.com`:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `getchatters.com`)
4. Follow the DNS setup instructions to verify your domain
5. Once verified, update the `from` field in `/api/admin/invite-manager.js` to use your domain

### 4. Test the Invitation Flow

1. Go to your dashboard → Staff → Managers
2. Click "Add Manager"
3. Fill in the details and submit
4. The manager should receive an email with an invitation link
5. Check Resend dashboard to see email delivery status

## Email Template

The invitation email includes: - Personalized greeting with manager's first name - Who invited them - Which venues they'll have access to - A clear "Accept Invitation" button - Link expiration notice (7 days) - Plain text fallback link

## Troubleshooting

### Emails not sending

Check Vercel function logs:
1. Go to Vercel Dashboard → Functions
2. Click on `invite-manager` function
3. Look for logs saying "Invitation email sent" or error messages

### "RESEND_API_KEY not set" warning

This means the environment variable isn't configured in Vercel. Follow step 2 above.

### Emails going to spam

1. Verify your domain in Resend (step 3 above)
2. Set up SPF, DKIM, and DMARC records as instructed by Resend
3. Use a verified domain instead of the default sender

## Environment Variables

Required for email sending:
```
RESEND_API_KEY=re_your_api_key_here
```

Optional (for custom sender domain):
```
NEXT_PUBLIC_APP_URL=https://my.getchatters.com
```

## Cost

Resend pricing: - **Free tier**: 3,000 emails/month - **Pro tier**: $20/month for 50,000 emails

For typical usage (a few manager invitations per day), the free tier should be sufficient.
