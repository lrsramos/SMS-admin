/*
  # Fix RLS policies for role-based access

  1. Changes
    - Simplify RLS policies to use dashboard_users table for admin/manager roles
    - Fix role checking in policies
    - Add missing policies for cleaners table
    - Update client access policies

  2. Security
    - Maintain strict role-based access control
    - Ensure proper policy evaluation order
*/

-- Disable RLS temporarily
ALTER TABLE cleaners DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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
DROP POLICY IF EXISTS "admin_full_access_dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "manager_view_own_profile" ON dashboard_users;

-- Re-enable RLS
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;

-- Dashboard Users policies
CREATE POLICY "admin_full_access_dashboard_users" ON dashboard_users
FOR ALL TO authenticated
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

CREATE POLICY "manager_view_own_profile" ON dashboard_users
FOR SELECT TO authenticated
USING (
  email = auth.jwt() ->> 'email'
  AND active = true
);

-- Cleaners policies
CREATE POLICY "admin_full_access_cleaners" ON cleaners
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

CREATE POLICY "manager_view_cleaners" ON cleaners
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'manager'
    AND active = true
  )
  OR email = auth.jwt() ->> 'email'
);

CREATE POLICY "manager_update_cleaners" ON cleaners
FOR UPDATE TO authenticated
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

CREATE POLICY "cleaner_view_own_profile" ON cleaners
FOR SELECT TO authenticated
USING (email = auth.jwt() ->> 'email');

CREATE POLICY "cleaner_update_own_profile" ON cleaners
FOR UPDATE TO authenticated
USING (email = auth.jwt() ->> 'email')
WITH CHECK (email = auth.jwt() ->> 'email');

-- Clients policies
CREATE POLICY "admin_manager_full_access_clients" ON clients
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
    AND active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
    AND active = true
  )
);

-- Appointments policies
CREATE POLICY "admin_manager_full_access_appointments" ON appointments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
    AND active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
    AND active = true
  )
);

CREATE POLICY "cleaner_view_own_appointments" ON appointments
FOR SELECT TO authenticated
USING (
  cleaner_id IN (
    SELECT id FROM cleaners
    WHERE email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "cleaner_update_own_appointments" ON appointments
FOR UPDATE TO authenticated
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
CREATE POLICY "admin_manager_full_access_locations" ON service_locations
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
    AND active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
    AND active = true
  )
);