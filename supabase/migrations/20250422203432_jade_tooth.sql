/*
  # Rebuild RLS policies with simplified rules
  
  1. Changes
    - Drop all existing policies
    - Create new simplified policies for admin full access
    - Create policies for cleaners to access only their data
    - Remove manager-specific policies
  
  2. Security
    - Admins have full access to all tables
    - Cleaners can only view and update their own data
    - No manager-specific access
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

-- Admin policies (full access to all tables)
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

CREATE POLICY "admin_full_access_clients" ON clients
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

CREATE POLICY "admin_full_access_appointments" ON appointments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

CREATE POLICY "admin_full_access_locations" ON service_locations
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

CREATE POLICY "admin_full_access_dashboard_users" ON dashboard_users
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

-- Cleaner policies (only their own data)
CREATE POLICY "cleaner_view_own_profile" ON cleaners
FOR SELECT TO authenticated
USING (email = auth.jwt() ->> 'email');

CREATE POLICY "cleaner_update_own_profile" ON cleaners
FOR UPDATE TO authenticated
USING (email = auth.jwt() ->> 'email')
WITH CHECK (email = auth.jwt() ->> 'email');

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