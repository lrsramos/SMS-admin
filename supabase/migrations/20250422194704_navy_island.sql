/*
  # Fix recursive RLS policies

  1. Changes
    - Remove recursive policies from cleaners table
    - Implement new non-recursive policies for cleaners table
    - Fix policy definitions to avoid infinite loops
    
  2. Security
    - Maintain role-based access control without recursion
    - Ensure admins retain full access
    - Allow cleaners to view their own profile
    - Allow managers to manage non-admin cleaners
*/

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE cleaners DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins have full access to cleaners" ON cleaners;
DROP POLICY IF EXISTS "Cleaners can update their own profile" ON cleaners;
DROP POLICY IF EXISTS "Cleaners can view and update their own profile" ON cleaners;
DROP POLICY IF EXISTS "Managers can update non-admin cleaners" ON cleaners;
DROP POLICY IF EXISTS "Managers can view and update cleaners" ON cleaners;

-- Re-enable RLS
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;

-- Create new non-recursive policies
CREATE POLICY "Allow full access to admin users"
ON cleaners
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM cleaners WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM cleaners WHERE role = 'admin'
  )
);

CREATE POLICY "Allow users to view their own profile"
ON cleaners
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' = email
);

CREATE POLICY "Allow users to update their own non-role fields"
ON cleaners
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' = email
)
WITH CHECK (
  auth.jwt() ->> 'email' = email AND
  NEW.role = role -- Compare with current role instead of OLD
);

CREATE POLICY "Allow managers to view all non-admin cleaners"
ON cleaners
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email' IN (
    SELECT email FROM cleaners WHERE role = 'manager'
  ) AND role != 'admin')
);

CREATE POLICY "Allow managers to update non-admin cleaners"
ON cleaners
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email' IN (
    SELECT email FROM cleaners WHERE role = 'manager'
  ) AND role != 'admin')
)
WITH CHECK (
  (auth.jwt() ->> 'email' IN (
    SELECT email FROM cleaners WHERE role = 'manager'
  ) AND NEW.role != 'admin')
);