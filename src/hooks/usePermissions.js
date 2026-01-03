import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useVenue } from '../context/VenueContext';

/**
 * Hook to manage user permissions
 *
 * Usage:
 * const { hasPermission, hasAnyPermission, hasAllPermissions, permissions, loading } = usePermissions();
 *
 * // Check single permission
 * if (hasPermission('feedback.view')) { ... }
 *
 * // Check if user has any of these permissions
 * if (hasAnyPermission(['feedback.view', 'reports.view'])) { ... }
 *
 * // Check if user has all of these permissions
 * if (hasAllPermissions(['feedback.view', 'feedback.respond'])) { ... }
 */
const usePermissions = () => {
  const { venueId, userRole } = useVenue();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user permissions
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPermissions([]);
        return;
      }

      const userId = session.user.id;

      // Admin users get all permissions
      if (userRole === 'admin') {
        const { data: allPerms } = await supabase
          .from('permissions')
          .select('code');
        setPermissions((allPerms || []).map(p => p.code));
        return;
      }

      // Master users get admin-level permissions
      if (userRole === 'master') {
        const { data: adminPerms } = await supabase
          .from('role_templates')
          .select(`
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
        return;
      }

      // For managers, check user_permissions table
      // First try venue-specific, then account-wide
      const { data: userPerms } = await supabase
        .from('user_permissions')
        .select(`
          role_template_id,
          custom_permissions,
          venue_id,
          role_templates (
            code,
            role_template_permissions (
              permissions (code)
            )
          )
        `)
        .eq('user_id', userId)
        .order('venue_id', { ascending: false, nullsFirst: false }); // venue-specific first

      if (!userPerms || userPerms.length === 0) {
        // No permissions assigned - give default viewer permissions for backwards compatibility
        const { data: viewerPerms } = await supabase
          .from('role_templates')
          .select(`
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
        return;
      }

      // Find applicable permission set (venue-specific takes precedence)
      const venueSpecific = userPerms.find(up => up.venue_id === venueId);
      const accountWide = userPerms.find(up => up.venue_id === null);
      const applicablePerms = venueSpecific || accountWide;

      if (!applicablePerms) {
        setPermissions([]);
        return;
      }

      // Extract permissions from role template or custom permissions
      let codes = [];
      if (applicablePerms.role_template_id && applicablePerms.role_templates) {
        codes = applicablePerms.role_templates.role_template_permissions?.map(
          rtp => rtp.permissions?.code
        ).filter(Boolean) || [];
      } else if (applicablePerms.custom_permissions) {
        codes = applicablePerms.custom_permissions;
      }

      setPermissions(codes);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [venueId, userRole]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permissionCode) => {
    // Admin and master always have all permissions
    if (userRole === 'admin' || userRole === 'master') return true;
    return permissions.includes(permissionCode);
  }, [permissions, userRole]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissionCodes) => {
    if (userRole === 'admin' || userRole === 'master') return true;
    return permissionCodes.some(code => permissions.includes(code));
  }, [permissions, userRole]);

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((permissionCodes) => {
    if (userRole === 'admin' || userRole === 'master') return true;
    return permissionCodes.every(code => permissions.includes(code));
  }, [permissions, userRole]);

  // Get permissions grouped by category
  const permissionsByCategory = useMemo(() => {
    const grouped = {};
    permissions.forEach(code => {
      const [category] = code.split('.');
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(code);
    });
    return grouped;
  }, [permissions]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissionsByCategory,
    refetch: fetchPermissions
  };
};

export default usePermissions;

/**
 * Permission codes reference:
 *
 * FEEDBACK:
 * - feedback.view     - View customer feedback
 * - feedback.respond  - Reply to feedback
 * - feedback.export   - Export feedback data
 *
 * QUESTIONS:
 * - questions.view    - View feedback questions
 * - questions.edit    - Create/edit/delete questions
 *
 * REPORTS:
 * - reports.view      - Access reports
 * - reports.export    - Export report data
 * - reports.create    - Create custom reports
 *
 * NPS:
 * - nps.view          - View NPS score
 * - nps.insights      - View NPS insights
 * - nps.edit          - Edit NPS settings
 *
 * STAFF:
 * - staff.view        - View employee list
 * - staff.edit        - Manage employees (includes roles & locations)
 * - staff.leaderboard - View leaderboard
 * - staff.recognition - Manage recognition
 *
 * MANAGERS:
 * - managers.view        - View managers
 * - managers.invite      - Invite new managers
 * - managers.remove      - Remove managers
 * - managers.permissions - Change permissions
 *
 * VENUE:
 * - venue.view         - View settings
 * - venue.edit         - Edit settings (includes menu)
 * - venue.branding     - Edit branding
 * - venue.integrations - Manage integrations
 *
 * FLOORPLAN:
 * - floorplan.view    - View floor plan
 * - floorplan.edit    - Edit floor plan
 *
 * QR:
 * - qr.view           - View QR codes
 * - qr.generate       - Generate QR codes
 *
 * AI:
 * - ai.insights       - View AI insights
 * - ai.chat           - Use AI chat
 * - ai.regenerate     - Regenerate insights
 *
 * REVIEWS:
 * - reviews.view      - View external reviews
 *
 * BILLING:
 * - billing.view      - View billing info
 * - billing.manage    - Manage subscription
 *
 * MULTIVENUE:
 * - multivenue.view   - Access multi-venue overview
 */
