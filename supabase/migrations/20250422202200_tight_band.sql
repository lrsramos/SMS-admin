/*
  # Add address fields to clients table

  1. Changes
    - Add address-related columns to clients table:
      - address (text)
      - street (text)
      - street_number (text)
      - neighborhood (text)
      - city (text)
      - state (text)
      - postal_code (text)
      - latitude (double precision)
      - longitude (double precision)
      - address_validated (boolean)

  2. Security
    - Maintains existing RLS policies
*/

DO $$ 
BEGIN
  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'address'
  ) THEN
    ALTER TABLE clients ADD COLUMN address text;
  END IF;

  -- Add street column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'street'
  ) THEN
    ALTER TABLE clients ADD COLUMN street text;
  END IF;

  -- Add street_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'street_number'
  ) THEN
    ALTER TABLE clients ADD COLUMN street_number text;
  END IF;

  -- Add neighborhood column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE clients ADD COLUMN neighborhood text;
  END IF;

  -- Add city column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'city'
  ) THEN
    ALTER TABLE clients ADD COLUMN city text;
  END IF;

  -- Add state column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'state'
  ) THEN
    ALTER TABLE clients ADD COLUMN state text;
  END IF;

  -- Add postal_code column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE clients ADD COLUMN postal_code text;
  END IF;

  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE clients ADD COLUMN latitude double precision;
  END IF;

  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE clients ADD COLUMN longitude double precision;
  END IF;

  -- Add address_validated column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'address_validated'
  ) THEN
    ALTER TABLE clients ADD COLUMN address_validated boolean DEFAULT false;
  END IF;
END $$;