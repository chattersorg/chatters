-- Add custom action links to venues table for hub functionality
-- Allows venues to integrate their existing ordering/payment/booking systems

ALTER TABLE venues
ADD COLUMN IF NOT EXISTS custom_links jsonb DEFAULT '[]'::jsonb;

-- Example structure for custom_links:
-- [
--   {
--     "id": "menu",
--     "label": "View Menu",
--     "url": "https://mryum.com/venue-name",
--     "enabled": true,
--     "order": 1
--   },
--   {
--     "id": "order",
--     "label": "Order Food",
--     "url": "https://order.toasttab.com/venue-name",
--     "enabled": true,
--     "order": 2
--   },
--   {
--     "id": "pay",
--     "label": "Pay Your Bill",
--     "url": "https://sunday.app/pay/venue",
--     "enabled": true,
--     "order": 3
--   },
--   {
--     "id": "book",
--     "label": "Book Your Next Visit",
--     "url": "https://sevenrooms.com/venue",
--     "enabled": true,
--     "order": 4
--   }
-- ]

COMMENT ON COLUMN venues.custom_links IS 'Custom action links that display on the feedback splash page (menu, order, pay, book)';
