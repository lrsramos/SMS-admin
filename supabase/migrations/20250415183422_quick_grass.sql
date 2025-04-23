/*
  # Update cleaners table with multiple phone fields

  1. Changes
    - Remove existing 'phone' column
    - Add 'personal_phone' column (text, nullable)
    - Add 'company_phone' column (text, nullable)

  2. Notes
    - Both phone numbers are optional
    - Existing phone numbers will be migrated to personal_phone
*/

DO $$
BEGIN
  -- First, copy existing phone numbers to personal_phone
  ALTER TABLE cleaners 
  ADD COLUMN personal_phone text,
  ADD COLUMN company_phone text;

  -- Copy existing phone data to personal_phone
  UPDATE cleaners 
  SET personal_phone = phone;

  -- Remove the old phone column
  ALTER TABLE cleaners 
  DROP COLUMN IF EXISTS phone;
END $$;