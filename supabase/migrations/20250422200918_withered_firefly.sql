/*
  # Fix RLS policies and user roles

  1. Changes
    - Simplify RLS policies to avoid recursion
    - Use JWT claims for role-based access
    - Update policies for all tables
    - Ensure proper access control for admin, manager, and cleaner roles

  2. Security
    - Maintain strict access control based on user roles
    - Prevent unauthorized access to sensitive data
    - Ensure cleaners can only access their own data
*/

-- Disable RLS temporarily to avoid conflicts during updates
ALTER TABLE dashboard_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "admin_full_access_dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "manager_view_own_profile" ON dashboard_users;
DROP POLICY IF EXISTS "admin_full_access_cleaners" ON cleaners;
DROP POLICY IF EXISTS "manager_view_cleaners" ON cleaners;
DROP POLICY IF EXISTS "manager_update_cleaners" ON cleaners;
DROP POLICY IF EXISTS "cleaner_view_own_profile" ON cleaners;
DROP POLICY IF EXISTS "cleaner_update_own_profile" ON cleaners;
DROP POLICY IF EXISTS "admin_manager_full_access_clients" ON clients;
DROP POLICY IF EXISTS "admin_manager_full_access_appointments" ON appointments;
DROP POLICY IF EXISTS "cleaner_view_own_appointments" ON appointments;
DROP POLICY IF EXISTS "cleaner_update_own_appointments" ON appointments;
DROP POLICY IF EXISTS "admin_manager_full_access_locations" ON service_locations;

-- Re-enable RLS
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;

-- Dashboard Users policies
CREATE POLICY "admin_full_access_dashboard_users"
ON dashboard_users FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text)::user_role = 'admin' AND active = true)
WITH CHECK ((auth.jwt() ->> 'role'::text)::user_role = 'admin' AND active = true);

CREATE POLICY "manager_view_own_profile"
ON dashboard_users FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email' AND active = true);

-- Cleaners policies
CREATE POLICY "admin_full_access_cleaners"
ON cleaners FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text)::user_role = 'admin')
WITH CHECK ((auth.jwt() ->> 'role'::text)::user_role = 'admin');

CREATE POLICY "manager_view_cleaners"
ON cleaners FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role'::text)::user_role = 'manager'
  OR email = auth.jwt() ->> 'email'
);

CREATE POLICY "manager_update_cleaners"
ON cleaners FOR UPDATE
TO authenticated
USING (
  ((auth.jwt() ->> 'role'::text)::user_role = 'manager' AND role <> 'admin')
  OR email = auth.jwt() ->> 'email'
)
WITH CHECK (
  ((auth.jwt() ->> 'role'::text)::user_role = 'manager' AND role <> 'admin')
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

-- Clients policies
CREATE POLICY "admin_manager_full_access_clients"
ON clients FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text)::user_role IN ('admin', 'manager'))
WITH CHECK ((auth.jwt() ->> 'role'::text)::user_role IN ('admin', 'manager'));

-- Appointments policies
CREATE POLICY "admin_manager_full_access_appointments"
ON appointments FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text)::user_role IN ('admin', 'manager'))
WITH CHECK ((auth.jwt() ->> 'role'::text)::user_role IN ('admin', 'manager'));

CREATE POLICY "cleaner_view_own_appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  cleaner_id IN (
    SELECT id FROM cleaners WHERE email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "cleaner_update_own_appointments"
ON appointments FOR UPDATE
TO authenticated
USING (
  cleaner_id IN (
    SELECT id FROM cleaners WHERE email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  cleaner_id IN (
    SELECT id FROM cleaners WHERE email = auth.jwt() ->> 'email'
  )
);

-- Service Locations policies
CREATE POLICY "admin_manager_full_access_locations"
ON service_locations FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text)::user_role IN ('admin', 'manager'))
WITH CHECK ((auth.jwt() ->> 'role'::text)::user_role IN ('admin', 'manager'));