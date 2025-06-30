-- Make customer_phone required in book_listings table
-- Generated on 2025-06-25

-- Update the customer_phone column to be NOT NULL
ALTER TABLE book_listings 
ALTER COLUMN customer_phone SET NOT NULL;

-- Update the check constraint to ensure phone number has proper length
ALTER TABLE book_listings 
DROP CONSTRAINT IF EXISTS book_listings_customer_phone_check;

ALTER TABLE book_listings 
ADD CONSTRAINT book_listings_customer_phone_check 
CHECK (char_length(customer_phone) >= 1 AND char_length(customer_phone) <= 20);

-- Add a comment to document the change
COMMENT ON COLUMN book_listings.customer_phone IS 'Required phone number for customer contact (1-20 characters)';
