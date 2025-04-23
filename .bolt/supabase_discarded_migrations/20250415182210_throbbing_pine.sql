/*
  # Add support for multiple phone numbers

  1. Changes
    - Rename phone column to personal_phone
    - Add company_phone column
    
  2. Notes
    - Both phone numbers are optional
    - Existing phone numbers will be migrated to personal_phone
*/

-- Rename existing phone column to personal_phone
ALTER TABLE cleaners RENAME COLUMN phone TO personal_phone;

-- Add company_phone column
ALTER TABLE cleaners ADD COLUMN company_phone text;