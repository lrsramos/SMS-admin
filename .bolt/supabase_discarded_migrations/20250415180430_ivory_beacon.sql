/*
  # Add additional fields to cleaners table

  1. Changes
    - Add password field for mobile app authentication
    - Add availability fields for scheduling
    - Add service area and vehicle information
    - Add emergency contact details
    - Add internal management fields

  2. Security
    - Password is stored securely using pgcrypto extension
*/

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add new columns to cleaners table
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS password text NOT NULL;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS available_days text[] DEFAULT '{}';
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS work_start_time time;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS work_end_time time;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS service_areas text[] DEFAULT '{}';
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS has_vehicle boolean DEFAULT false;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS vehicle_type text;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS employee_code text;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS hire_date date DEFAULT CURRENT_DATE;

-- Add check constraint for work hours
ALTER TABLE cleaners 
  ADD CONSTRAINT work_hours_check 
  CHECK (
    (work_start_time IS NULL AND work_end_time IS NULL) OR 
    (work_start_time IS NOT NULL AND work_end_time IS NOT NULL AND work_start_time < work_end_time)
  );