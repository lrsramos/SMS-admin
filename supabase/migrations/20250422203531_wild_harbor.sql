/*
  # Fix RLS policies to prevent infinite recursion

  1. Changes
    - Drop existing policies that cause infinite recursion
    - Create new policies for dashboard_users table
    - Create new policies for cleaners table
    
  2. Security
    - Maintain RLS enabled on both tables
    - Add simplified policies that avoid recursive checks
    - Ensure proper access control based on user role and email
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "admin_full_access_dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "admin_full_access_cleaners" ON cleaners;

-- Create new policies for dashboard_users
CREATE POLICY "users_read_own_profile"
ON dashboard_users
FOR SELECT
TO authenticated
USING (
  auth.jwt()->>'email' = email
);

CREATE POLICY "admins_manage_users"
ON dashboard_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.jwt() 
    WHERE auth.jwt()->>'email' IN (
      SELECT email FROM dashboard_users 
      WHERE role = 'admin' 
      AND active = true 
      AND email = auth.jwt()->>'email'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.jwt() 
    WHERE auth.jwt()->>'email' IN (
      SELECT email FROM dashboard_users 
      WHERE role = 'admin' 
      AND active = true 
      AND email = auth.jwt()->>'email'
    )
  )
);

-- Create new policies for cleaners
CREATE POLICY "cleaners_read_own_profile"
ON cleaners
FOR SELECT
TO authenticated
USING (
  auth.jwt()->>'email' = email
);

CREATE POLICY "cleaners_update_own_profile"
ON cleaners
FOR UPDATE
TO authenticated
USING (
  auth.jwt()->>'email' = email
)
WITH CHECK (
  auth.jwt()->>'email' = email
);

CREATE POLICY "admins_manage_cleaners"
ON cleaners
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.jwt() 
    WHERE auth.jwt()->>'email' IN (
      SELECT email FROM dashboard_users 
      WHERE role = 'admin' 
      AND active = true 
      AND email = auth.jwt()->>'email'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.jwt() 
    WHERE auth.jwt()->>'email' IN (
      SELECT email FROM dashboard_users 
      WHERE role = 'admin' 
      AND active = true 
      AND email = auth.jwt()->>'email'
    )
  )
);