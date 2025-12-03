import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useVenue } from './VenueContext';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const { venueId, userRole } = useVenue();
  const [permissions, setPermissions] = useState([]);
  const [roleTemplate, setRoleTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch user permissions
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPermissions([]);
        setRoleTemplate(null);
        return;
      }

      const userId = session.user.id;

      // Admin users get all permissions
      if (userRole === 'admin') {
        const { data: allPerms } = await supabase
          .from('permissions')
          .select('code');
        setPermissions((allPerms || []).map(p => p.code));
        setRoleTemplate({ code: 'admin', name: 'Admin' });
        return;
      }

      // Master users get admin-level permissions
      if (userRole === 'master') {
        const { data: adminPerms } = await supabase
          .from('role_templates')
          .select(`
            code,
            name,
            role_template_permissions (
              permissions (code)
            )
          `)
          .eq('code', 'admin')
          .single();

        const codes = adminPerms?.role_template_permissions?.map(
          rtp => rtp.permissions?.code
        ).filter(Boolean) || [];
        setPermissions(codes);
        setRoleTemplate({ code: 'master', name: 'Master' });
        return;
      }

      // For managers, check user_permissions table
      const { data: userPerms } = await supabase
        .from('user_permissions')
        .select(`
          role_template_id,
          custom_permissions,
          venue_id,
          role_templates (
            code,
            name,
            role_template_permissions (
              permissions (code)
            )
          )
        `)
        .eq('user_id', userId)
        .order('venue_id', { ascending: false, nullsFirst: false });

      if (!userPerms || userPerms.length === 0) {
        // No permissions assigned - give default viewer permissions
        const { data: viewerPerms } = await supabase
          .from('role_templates')
          .select(`
            code,
            name,
            role_template_permissions (
              permissions (code)
            )
          `)
          .eq('code', 'viewer')
          .single();

        const codes = viewerPerms?.role_template_permissions?.map(
          rtp => rtp.permissions?.code
        ).filter(Boolean) || [];
        setPermissions(codes);
        setRoleTemplate({ code: 'viewer', name: 'Viewer (Default)' });
        return;
      }

      // Find applicable permission set
      const venueSpecific = userPerms.find(up => up.venue_id === venueId);
      const accountWide = userPerms.find(up => up.venue_id === null);
      const applicablePerms = venueSpecific || accountWide;

      if (!applicablePerms) {
        setPermissions([]);
        setRoleTemplate(null);
        return;
      }

      // Extract permissions
      let codes = [];
      if (applicablePerms.role_template_id && applicablePerms.role_templates) {
        codes = applicablePerms.role_templates.role_template_permissions?.map(
          rtp => rtp.permissions?.code
        ).filter(Boolean) || [];
        setRoleTemplate({
          code: applicablePerms.role_templates.code,
          name: applicablePerms.role_templates.name
        });
      } else if (applicablePerms.custom_permissions) {
        codes = applicablePerms.custom_permissions;
        setRoleTemplate({ code: 'custom', name: 'Custom' });
      }

      setPermissions(codes);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setPermissions([]);
      setRoleTemplate(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [venueId, userRole]);

  useEffect(() => {
    if (userRole !== null) {
      fetchPermissions();
    }
  }, [fetchPermissions, userRole]);

  // Check single permission
  const hasPermission = useCallback((permissionCode) => {
    if (userRole === 'admin' || userRole === 'master') return true;
    return permissions.includes(permissionCode);
  }, [permissions, userRole]);

  // Check any of permissions
  const hasAnyPermission = useCallback((permissionCodes) => {
    if (userRole === 'admin' || userRole === 'master') return true;
    return permissionCodes.some(code => permissions.includes(code));
  }, [permissions, userRole]);

  // Check all permissions
  const hasAllPermissions = useCallback((permissionCodes) => {
    if (userRole === 'admin' || userRole === 'master') return true;
    return permissionCodes.every(code => permissions.includes(code));
  }, [permissions, userRole]);

  // Permissions grouped by category
  const permissionsByCategory = useMemo(() => {
    const grouped = {};
    permissions.forEach(code => {
      const [category] = code.split('.');
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(code);
    });
    return grouped;
  }, [permissions]);

  // Check if user can access a specific feature/page
  const canAccess = useCallback((feature) => {
    const featurePermissions = {
      // Pages
      dashboard: true, // Everyone can see dashboard
      'ai-insights': ['ai.insights'],
      'ai-chat': ['ai.chat'],
      feedback: ['feedback.view'],
      questions: ['questions.view'],
      reports: ['reports.view'],
      nps: ['nps.view'],
      staff: ['staff.view'],
      'staff-leaderboard': ['staff.leaderboard'],
      managers: ['managers.view'],
      floorplan: ['floorplan.view'],
      'venue-settings': ['venue.view'],
      branding: ['venue.branding'],
      integrations: ['venue.integrations'],
      qr: ['qr.view'],
      reviews: ['reviews.view'],
      billing: ['billing.view'],
      'multi-venue': ['multivenue.view'],

      // Actions
      'feedback-respond': ['feedback.respond'],
      'feedback-delete': ['feedback.delete'],
      'feedback-export': ['feedback.export'],
      'questions-edit': ['questions.edit'],
      'reports-export': ['reports.export'],
      'reports-create': ['reports.create'],
      'staff-edit': ['staff.edit'],
      'managers-invite': ['managers.invite'],
      'managers-permissions': ['managers.permissions'],
      'floorplan-edit': ['floorplan.edit'],
      'venue-edit': ['venue.edit'],
      'qr-generate': ['qr.generate'],
      'ai-regenerate': ['ai.regenerate'],
      'reviews-respond': ['reviews.respond'],
      'billing-manage': ['billing.manage']
    };

    const requiredPerms = featurePermissions[feature];
    if (requiredPerms === true) return true;
    if (!requiredPerms) return false;

    return hasAnyPermission(requiredPerms);
  }, [hasAnyPermission]);

  const value = {
    permissions,
    roleTemplate,
    loading,
    initialized,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissionsByCategory,
    canAccess,
    refetch: fetchPermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

/**
 * Higher-order component to protect routes/components
 *
 * Usage:
 * export default withPermission('feedback.view')(MyComponent);
 * export default withPermission(['feedback.view', 'feedback.respond'], 'all')(MyComponent);
 */
export const withPermission = (requiredPermissions, mode = 'any') => (WrappedComponent) => {
  return function PermissionWrapper(props) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const hasAccess = mode === 'all' ? hasAllPermissions(perms) : hasAnyPermission(perms);

    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            You don't have permission to access this feature. Contact your administrator if you believe this is an error.
          </p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

/**
 * Component to conditionally render based on permissions
 *
 * Usage:
 * <PermissionGate permission="feedback.delete">
 *   <DeleteButton />
 * </PermissionGate>
 *
 * <PermissionGate permissions={['feedback.view', 'feedback.respond']} mode="all">
 *   <RespondForm />
 * </PermissionGate>
 */
export const PermissionGate = ({
  permission,
  permissions,
  mode = 'any',
  fallback = null,
  children
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) return null;

  const perms = permissions || (permission ? [permission] : []);
  if (perms.length === 0) return children;

  const hasAccess = mode === 'all' ? hasAllPermissions(perms) : hasAnyPermission(perms);

  return hasAccess ? children : fallback;
};
