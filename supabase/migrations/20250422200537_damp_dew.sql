/*
  # Fix recursive RLS policies

  1. Changes
    - Drop and recreate policies for dashboard_users table to prevent recursion
    - Drop and recreate policies for cleaners table to prevent recursion
    
  2. Security
    - Maintain existing security rules while preventing infinite recursion
    - Use auth.jwt() instead of recursive table queries
*/

-- Fix dashboard_users policies
DROP POLICY IF EXISTS "admin_full_access_dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "manager_view_own_profile" ON dashboard_users;

CREATE POLICY "admin_full_access_dashboard_users"
ON dashboard_users
FOR ALL
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'role')::user_role, 'cleaner') = 'admin'
  AND active = true
);

CREATE POLICY "manager_view_own_profile"
ON dashboard_users
FOR SELECT
TO authenticated
USING (
  email = (auth.jwt() ->> 'email')
  AND active = true
);

-- Fix cleaners policies
DROP POLICY IF EXISTS "admin_full_access_cleaners" ON cleaners;
DROP POLICY IF EXISTS "cleaner_update_own_profile" ON cleaners;
DROP POLICY IF EXISTS "cleaner_view_own_profile" ON cleaners;
DROP POLICY IF EXISTS "manager_update_cleaners" ON cleaners;
DROP POLICY IF EXISTS "manager_view_cleaners" ON cleaners;

CREATE POLICY "admin_full_access_cleaners"
ON cleaners
FOR ALL
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'role')::user_role, 'cleaner') = 'admin'
);

CREATE POLICY "cleaner_update_own_profile"
ON cleaners
FOR UPDATE
TO authenticated
USING (email = (auth.jwt() ->> 'email'))
WITH CHECK (email = (auth.jwt() ->> 'email'));

CREATE POLICY "cleaner_view_own_profile"
ON cleaners
FOR SELECT
TO authenticated
USING (email = (auth.jwt() ->> 'email'));

CREATE POLICY "manager_update_cleaners"
ON cleaners
FOR UPDATE
TO authenticated
USING (
  (COALESCE((auth.jwt() ->> 'role')::user_role, 'cleaner') = 'manager' AND role <> 'admin')
  OR email = (auth.jwt() ->> 'email')
);

CREATE POLICY "manager_view_cleaners"
ON cleaners
FOR SELECT
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'role')::user_role, 'cleaner') = 'manager'
  OR email = (auth.jwt() ->> 'email')
);