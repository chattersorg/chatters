-- Add audit logging for permission changes
-- This migration creates a table to track all permission modifications

CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who was affected
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Who made the change
  changed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- What changed
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  -- Previous state (null for create)
  previous_role_template_id UUID REFERENCES role_templates(id) ON DELETE SET NULL,
  previous_custom_permissions TEXT[] DEFAULT '{}',
  -- New state (null for delete)
  new_role_template_id UUID REFERENCES role_templates(id) ON DELETE SET NULL,
  new_custom_permissions TEXT[] DEFAULT '{}',
  -- Metadata
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by target user
CREATE INDEX idx_permission_audit_target_user ON permission_audit_log(target_user_id);

-- Index for querying by who made changes
CREATE INDEX idx_permission_audit_changed_by ON permission_audit_log(changed_by_user_id);

-- Index for querying by account
CREATE INDEX idx_permission_audit_account ON permission_audit_log(account_id);

-- Index for time-based queries
CREATE INDEX idx_permission_audit_created_at ON permission_audit_log(created_at DESC);

-- RLS policies
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can see all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON permission_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Masters can see audit logs for their account
CREATE POLICY "Masters can view account audit logs"
  ON permission_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'master'
      AND users.account_id = permission_audit_log.account_id
    )
  );

-- Only the API (service role) can insert audit logs
-- No direct insert policy for authenticated users

COMMENT ON TABLE permission_audit_log IS 'Audit trail for all permission changes made to user accounts';
