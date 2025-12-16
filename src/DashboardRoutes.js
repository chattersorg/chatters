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
import FloorplanEditor from './pages/dashboard/FloorplanEditor';
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
import NPSInsightsPage from './pages/dashboard/NPSInsights';
import NPSSettingsPage from './pages/dashboard/NPSSettings';
import StaffListPage from './pages/dashboard/StaffList';
import CSVImportReview from './pages/dashboard/CSVImportReview';
import EmployeeDetail from './pages/dashboard/EmployeeDetail';
import ManagerDetail from './pages/dashboard/ManagerDetail';
import AddManager from './pages/dashboard/AddManager';
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
import AIChatPage from './pages/dashboard/AIChat';
import MenuBuilderPage from './pages/dashboard/MenuBuilderPage';

// Admin pages (master only)
import ManagerPermissions from './pages/dashboard/admin/ManagerPermissions';
import RoleTemplates from './pages/dashboard/admin/RoleTemplates';

// Kiosk (venue‑aware, no dashboard frame)
import KioskPage from './pages/dashboard/KioskPage';

// Public / guest routes (no venue context)
import CustomerFeedbackPage from './pages/dashboard/CustomerFeedback';
import FeedbackSplashPage from './pages/dashboard/FeedbackSplash';
import NPSResponsePage from './pages/dashboard/NPSResponse';
import PublicMenuPage from './pages/public/PublicMenuPage';

// Testing (outside venue context unless you need it)
import TestDashboardPage from './pages/admin/TestDashboardPage';

// Frames & context
import ModernDashboardFrame from './components/dashboard/layout/ModernDashboardFrame';
import { VenueProvider } from './context/VenueContext';
import { PermissionsProvider, PermissionGate } from './context/PermissionsContext';
import SubscriptionGuard from './components/guards/SubscriptionGuard';

// Trial expired page (outside subscription guard)
import TrialExpired from './pages/dashboard/TrialExpired';

// Access Denied component for permission gates
const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-12 text-center">
    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
      <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Access Denied</h2>
    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
      You don't have permission to access this page. Contact your administrator if you believe this is an error.
    </p>
    <a
      href="/dashboard"
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      Go to Dashboard
    </a>
  </div>
);

// Helper component for permission-gated routes
const ProtectedRoute = ({ permission, permissions, mode = 'any', children }) => (
  <PermissionGate
    permission={permission}
    permissions={permissions}
    mode={mode}
    fallback={<AccessDenied />}
  >
    {children}
  </PermissionGate>
);

