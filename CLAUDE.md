# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands - `npm start` or `npm run dev`: Start development server - `npm run build`: Build for production - `npm test`: Run tests

## Project Architecture

This is a React SaaS application for hospitality venue feedback management called "Chatters". The app serves two distinct domains: - Marketing site: Main domain (getchatters.com) - Dashboard app: Subdomain (my.getchatters.com)

### Domain-Based Routing

The application uses domain detection in `App.js:26` to serve different content: - `window.location.hostname.startsWith('my.')` → Dashboard app (`AppRoutes`) - Other domains → Marketing site (`MarketingRoutes`)

### Authentication & Authorization

The app has three user roles managed through Supabase: - `admin`: Full system access, bypasses VenueContext - `master`: Account owners, can access multiple venues - `manager`: Venue-specific access through staff table

Role detection happens in `AppRoutes.js:14-31` with automatic redirection based on user role.

### State Management - **VenueContext** (`src/context/VenueContext.js`): Core venue selection and user role management - Automatically resolves user's accessible venues based on role - Handles venue switching with localStorage persistence - **Important**: Admin users should never mount VenueContext (see line 42) - **ModalContext** (`src/context/ModalContext.js`): Global modal state management

### Key Architecture Patterns

1. **Role-based component rendering**: Many components check `userRole` from VenueContext
2. **Venue-scoped data**: Most API calls are scoped to the current `venueId`
3. **Staff membership resolution**: Managers access venues through the `staff` table relationship
4. **Admin isolation**: Admin users have separate routing and never load venue context

### Database Integration

Uses Supabase with key tables: - `users`: User authentication and role assignment - `venues`: Venue information linked to accounts - `staff`: Many-to-many relationship between users and venues - `accounts`: Top-level account grouping for venues

### UI Components - **Tailwind CSS** with custom font configuration (Geist, Gilroy) - **Radix UI** components for dropdowns, popovers, modals - **Chart.js** and **Recharts** for data visualization - **Ant Design** components for some UI elements - **shadcn/ui** components in `src/components/ui/`

### File Organization - `src/pages/`: Page components, organized by feature area - `src/components/`: Reusable components, organized by domain (dashboard, reports, settings, etc.) - `src/utils/supabase.js`: Supabase client configuration - `api/`: Serverless functions for Stripe webhooks and admin operations

### Environment Variables

The app requires Supabase configuration: - `REACT_APP_SUPABASE_URL` - `REACT_APP_SUPABASE_ANON_KEY`

### Analytics & Monitoring - **Sentry** error tracking configured in `App.js:13-18` - **Vercel Analytics** and **Speed Insights** integrated

## Important Development Notes - Always check user role before rendering admin-specific features - Venue switching requires updating localStorage and triggering context refresh - Admin routes are completely separate from venue-scoped routes - The `staff` table is the source of truth for manager venue access