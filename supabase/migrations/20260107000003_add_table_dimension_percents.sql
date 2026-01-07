-- Add percentage-based dimensions for proper scaling across different container sizes
ALTER TABLE table_positions ADD COLUMN IF NOT EXISTS width_percent DECIMAL DEFAULT NULL;
ALTER TABLE table_positions ADD COLUMN IF NOT EXISTS height_percent DECIMAL DEFAULT NULL;

COMMENT ON COLUMN table_positions.width_percent IS 'Table width as percentage of container width';
COMMENT ON COLUMN table_positions.height_percent IS 'Table height as percentage of container height';
