-- Drop existing policies
DROP POLICY IF EXISTS "Users can view dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can insert dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can update dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can delete dashboard_users" ON dashboard_users;

DROP POLICY IF EXISTS "Users can view cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can insert cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can update cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can delete cleaners" ON cleaners;

-- Create policies for dashboard_users table
-- Admins can do everything
CREATE POLICY "Admins can do everything on dashboard_users" ON dashboard_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Cleaners can only view and update their own profile
CREATE POLICY "Cleaners can view their own profile" ON dashboard_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE id = auth.uid() AND email = dashboard_users.email
  )
);

CREATE POLICY "Cleaners can update their own profile" ON dashboard_users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE id = auth.uid() AND email = dashboard_users.email
  )
);

-- Create policies for cleaners table
-- Admins can do everything
CREATE POLICY "Admins can do everything on cleaners" ON cleaners
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Cleaners can only view and update their own profile
CREATE POLICY "Cleaners can view their own profile" ON cleaners
FOR SELECT USING (
  id = auth.uid()
);

CREATE POLICY "Cleaners can update their own profile" ON cleaners
FOR UPDATE USING (
  id = auth.uid()
);

-- Create policies for appointments table
-- Admins can do everything
CREATE POLICY "Admins can do everything on appointments" ON appointments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Cleaners can only view appointments assigned to them
CREATE POLICY "Cleaners can view their appointments" ON appointments
FOR SELECT USING (
  cleaner_id = auth.uid()
);

-- Create policies for clients table
-- Admins can do everything
CREATE POLICY "Admins can do everything on clients" ON clients
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Cleaners can only view clients they have appointments with
CREATE POLICY "Cleaners can view their clients" ON clients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.client_id = clients.id
    AND appointments.cleaner_id = auth.uid()
  )
);

-- Make sure RLS is enabled on all tables
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY; 