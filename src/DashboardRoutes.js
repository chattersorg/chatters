import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Auth
import SignInPage from './pages/auth/SignIn';
import SignUpPage from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SetPasswordPage from './pages/auth/set-password';
import VerifyEmailChange from './pages/auth/VerifyEmailChange';

// Venue‑aware app pages
import DashboardPage from './pages/dashboard/DashboardNew';
import ManageQuestions from './pages/dashboard/ManageQuestions';
import Floorplan from './pages/dashboard/Floorplan';
import SettingsPage from './pages/dashboard/SettingsPage';
import TemplatesPage from './pages/dashboard/QRTemplates';
import ReportsPage from './pages/dashboard/ReportsPage';
import Settings_Staff from './pages/dashboard/settings_staff';
import StaffLeaderboard from './pages/dashboard/Staff_Leaderboard';
import StaffMemberDetails from './pages/dashboard/StaffMemberDetails';
import RecognitionHistory from './pages/dashboard/RecognitionHistory';
import BillingPage from './pages/dashboard/Billing';
import FeedbackFeed from './pages/dashboard/FeedbackFeed';

// New dedicated sub-pages
import ReportBuilderPage from './pages/dashboard/ReportBuilder';
import CustomerInsightsPage from './pages/dashboard/CustomerInsights';
import PerformanceDashboardPage from './pages/dashboard/PerformanceDashboard';
import StaffRolesPage from './pages/dashboard/StaffRoles';
import StaffLocationsPage from './pages/dashboard/StaffLocations';
import VenueSettingsPage from './pages/dashboard/VenueSettings';
import IntegrationsSettingsPage from './pages/dashboard/IntegrationsSettings';

// Additional new pages for updated menu structure
import FeedbackQRPage from './pages/dashboard/FeedbackQR';
import FeedbackQuestionsPage from './pages/dashboard/FeedbackQuestions';
import ReportsFeedbackPage from './pages/dashboard/ReportsFeedback';
import ReportsImpactPage from './pages/dashboard/ReportsImpact';
import ReportsMetricsPage from './pages/dashboard/ReportsMetrics';
import ReportsNPSPage from './pages/dashboard/ReportsNPS';
import StaffManagersPage from './pages/dashboard/StaffManagers';
import StaffEmployeesPage from './pages/dashboard/StaffEmployees';
import EmployeeDetail from './pages/dashboard/EmployeeDetail';
import SettingsBrandingPage from './pages/dashboard/SettingsBranding';
import AccountProfilePage from './pages/dashboard/AccountProfile';
import AccountBillingPage from './pages/dashboard/AccountBilling';
import FeedbackSettings from './pages/dashboard/FeedbackSettings';
import AllFeedback from './pages/dashboard/AllFeedback';
import CustomDashboard from './pages/dashboard/CustomDashboard';
import OverviewDetails from './pages/dashboard/OverviewDetails';
import NPSReportDetail from './pages/dashboard/NPSReportDetail';
// Full version (requires Google Business Profile API approval)
// import GoogleReviewsPage from './pages/dashboard/GoogleReviews';

// Simplified version (works without API quota)
import GoogleReviewsPage from './pages/dashboard/GoogleReviewsSimple';
import AIInsightsPage from './pages/dashboard/AIInsights';

// Kiosk (venue‑aware, no dashboard frame)
import KioskPage from './pages/dashboard/KioskPage';

// Public / guest routes (no venue context)
import CustomerFeedbackPage from './pages/dashboard/CustomerFeedback';
import FeedbackSplashPage from './pages/dashboard/FeedbackSplash';
import NPSResponsePage from './pages/dashboard/NPSResponse';

// Testing (outside venue context unless you need it)
import TestDashboardPage from './pages/admin/TestDashboardPage';

// Frames & context
import ModernDashboardFrame from './components/dashboard/layout/ModernDashboardFrame';
import { VenueProvider } from './context/VenueContext';
import SubscriptionGuard from './components/guards/SubscriptionGuard';

// Trial expired page (outside subscription guard)
import TrialExpired from './pages/dashboard/TrialExpired';

// Wrap all authenticated dashboard pages once: SubscriptionGuard + VenueProvider + ModernDashboardFrame
const DashboardShell = () => (
  <SubscriptionGuard>
    <VenueProvider>
      <ModernDashboardFrame>
        <Outlet />
      </ModernDashboardFrame>
    </VenueProvider>
  </SubscriptionGuard>
);

// Kiosk gets VenueProvider but intentionally no DashboardFrame
// Also wrapped with SubscriptionGuard
const KioskShell = () => (
  <SubscriptionGuard>
    <VenueProvider>
      <Outlet />
    </VenueProvider>
  </SubscriptionGuard>
);

