-- Add managers.view to Viewer template
-- This allows viewers to see the managers list (read-only)

INSERT INTO role_template_permissions (role_template_id, permission_id)
SELECT
  (SELECT id FROM role_templates WHERE code = 'viewer'),
  (SELECT id FROM permissions WHERE code = 'managers.view')
WHERE NOT EXISTS (
  SELECT 1 FROM role_template_permissions rtp
  JOIN role_templates rt ON rtp.role_template_id = rt.id
  JOIN permissions p ON rtp.permission_id = p.id
  WHERE rt.code = 'viewer' AND p.code = 'managers.view'
);
