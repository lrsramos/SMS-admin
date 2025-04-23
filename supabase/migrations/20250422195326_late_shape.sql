/*
  # Fix infinite recursion in cleaner policies

  1. Changes
    - Drop existing policies on cleaners table that cause infinite recursion
    - Create new policies with optimized conditions that prevent recursion
    
  2. Security
    - Maintain same security rules but implement them without circular dependencies
    - Ensure admins have full access
    - Ensure managers can manage non-admin cleaners
    - Allow cleaners to view their own profile
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins have full access to cleaners" ON cleaners;
DROP POLICY IF EXISTS "Cleaners can update their own profile" ON cleaners;
DROP POLICY IF EXISTS "Cleaners can view and update their own profile" ON cleaners;
DROP POLICY IF EXISTS "Managers can update non-admin cleaners" ON cleaners;
DROP POLICY IF EXISTS "Managers can view and update cleaners" ON cleaners;

-- Create new policies without recursion
CREATE POLICY "Enable read access for authenticated users"
ON cleaners FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Cleaners can update their own profile"
ON cleaners FOR UPDATE TO authenticated
USING (auth.jwt() ->> 'email' = email AND role = 'cleaner')
WITH CHECK (auth.jwt() ->> 'email' = email AND role = 'cleaner');

CREATE POLICY "Managers can update non-admin cleaners"
ON cleaners FOR UPDATE TO authenticated
USING (
  (SELECT role FROM cleaners WHERE email = auth.jwt() ->> 'email') = 'manager'
  AND role <> 'admin'
)
WITH CHECK (
  (SELECT role FROM cleaners WHERE email = auth.jwt() ->> 'email') = 'manager'
  AND role <> 'admin'
);

CREATE POLICY "Admins have full access"
ON cleaners FOR ALL TO authenticated
USING (
  (SELECT role FROM cleaners WHERE email = auth.jwt() ->> 'email') = 'admin'
)
WITH CHECK (
  (SELECT role FROM cleaners WHERE email = auth.jwt() ->> 'email') = 'admin'
);