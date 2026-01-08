-- Add enhanced NPS email customization columns to venues table
-- This enables rich, branded NPS emails similar to professional marketing emails

-- Header/Banner image
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_header_image TEXT;

-- Navigation Links (up to 3)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_nav_link_1_text TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_nav_link_1_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_nav_link_2_text TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_nav_link_2_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_nav_link_3_text TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_nav_link_3_url TEXT;

-- Email Colors
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_background_color TEXT DEFAULT '#f5f5dc';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_card_color TEXT DEFAULT '#ffffff';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_text_color TEXT DEFAULT '#111827';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_button_color TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_button_text_color TEXT DEFAULT '#ffffff';

-- Sign-off
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_signoff TEXT DEFAULT 'Thank you';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_signoff_name TEXT;

-- Footer Links (up to 3)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_footer_link_1_text TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_footer_link_1_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_footer_link_2_text TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_footer_link_2_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_footer_link_3_text TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS nps_email_footer_link_3_url TEXT;

-- Add customer name to nps_submissions for personalization
ALTER TABLE nps_submissions ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add comment to explain the new columns
COMMENT ON COLUMN venues.nps_email_header_image IS 'URL to custom header banner image for NPS emails';
COMMENT ON COLUMN venues.nps_email_background_color IS 'Background color for NPS email (default: beige #f5f5dc)';
COMMENT ON COLUMN venues.nps_email_card_color IS 'Card/container background color in NPS email';
COMMENT ON COLUMN venues.nps_email_text_color IS 'Body text color in NPS email';
COMMENT ON COLUMN venues.nps_email_button_color IS 'CTA button color (falls back to primary_color if null)';
COMMENT ON COLUMN venues.nps_email_button_text_color IS 'CTA button text color';
COMMENT ON COLUMN venues.nps_email_signoff IS 'Sign-off text (e.g., "Thank you,")';
COMMENT ON COLUMN venues.nps_email_signoff_name IS 'Sign-off name (e.g., "The Team x")';
COMMENT ON COLUMN nps_submissions.customer_name IS 'Optional customer first name for email personalization';
