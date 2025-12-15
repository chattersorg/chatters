# Running Chatters Locally

## The Problem

You're getting a 500 error when trying to add managers because the API functions in `/api` folder require the Vercel CLI to run locally. The `react-scripts start` command only runs the React frontend, not the serverless API functions.

## Solution: Use Vercel CLI for Local Development

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Link Your Project

```bash
vercel link
```

Follow the prompts to link to your Vercel project.

### 3. Pull Environment Variables from Vercel

```bash
vercel env pull .env.local
```

This will download all your production environment variables to `.env.local`.

### 4. Run the Development Server

Instead of `npm start`, use:

```bash
vercel dev
```

This will: - Run your React app on `http://localhost:3000` - Run your API functions on `http://localhost:3000/api/*` - Load environment variables from `.env.local`

## Alternative: Add Service Role Key to Vercel

If you haven't added the `SUPABASE_SERVICE_ROLE_KEY` to your Vercel project:

1. Go to your Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add: - **Key**: `SUPABASE_SERVICE_ROLE_KEY` - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqem53cXZ3bG9vYXJza3Jvb2dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwODgwNCwiZXhwIjoyMDY2NTg0ODA0fQ.7EZdFEIzOTQm12SLq2YOQjfBR5vhiKzacUJfEiAsCEU` - **Environments**: Select Production, Preview, and Development
5. Redeploy your project

## Quick Start Commands

```bash
# Install Vercel CLI globally
npm install -g vercel

# Link to your Vercel project
vercel link

# Pull environment variables
vercel env pull

# Run local development server with API support
vercel dev
```

## Troubleshooting

### API returns 500 error (Local Development) - Make sure you're using `vercel dev` not `npm start` - Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` - Check Vercel logs: `vercel logs`

### API returns 500 error (Deployed on Vercel)
1. Check function logs in Vercel Dashboard: - Go to your Vercel project dashboard - Click on "Functions" tab - Click on the failing function (e.g., `invite-manager`) - View the error logs to see the exact error message

2. Check environment variables are set: - Go to Settings → Environment Variables - Verify `SUPABASE_SERVICE_ROLE_KEY` is set for all environments - If you just added it, redeploy the project

3. Common issues: - Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable - RLS policies blocking the service role - Invalid token in Authorization header - Database table structure mismatch

### "Cannot find module" errors - Run `npm install` to install dependencies - Make sure all required packages are in `package.json`

### Environment variables not loading - Use `vercel env pull` to sync from Vercel - Check `.env.local` exists and has the correct values - Restart `vercel dev` after changing environment variables

## Current Environment Files - `.env` - Local development (git ignored) - `.env.local` - Vercel local development (git ignored, synced with `vercel env pull`) - `.env.production` - Production variables (committed to git)

## Required Environment Variables for API Functions

```
REACT_APP_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY (for payment APIs)
```
