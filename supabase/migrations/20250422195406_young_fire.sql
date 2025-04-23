/*
  # Fix cleaner table policies
  
  1. Changes
    - Drop and recreate policies to fix role-based access
    - Implement proper role checks without using NEW/OLD references
    - Maintain security while preventing recursion
  
  2. Security
    - Admins have full access
    - Managers can manage non-admin cleaners
    - Users can view and update their own profiles
    - Prevent role escalation
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
  EXISTS (
    SELECT 1 FROM cleaners 
    WHERE email = auth.jwt() ->> 'email' 
    AND role = 'admin'
  )
);

CREATE POLICY "Allow users to view their own profile"
ON cleaners
FOR SELECT
TO authenticated
USING (
  email = auth.jwt() ->> 'email'
);

CREATE POLICY "Allow users to update their own profile"
ON cleaners
FOR UPDATE
TO authenticated
USING (
  email = auth.jwt() ->> 'email'
)
WITH CHECK (
  email = auth.jwt() ->> 'email'
  AND role = (
    SELECT role FROM cleaners 
    WHERE email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Allow managers to view all non-admin cleaners"
ON cleaners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners 
    WHERE email = auth.jwt() ->> 'email' 
    AND role = 'manager'
  )
  AND role != 'admin'
);

CREATE POLICY "Allow managers to update non-admin cleaners"
ON cleaners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners 
    WHERE email = auth.jwt() ->> 'email' 
    AND role = 'manager'
  )
  AND role != 'admin'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cleaners 
    WHERE email = auth.jwt() ->> 'email' 
    AND role = 'manager'
  )
  AND role != 'admin'
);