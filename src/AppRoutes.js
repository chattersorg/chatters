// src/AppRoutes.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from './utils/supabase';

// Admin
import AdminFrame from './pages/admin/AdminFrame';
import AdminAccountsList from './pages/admin/AdminAccountsList';
import AdminAccountDetail from './pages/admin/AdminAccountDetail';
import AdminCreateAccount from './pages/admin/AdminCreateAccount';
// Keep old admin for now
import EnhancedAdminDashboard from './pages/admin/EnhancedAdminDashboard';

// Everything else (dashboard + kiosk + auth)
import DashboardRoutes from './DashboardRoutes';

const RoleRedirector = () => {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) { setLoading(false); setRole(null); return; }
      const { data, error } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (!error) setRole(data?.role ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;
  return role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
};

const AdminGuard = ({ children }) => {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) { navigate('/signin', { replace: true }); return; }
      const email = (user.email || '').toLowerCase();
      const { data, error } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (error) { navigate('/signin', { replace: true }); return; }
      const isAdmin = data?.role === 'admin' || email.endsWith('@getchatters.com');
      if (!isAdmin) { navigate('/dashboard', { replace: true }); return; }
      setOk(true); setLoading(false);
    })();
  }, [navigate]);

  if (loading) return <div className="p-4">Loading admin…</div>;
  return ok ? children : null;
};

const AdminShell = () => (
  <AdminFrame>
    <Outlet />
  </AdminFrame>
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Role-based landing */}
      <Route path="/" element={<RoleRedirector />} />

      {/* Admin section (never mounts VenueProvider) */}
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminShell />
          </AdminGuard>
        }
      >
        <Route index element={<AdminAccountsList />} />
        <Route path="create" element={<AdminCreateAccount />} />
        <Route path="accounts/:accountId" element={<AdminAccountDetail />} />
        <Route path="old" element={<EnhancedAdminDashboard />} />
      </Route>

      {/* Everything else (dashboard/public/kiosk/auth) */}
      <Route path="/*" element={<DashboardRoutes />} />
    </Routes>
  );
}
