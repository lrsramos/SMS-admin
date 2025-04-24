/*
  # Add service-related fields to appointments table
  
  1. New Fields
    - service_type (enum: weekly, bi_weekly, monthly, one_time)
    - cleaning_tasks (jsonb)
    - estimated_duration (integer)
    - special_instructions (text)
  
  2. Security
    - Maintain existing RLS policies
*/

-- Create service type enum
DO $$ BEGIN
  CREATE TYPE cleaning_service_type AS ENUM ('weekly', 'bi_weekly', 'monthly', 'one_time');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS service_type cleaning_service_type DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS cleaning_tasks jsonb DEFAULT '{
  "skimming": true,
  "vacuuming": true,
  "brushing": true,
  "basket_empty": true,
  "water_chemistry": true,
  "filter_backwash": false,
  "algae_treatment": false,
  "shock_treatment": false,
  "tile_cleaning": false,
  "acid_wash": false,
  "pool_opening": false,
  "pool_closing": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS estimated_duration integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS special_instructions text;

-- Create index on service_type for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_service_type ON appointments(service_type); 