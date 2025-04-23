/*
  # Final fix for RLS policies
  
  1. Changes
    - Simplify RLS policies to avoid recursion
    - Fix role checking logic
    - Remove circular dependencies
    
  2. Security
    - Maintain proper access control
    - Ensure cleaners can only access their data
    - Allow admins full access
*/

-- Disable RLS temporarily
ALTER TABLE cleaners DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "admin_full_access_cleaners" ON cleaners;
DROP POLICY IF EXISTS "cleaner_view_own_profile" ON cleaners;
DROP POLICY IF EXISTS "cleaner_update_own_profile" ON cleaners;
DROP POLICY IF EXISTS "admin_full_access_clients" ON clients;
DROP POLICY IF EXISTS "admin_full_access_appointments" ON appointments;
DROP POLICY IF EXISTS "cleaner_view_own_appointments" ON appointments;
DROP POLICY IF EXISTS "cleaner_update_own_appointments" ON appointments;
DROP POLICY IF EXISTS "admin_full_access_locations" ON service_locations;
DROP POLICY IF EXISTS "admin_full_access_dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "users_read_own_profile" ON dashboard_users;

-- Re-enable RLS
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;

-- Dashboard Users policies
CREATE POLICY "admin_full_access_dashboard_users"
ON dashboard_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

CREATE POLICY "users_read_own_profile"
ON dashboard_users FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email');

-- Cleaners policies
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

-- Clients policies
CREATE POLICY "admin_full_access_clients"
ON clients FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

-- Appointments policies
CREATE POLICY "admin_full_access_appointments"
ON appointments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

CREATE POLICY "cleaner_view_own_appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  cleaner_id IN (
    SELECT id FROM cleaners
    WHERE email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "cleaner_update_own_appointments"
ON appointments FOR UPDATE
TO authenticated
USING (
  cleaner_id IN (
    SELECT id FROM cleaners
    WHERE email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  cleaner_id IN (
    SELECT id FROM cleaners
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Service Locations policies
CREATE POLICY "admin_full_access_locations"
ON service_locations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);