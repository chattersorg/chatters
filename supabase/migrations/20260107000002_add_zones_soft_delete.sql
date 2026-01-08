-- Add soft delete support to zones table
ALTER TABLE zones ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update existing queries to filter by deleted_at
COMMENT ON COLUMN zones.deleted_at IS 'Soft delete timestamp - NULL means active';
