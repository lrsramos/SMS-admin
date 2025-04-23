/*
  # Fix admin policies for cleaner creation

  1. Changes
    - Simplify admin access policies
    - Ensure admins can create new cleaners
    - Fix role-based access control
    - Remove recursive policy checks

  2. Security
    - Maintain strict access control
    - Preserve existing security model
    - Ensure proper role validation
*/

-- Disable RLS temporarily
ALTER TABLE cleaners DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "admin_full_access_cleaners" ON cleaners;
DROP POLICY IF EXISTS "manager_view_cleaners" ON cleaners;
DROP POLICY IF EXISTS "manager_update_cleaners" ON cleaners;
DROP POLICY IF EXISTS "cleaner_view_own_profile" ON cleaners;
DROP POLICY IF EXISTS "cleaner_update_own_profile" ON cleaners;

-- Re-enable RLS
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
CREATE POLICY "admin_full_access_cleaners"
ON cleaners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

CREATE POLICY "manager_view_cleaners"
ON cleaners FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'manager'
    AND active = true
  )
  OR email = auth.jwt() ->> 'email'
);

CREATE POLICY "manager_update_cleaners"
ON cleaners FOR UPDATE
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM dashboard_users
      WHERE email = auth.jwt() ->> 'email'
      AND role = 'manager'
      AND active = true
    )
    AND role != 'admin'
  )
  OR email = auth.jwt() ->> 'email'
)
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM dashboard_users
      WHERE email = auth.jwt() ->> 'email'
      AND role = 'manager'
      AND active = true
    )
    AND role != 'admin'
  )
  OR email = auth.jwt() ->> 'email'
);

CREATE POLICY "cleaner_view_own_profile"
ON cleaners FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email');

CREATE POLICY "cleaner_update_own_profile"
ON cleaners FOR UPDATE
TO authenticated
USING (email = auth.jwt() ->> 'email')
WITH CHECK (email = auth.jwt() ->> 'email');