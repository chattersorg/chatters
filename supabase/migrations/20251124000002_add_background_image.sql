-- Add background image option for splash page
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS background_image text;

COMMENT ON COLUMN venues.background_image IS 'Background image URL for the feedback splash page';