// Wrap all authenticated dashboard pages once: SubscriptionGuard + VenueProvider + PermissionsProvider + ModernDashboardFrame
const DashboardShell = () => (
  <SubscriptionGuard>
    <VenueProvider>
      <PermissionsProvider>
        <ModernDashboardFrame>
          <Outlet />
        </ModernDashboardFrame>
      </PermissionsProvider>
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
      <Route path="/menu/:venueId" element={<PublicMenuPage />} />
      <Route path="/nps" element={<NPSResponsePage />} />

      {/* Kiosk: venue context, no dashboard frame */}
      <Route element={<KioskShell />}>
        <Route path="/kiosk" element={<KioskPage />} />
      </Route>

      {/* Authenticated app: venue context + dashboard frame */}
      <Route element={<DashboardShell />}>
        {/* Dashboard - everyone can access */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* AI Features */}
        <Route path="/ai/insights" element={
          <ProtectedRoute permission="ai.insights">
            <AIInsightsPage />
          </ProtectedRoute>
        } />
        <Route path="/ai/intelligence" element={
          <ProtectedRoute permission="ai.chat">
            <AIChatPage />
          </ProtectedRoute>
        } />
        <Route path="/ai/chat" element={
          <ProtectedRoute permission="ai.chat">
            <AIChatPage />
          </ProtectedRoute>
        } />
        {/* Legacy AI routes */}
        <Route path="/ai-insights" element={<Navigate to="/ai/insights" replace />} />
        <Route path="/ai-chat" element={<Navigate to="/ai/chat" replace />} />

        {/* Multi-Venue Section */}
        <Route path="/multi-venue/venues" element={
          <ProtectedRoute permission="venue.view">
            <VenueSettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/multi-venue/reporting" element={
          <ProtectedRoute permission="multivenue.view">
            <OverviewDetails />
          </ProtectedRoute>
        } />
        <Route path="/multi-venue/dashboard" element={
          <ProtectedRoute permission="multivenue.view">
            <CustomDashboard />
          </ProtectedRoute>
        } />
        {/* Legacy multi-venue routes */}
        <Route path="/multi-venue/overview" element={<Navigate to="/multi-venue/reporting" replace />} />

        {/* Questions - standalone */}
        <Route path="/questions" element={
          <ProtectedRoute permission="questions.view">
            <FeedbackQuestionsPage />
          </ProtectedRoute>
        } />

        {/* Feedback Section */}
        <Route path="/feedback/qr" element={
          <ProtectedRoute permission="qr.view">
            <FeedbackQRPage />
          </ProtectedRoute>
        } />
        <Route path="/feedback/all" element={
          <ProtectedRoute permission="feedback.view">
            <AllFeedback />
          </ProtectedRoute>
        } />

        <Route path="/feedback/questions" element={
          <ProtectedRoute permission="questions.view">
            <FeedbackQuestionsPage />
          </ProtectedRoute>
        } />
        <Route path="/feedback/insights" element={
          <ProtectedRoute permission="reports.view">
            <CustomerInsightsPage />
          </ProtectedRoute>
        } />

        {/* Legacy feedback routes */}
        <Route path="/feedbackfeed" element={
          <ProtectedRoute permission="feedback.view">
            <FeedbackFeed />
          </ProtectedRoute>
        } />

        {/* Reports Section */}
        <Route path="/reports/feedback" element={
          <ProtectedRoute permission="reports.view">
            <ReportsFeedbackPage />
          </ProtectedRoute>
        } />
        <Route path="/reports/performance" element={
          <ProtectedRoute permission="reports.view">
            <PerformanceDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/reports/impact" element={
          <ProtectedRoute permission="reports.view">
            <ReportsImpactPage />
          </ProtectedRoute>
        } />
        <Route path="/reports/insights" element={
          <ProtectedRoute permission="reports.view">
            <CustomerInsightsPage />
          </ProtectedRoute>
        } />
        <Route path="/reports/metrics" element={
          <ProtectedRoute permission="reports.view">
            <ReportsMetricsPage />
          </ProtectedRoute>
        } />
        {/* NPS Section */}
        <Route path="/nps/score" element={
          <ProtectedRoute permission="nps.view">
            <ReportsNPSPage />
          </ProtectedRoute>
        } />
        <Route path="/nps/insights" element={
          <ProtectedRoute permission="nps.view">
            <NPSInsightsPage />
          </ProtectedRoute>
        } />
        <Route path="/nps/settings" element={
          <ProtectedRoute permission="nps.edit">
            <NPSSettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/nps-report/:venueId" element={
          <ProtectedRoute permission="nps.view">
            <NPSReportDetail />
          </ProtectedRoute>
        } />
        {/* Legacy NPS routes */}
        <Route path="/reports/nps" element={<Navigate to="/nps/score" replace />} />
        <Route path="/reports/nps/insights" element={<Navigate to="/nps/insights" replace />} />
        <Route path="/reports/builder" element={
          <ProtectedRoute permission="reports.create">
            <ReportBuilderPage />
          </ProtectedRoute>
        } />

        {/* Reviews Section */}
        <Route path="/reviews" element={
          <ProtectedRoute permission="reviews.view">
            <GoogleReviewsPage />
          </ProtectedRoute>
        } />

        {/* Legacy reports routes */}
        <Route path="/reports" element={<Navigate to="/reports/feedback" replace />} />
        <Route path="/templates" element={<TemplatesPage />} />

        {/* Staff Section */}
        <Route path="/staff/leaderboard" element={
          <ProtectedRoute permission="staff.leaderboard">
            <StaffLeaderboard />
          </ProtectedRoute>
        } />
        <Route path="/staff/recognition" element={
          <ProtectedRoute permission="staff.recognition">
            <RecognitionHistory />
          </ProtectedRoute>
        } />
        <Route path="/staff/list" element={
          <ProtectedRoute permission="staff.view">
            <StaffListPage />
          </ProtectedRoute>
        } />
        <Route path="/staff/team" element={
          <ProtectedRoute permission="staff.view">
            <StaffListPage />
          </ProtectedRoute>
        } />
        <Route path="/staff/import" element={
          <ProtectedRoute permission="staff.edit">
            <CSVImportReview />
          </ProtectedRoute>
        } />
        {/* Legacy routes - redirect to combined staff list */}
        <Route path="/staff/managers" element={<Navigate to="/staff/list" replace />} />
        <Route path="/staff/employees" element={<Navigate to="/staff/list" replace />} />
        <Route path="/staff/employees/:employeeId" element={
          <ProtectedRoute permission="staff.view">
            <EmployeeDetail />
          </ProtectedRoute>
        } />
        <Route path="/staff/managers/:managerId" element={
          <ProtectedRoute permission="managers.view">
            <ManagerDetail />
          </ProtectedRoute>
        } />
        <Route path="/staff/managers/add" element={
          <ProtectedRoute permission="managers.invite">
            <AddManager />
          </ProtectedRoute>
        } />
        <Route path="/staff/roles" element={
          <ProtectedRoute permission="staff.edit">
            <StaffRolesPage />
          </ProtectedRoute>
        } />
        <Route path="/staff/locations" element={
          <ProtectedRoute permission="staff.edit">
            <StaffLocationsPage />
          </ProtectedRoute>
        } />
        <Route path="/staff-member/:staffId" element={
          <ProtectedRoute permission="staff.view">
            <StaffMemberDetails />
          </ProtectedRoute>
        } />

        {/* Legacy staff routes */}
        <Route path="/staff" element={<Navigate to="/staff/leaderboard" replace />} />

        {/* Settings Section (new paths) */}
        <Route path="/settings/venue" element={
          <ProtectedRoute permission="venue.view">
            <VenueSettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/settings/feedback" element={
          <ProtectedRoute permission="venue.view">
            <FeedbackSettings />
          </ProtectedRoute>
        } />
        <Route path="/settings/branding" element={
          <ProtectedRoute permission="venue.branding">
            <SettingsBrandingPage />
          </ProtectedRoute>
        } />
        <Route path="/settings/qr-code" element={
          <ProtectedRoute permission="qr.view">
            <FeedbackQRPage />
          </ProtectedRoute>
        } />
        <Route path="/settings/integrations" element={
          <ProtectedRoute permission="venue.integrations">
            <IntegrationsSettingsPage />
          </ProtectedRoute>
        } />

        {/* Venue Settings Section (legacy paths) */}
        <Route path="/venue-settings/details" element={
          <ProtectedRoute permission="venue.view">
            <VenueSettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/venue-settings/feedback" element={
          <ProtectedRoute permission="venue.view">
            <FeedbackSettings />
          </ProtectedRoute>
        } />
        <Route path="/venue-settings/branding" element={
          <ProtectedRoute permission="venue.branding">
            <SettingsBrandingPage />
          </ProtectedRoute>
        } />
        <Route path="/venue-settings/qr-code" element={
          <ProtectedRoute permission="qr.view">
            <FeedbackQRPage />
          </ProtectedRoute>
        } />
        <Route path="/venue-settings/integrations" element={
          <ProtectedRoute permission="venue.integrations">
            <IntegrationsSettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/venue-settings/menu-builder" element={
          <ProtectedRoute permission="venue.edit">
            <MenuBuilderPage />
          </ProtectedRoute>
        } />

        {/* Legacy settings routes - redirect to new paths */}
        <Route path="/settings" element={<Navigate to="/settings/venue" replace />} />
        <Route path="/settings/venue-details" element={<Navigate to="/settings/venue" replace />} />
        <Route path="/settings/menu-builder" element={<Navigate to="/venue-settings/menu-builder" replace />} />
        <Route path="/settings/custom-links" element={<Navigate to="/settings/venue" replace />} />
        <Route path="/settings/venues" element={<Navigate to="/multi-venue/venues" replace />} />
        <Route path="/settings/billing" element={<Navigate to="/account/billing" replace />} />
        <Route path="/feedback/qr" element={<Navigate to="/settings/qr-code" replace />} />

        {/* Account Settings Section */}
        <Route path="/account/profile" element={<AccountProfilePage />} />
        <Route path="/account/billing" element={
          <ProtectedRoute permission="billing.view">
            <AccountBillingPage />
          </ProtectedRoute>
        } />

        {/* Administration Section (Master only) */}
        <Route path="/admin/permissions" element={<Navigate to="/admin/permissions/managers" replace />} />
        <Route path="/admin/permissions/managers" element={
          <ProtectedRoute permission="managers.permissions">
            <ManagerPermissions />
          </ProtectedRoute>
        } />
        <Route path="/admin/permissions/templates" element={
          <ProtectedRoute permission="managers.permissions">
            <RoleTemplates />
          </ProtectedRoute>
        } />

        {/* Floor Plan */}
        <Route path="/floorplan" element={
          <ProtectedRoute permission="floorplan.view">
            <Floorplan />
          </ProtectedRoute>
        } />
        <Route path="/floorplan/edit" element={
          <ProtectedRoute permission="floorplan.edit">
            <FloorplanEditor />
          </ProtectedRoute>
        } />
      </Route>

      {/* Legacy multi-venue route redirects */}
      <Route path="/overview/details" element={<Navigate to="/multi-venue/reporting" replace />} />
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