const DashboardRoutes = () => {
  return (
    <Routes>
      {/* Auth (no VenueProvider, no DashboardFrame) */}
      <Route path="/signin" element={<SignInPage />} />
      {/* <Route path="/signup" element={<SignUpPage />} /> */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/verify-email-change" element={<VerifyEmailChange />} />

      {/* Trial expired page (outside subscription guard) */}
      <Route path="/trial-expired" element={<TrialExpired />} />

      {/* Public guest feedback (no venue context) */}
      <Route path="/feedback" element={<CustomerFeedbackPage />} />
      <Route path="/feedback/:venueId" element={<FeedbackSplashPage />} />
      <Route path="/feedback/:venueId/form" element={<CustomerFeedbackPage />} />
      <Route path="/nps" element={<NPSResponsePage />} />

      {/* Kiosk: venue context, no dashboard frame */}
      <Route element={<KioskShell />}>
        <Route path="/kiosk" element={<KioskPage />} />
      </Route>

      {/* Authenticated app: venue context + dashboard frame */}
      <Route element={<DashboardShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/ai-insights" element={<AIInsightsPage />} />

        {/* Multi-Venue Section */}
        <Route path="/multi-venue/venues" element={<VenueSettingsPage />} />
        <Route path="/multi-venue/overview" element={<OverviewDetails />} />
        <Route path="/multi-venue/dashboard" element={<CustomDashboard />} />

        {/* Feedback Section */}
        <Route path="/feedback/qr" element={<FeedbackQRPage />} />
        <Route path="/feedback/questions" element={<FeedbackQuestionsPage />} />
        <Route path="/feedback/all" element={<AllFeedback />} />
        
        {/* Legacy feedback routes (redirects or keep for compatibility) */}
        <Route path="/questions" element={<Navigate to="/feedback/questions" replace />} />
        <Route path="/feedbackfeed" element={<FeedbackFeed />} />
        
        {/* Reports Section */}
        <Route path="/reports/feedback" element={<ReportsFeedbackPage />} />
        <Route path="/reports/performance" element={<PerformanceDashboardPage />} />
        <Route path="/reports/impact" element={<ReportsImpactPage />} />
        <Route path="/reports/insights" element={<CustomerInsightsPage />} />
        <Route path="/reports/metrics" element={<ReportsMetricsPage />} />
        <Route path="/reports/nps" element={<ReportsNPSPage />} />
        <Route path="/nps-report/:venueId" element={<NPSReportDetail />} />
        <Route path="/reports/builder" element={<ReportBuilderPage />} />

        {/* Reviews Section */}
        <Route path="/reviews" element={<GoogleReviewsPage />} />
        
        {/* Legacy reports routes */}
        <Route path="/reports" element={<Navigate to="/reports/feedback" replace />} />
        <Route path="/templates" element={<TemplatesPage />} />
        
        {/* Staff Section */}
        <Route path="/staff/leaderboard" element={<StaffLeaderboard />} />
        <Route path="/staff/recognition" element={<RecognitionHistory />} />
        <Route path="/staff/managers" element={<StaffManagersPage />} />
        <Route path="/staff/employees" element={<StaffEmployeesPage />} />
        <Route path="/staff/employees/:employeeId" element={<EmployeeDetail />} />
        <Route path="/staff/roles" element={<StaffRolesPage />} />
        <Route path="/staff/locations" element={<StaffLocationsPage />} />
        <Route path="/staff-member/:staffId" element={<StaffMemberDetails />} />
        
        {/* Legacy staff routes */}
        <Route path="/staff" element={<Navigate to="/staff/leaderboard" replace />} />
        
        {/* Settings Section */}
        <Route path="/settings/venue-details" element={<VenueSettingsPage />} />
        <Route path="/settings/feedback" element={<FeedbackSettings />} />
        <Route path="/settings/branding" element={<SettingsBrandingPage />} />
        <Route path="/settings/custom-links" element={<Navigate to="/settings/venue-details" replace />} />
        <Route path="/settings/integrations" element={<IntegrationsSettingsPage />} />
        
        {/* Legacy settings routes */}
        <Route path="/settings" element={<Navigate to="/settings/venue-details" replace />} />
        <Route path="/settings/venues" element={<Navigate to="/multi-venue/venues" replace />} />
        <Route path="/settings/billing" element={<Navigate to="/account/billing" replace />} />
        
        {/* Account Settings Section */}
        <Route path="/account/profile" element={<AccountProfilePage />} />
        <Route path="/account/billing" element={<AccountBillingPage />} />
        
        {/* Other */}
        <Route path="/floorplan" element={<Floorplan />} />
      </Route>

      {/* Legacy multi-venue route redirects */}
      <Route path="/overview/details" element={<Navigate to="/multi-venue/overview" replace />} />
      <Route path="/custom" element={<Navigate to="/multi-venue/dashboard" replace />} />
      <Route path="/venues" element={<Navigate to="/multi-venue/venues" replace />} />

      {/* Default / legacy */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
      <Route path="/home" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

      {/* Testing (leave outside unless venue context needed) */}
      <Route path="/lvb" element={<TestDashboardPage />} />
    </Routes>
  );
};

export default DashboardRoutes;
