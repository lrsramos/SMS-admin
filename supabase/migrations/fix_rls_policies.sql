-- Drop existing policies that might be causing infinite recursion
DROP POLICY IF EXISTS "Users can view dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can insert dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can update dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can delete dashboard_users" ON dashboard_users;

DROP POLICY IF EXISTS "Users can view cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can insert cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can update cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can delete cleaners" ON cleaners;

-- Create new simple policies for dashboard_users table
CREATE POLICY "Users can view dashboard_users" ON dashboard_users
FOR SELECT USING (true);

CREATE POLICY "Users can insert dashboard_users" ON dashboard_users
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update dashboard_users" ON dashboard_users
FOR UPDATE USING (true);

CREATE POLICY "Users can delete dashboard_users" ON dashboard_users
FOR DELETE USING (true);

-- Create new simple policies for cleaners table
CREATE POLICY "Users can view cleaners" ON cleaners
FOR SELECT USING (true);

CREATE POLICY "Users can insert cleaners" ON cleaners
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update cleaners" ON cleaners
FOR UPDATE USING (true);

CREATE POLICY "Users can delete cleaners" ON cleaners
FOR DELETE USING (true);

-- Make sure RLS is enabled on both tables
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY; 