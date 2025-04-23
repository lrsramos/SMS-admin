/*
  # Complete RLS Policy Rebuild
  
  1. Changes
    - Drop all existing RLS policies
    - Create new policies for cleaners, clients, appointments, and service_locations tables
    - Implement role-based access control (admin, manager, cleaner)
    
  2. Security
    - Admins have full access to all tables
    - Managers can manage non-admin cleaners and all clients/appointments
    - Cleaners can only view/update their own profile and appointments
    - Service locations inherit client access permissions
*/

-- Disable RLS temporarily
ALTER TABLE cleaners DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin full access" ON cleaners;
DROP POLICY IF EXISTS "Manager view non-admin cleaners" ON cleaners;
DROP POLICY IF EXISTS "Manager update non-admin cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users view own profile" ON cleaners;
DROP POLICY IF EXISTS "Users update own profile" ON cleaners;
DROP POLICY IF EXISTS "Admins and managers have full access to clients" ON clients;
DROP POLICY IF EXISTS "Admins and managers have full access to appointments" ON appointments;
DROP POLICY IF EXISTS "Cleaners can view and update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Cleaners can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Service locations are viewable by authenticated users" ON service_locations;
DROP POLICY IF EXISTS "Service locations are insertable by authenticated users" ON service_locations;
DROP POLICY IF EXISTS "Service locations are updatable by authenticated users" ON service_locations;
DROP POLICY IF EXISTS "Service locations are deletable by authenticated users" ON service_locations;

-- Re-enable RLS
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;

-- Cleaners table policies
CREATE POLICY "admin_full_access_cleaners"
ON cleaners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
  )
);

CREATE POLICY "manager_view_cleaners"
ON cleaners FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'manager'
  )
  OR email = auth.jwt() ->> 'email'
);

CREATE POLICY "manager_update_cleaners"
ON cleaners FOR UPDATE
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM cleaners
      WHERE email = auth.jwt() ->> 'email'
      AND role = 'manager'
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

-- Clients table policies
CREATE POLICY "admin_manager_full_access_clients"
ON clients FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
  )
);

-- Appointments table policies
CREATE POLICY "admin_manager_full_access_appointments"
ON appointments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
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
);

-- Service locations table policies
CREATE POLICY "admin_manager_full_access_locations"
ON service_locations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
  )
);