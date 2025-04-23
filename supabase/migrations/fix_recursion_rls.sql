-- First, make sure RLS is disabled on all tables
ALTER TABLE dashboard_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on the dashboard_users table
DROP POLICY IF EXISTS "dashboard_users_policy" ON dashboard_users;
DROP POLICY IF EXISTS "dashboard_users_select_policy" ON dashboard_users;
DROP POLICY IF EXISTS "dashboard_users_insert_policy" ON dashboard_users;
DROP POLICY IF EXISTS "dashboard_users_update_policy" ON dashboard_users;
DROP POLICY IF EXISTS "dashboard_users_delete_policy" ON dashboard_users;
DROP POLICY IF EXISTS "dashboard_users_admin_policy" ON dashboard_users;

-- Drop any existing policies on the cleaners table
DROP POLICY IF EXISTS "cleaners_policy" ON cleaners;
DROP POLICY IF EXISTS "cleaners_select_policy" ON cleaners;
DROP POLICY IF EXISTS "cleaners_insert_policy" ON cleaners;
DROP POLICY IF EXISTS "cleaners_update_policy" ON cleaners;
DROP POLICY IF EXISTS "cleaners_delete_policy" ON cleaners;

-- Drop any existing policies on the appointments table
DROP POLICY IF EXISTS "appointments_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_select_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON appointments;

-- Drop any existing policies on the clients table
DROP POLICY IF EXISTS "clients_policy" ON clients;
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

-- Create a simple policy for the clients table that allows:
-- 1. All authenticated users to view clients (we'll filter at the application level)
-- 2. Only admins to insert, update, and delete clients
CREATE POLICY "clients_select_policy" ON clients
FOR SELECT USING (
  -- All authenticated users can view clients
  (auth.role() = 'authenticated')
);

-- Create a policy that only allows admins to insert new clients
CREATE POLICY "clients_insert_policy" ON clients
FOR INSERT WITH CHECK (
  -- Only admins can insert new clients
  (auth.jwt() ->> 'role' = 'admin')
);

-- Create a policy that only allows admins to update clients
CREATE POLICY "clients_update_policy" ON clients
FOR UPDATE USING (
  -- Only admins can update clients
  (auth.jwt() ->> 'role' = 'admin')
);

-- Create a policy that only allows admins to delete clients
CREATE POLICY "clients_delete_policy" ON clients
FOR DELETE USING (
  -- Only admins can delete clients
  (auth.jwt() ->> 'role' = 'admin')
);

-- Create policies for the cleaners table
-- 1. SELECT policy: Admins can see all cleaners, cleaners can see their own records
CREATE POLICY "cleaners_select_policy" ON cleaners
FOR SELECT USING (
  -- Admins can see all cleaners
  (auth.jwt() ->> 'role' = 'admin')
  OR
  -- Cleaners can see their own records
  (email = auth.jwt() ->> 'email')
);

-- 2. INSERT policy: Only admins can insert new cleaners
CREATE POLICY "cleaners_insert_policy" ON cleaners
FOR INSERT WITH CHECK (
  -- Only admins can insert new cleaners
  (auth.jwt() ->> 'role' = 'admin')
);

-- 3. UPDATE policy: Admins can update all cleaners, cleaners can update their own records
CREATE POLICY "cleaners_update_policy" ON cleaners
FOR UPDATE USING (
  -- Admins can update all cleaners
  (auth.jwt() ->> 'role' = 'admin')
  OR
  -- Cleaners can update their own records
  (email = auth.jwt() ->> 'email')
);

-- 4. DELETE policy: Only admins can delete cleaners
CREATE POLICY "cleaners_delete_policy" ON cleaners
FOR DELETE USING (
  -- Only admins can delete cleaners
  (auth.jwt() ->> 'role' = 'admin')
);

-- Create policies for the appointments table
-- 1. SELECT policy: Admins can see all appointments, cleaners can see their own appointments
CREATE POLICY "appointments_select_policy" ON appointments
FOR SELECT USING (
  -- Admins can see all appointments
  (auth.jwt() ->> 'role' = 'admin')
  OR
  -- Cleaners can see their own appointments
  (cleaner_id IN (SELECT id FROM cleaners WHERE email = auth.jwt() ->> 'email'))
);

-- 2. INSERT policy: Only admins can insert new appointments
CREATE POLICY "appointments_insert_policy" ON appointments
FOR INSERT WITH CHECK (
  -- Only admins can insert new appointments
  (auth.jwt() ->> 'role' = 'admin')
);

-- 3. UPDATE policy: Admins can update all appointments, cleaners can update their own appointments
CREATE POLICY "appointments_update_policy" ON appointments
FOR UPDATE USING (
  -- Admins can update all appointments
  (auth.jwt() ->> 'role' = 'admin')
  OR
  -- Cleaners can update their own appointments
  (cleaner_id IN (SELECT id FROM cleaners WHERE email = auth.jwt() ->> 'email'))
);

-- 4. DELETE policy: Only admins can delete appointments
CREATE POLICY "appointments_delete_policy" ON appointments
FOR DELETE USING (
  -- Only admins can delete appointments
  (auth.jwt() ->> 'role' = 'admin')
);

-- Enable RLS on the clients, cleaners, and appointments tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Note: RLS remains disabled on the dashboard_users table 