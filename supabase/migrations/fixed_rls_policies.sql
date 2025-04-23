-- Drop existing policies
DROP POLICY IF EXISTS "Users can view dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can insert dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can update dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can delete dashboard_users" ON dashboard_users;

DROP POLICY IF EXISTS "Users can view cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can insert cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can update cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can delete cleaners" ON cleaners;

DROP POLICY IF EXISTS "Users can view appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete appointments" ON appointments;

DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;

-- Create policies for dashboard_users table
-- Admins can do everything
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

-- Cleaners can only view and update their own profile
CREATE POLICY "users_read_own_profile"
ON dashboard_users FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email');

-- Create policies for cleaners table
-- Admins can do everything
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

-- Cleaners can only view and update their own profile
CREATE POLICY "cleaner_view_own_profile"
ON cleaners FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email');

CREATE POLICY "cleaner_update_own_profile"
ON cleaners FOR UPDATE
TO authenticated
USING (email = auth.jwt() ->> 'email')
WITH CHECK (email = auth.jwt() ->> 'email');

-- Create policies for appointments table
-- Admins can do everything
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

-- Cleaners can only view appointments assigned to them
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

-- Create policies for clients table
-- Admins can do everything
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

-- Make sure RLS is enabled on all tables
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY; 