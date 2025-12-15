# Development Setup

## Prerequisites - **Node.js**: v18 or higher - **npm**: v8 or higher - **Git**: Latest version - **Supabase Account**: For database access - **Stripe Account**: For payment testing

## Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/chatters.git
cd chatters
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create `.env.local` file in the root directory:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration (use test keys)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_STRIPE_PRICE_MONTHLY=price_test_monthly_id
REACT_APP_STRIPE_PRICE_YEARLY=price_test_yearly_id

# Optional: Analytics (leave empty for development)
REACT_APP_GTM_ID=
REACT_APP_SENTRY_DSN=
```

### 4. Database Setup

#### Using Existing Supabase Project
1. Get credentials from [Supabase Dashboard](https://supabase.com/dashboard)
2. Add your local machine IP to allowed origins
3. Ensure RLS policies are properly configured

#### Setting Up New Supabase Project
1. Create new project at [Supabase](https://supabase.com)
2. Run migration scripts (if available)
3. Set up RLS policies according to [Database Schema](./database-schema.md)

### 5. Stripe Setup

#### Test Mode Configuration
1. Create [Stripe account](https://stripe.com) (or use existing)
2. Switch to Test mode in Stripe Dashboard
3. Create test products and prices: - Monthly subscription product - Yearly subscription product
4. Copy price IDs to environment variables
5. Set up test webhooks pointing to your local development server

## Development Commands

### Start Development Server
```bash
npm start
# or
npm run dev
```

Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
```

Creates optimized production build in `build/` folder.

### Run Tests
```bash
npm test
```

Launches test runner in interactive watch mode.

### Lint Code
```bash
npm run lint
```

Runs ESLint to check code quality and style.

### Type Check
```bash
npm run typecheck
```

Runs TypeScript compiler to check for type errors.

## Local Development Workflow

### 1. Domain Routing Setup

The app uses domain-based routing. For local development:

#### Main App (Dashboard) - URL: `http://localhost:3000` - Add this to your hosts file to simulate subdomain:
```bash
# /etc/hosts (macOS/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 my.localhost
``` - Access at: `http://my.localhost:3000`

#### Marketing Site - URL: `http://localhost:3000` (without subdomain) - This will show marketing pages

### 2. Authentication Flow

#### Test User Creation
1. Use Supabase Auth UI or create users via dashboard
2. Assign appropriate roles in `users` table: - `admin`: Full system access - `master`: Account owner - `manager`: Venue-specific access

#### Role Testing
```javascript
// Test different user roles by updating database
UPDATE users SET role = 'master' WHERE email = 'your-test-email@example.com';
```

### 3. Database Development

#### Local Data Seeding
Create test data for development:

```sql
-- Insert test account
INSERT INTO accounts (id, trial_ends_at, is_paid) 
VALUES ('test-account-id', NOW() + INTERVAL '30 days', false);

-- Insert test venue
INSERT INTO venues (id, name, account_id) 
VALUES ('test-venue-id', 'Test Restaurant', 'test-account-id');

-- Insert test questions
INSERT INTO questions (venue_id, question, order_index) VALUES 
('test-venue-id', 'How was your food?', 1),
('test-venue-id', 'How was the service?', 2);
```

#### Database Migrations
When schema changes are needed:
1. Update tables in Supabase dashboard
2. Document changes in [Database Schema](./database-schema.md)
3. Create migration scripts for production deployment

### 4. Testing Payments

#### Stripe Test Mode
Use test card numbers: - **Success**: `4242 4242 4242 4242` - **Decline**: `4000 0000 0000 0002` - **Authentication Required**: `4000 0025 0000 3155`

Any future date and CVC will work with test cards.

#### Webhook Testing
```bash
# Install Stripe CLI
stripe login
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## IDE Configuration

### VS Code Setup

#### Recommended Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "html": "HTML"
  }
}
```

### Prettier Configuration
```javascript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Debugging

### React DevTools
Install [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) browser extension.

### Supabase Debugging
```javascript
// Enable debug mode
const supabase = createClient(url, key, {
  debug: process.env.NODE_ENV === 'development'
});

// Log all queries
supabase.from('table').select().then(console.log);
```

### Network Debugging - Use browser DevTools Network tab - Monitor Supabase requests in real-time - Check for CORS issues with local development

## Common Issues

### 1. Supabase Connection Issues
```bash
# Check if Supabase URL is accessible
curl https://your-project.supabase.co/rest/v1/
```

**Solutions**: - Verify environment variables - Check Supabase project status - Ensure IP allowlist includes your development machine

### 2. Authentication Failures
```javascript
// Debug auth state
supabase.auth.getSession().then(console.log);
supabase.auth.getUser().then(console.log);
```

**Solutions**: - Clear localStorage and cookies - Check user exists in `users` table - Verify role assignment

### 3. RLS Policy Issues
```sql
-- Test RLS policies
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-id-here"}';
SELECT * FROM venues; -- Should only show user's venues
```

**Solutions**: - Verify RLS policies are enabled - Check policy conditions match user context - Test with different user roles

### 4. Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React build cache
rm -rf build/
npm run build
```

## Performance Optimization

### Development Performance
```javascript
// .env.local for faster development
GENERATE_SOURCEMAP=false
REACT_APP_DISABLE_SERVICE_WORKER=true
```

### Bundle Analysis
```bash
# Analyze bundle size
npm install -g source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

## Hot Reloading

### Fast Refresh
React 18's Fast Refresh is enabled by default. To troubleshoot:

```javascript
// Add to component for debugging
if (module.hot) {
  module.hot.accept();
}
```

### Manual Refresh Triggers - Save any file to trigger reload - CSS changes apply instantly - Component state is preserved when possible

---

*This setup provides a complete development environment with proper debugging tools and testing capabilities.*