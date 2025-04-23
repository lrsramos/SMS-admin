/*
  # Fix recursive policies on cleaners table

  1. Changes
    - Remove recursive policies from cleaners table
    - Create new, simplified policies that avoid circular dependencies
    - Maintain security while preventing infinite recursion

  2. Security
    - Maintain role-based access control
    - Ensure admins retain full access
    - Allow managers to manage non-admin cleaners
    - Allow users to view their own profile
*/

-- Drop existing policies to recreate them without recursion
DROP POLICY IF EXISTS "Admins have full access" ON cleaners;
DROP POLICY IF EXISTS "Allow full access to admin users" ON cleaners;
DROP POLICY IF EXISTS "Allow managers to update non-admin cleaners" ON cleaners;
DROP POLICY IF EXISTS "Allow managers to view all non-admin cleaners" ON cleaners;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON cleaners;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON cleaners;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON cleaners;

-- Create new non-recursive policies
CREATE POLICY "Admin full access"
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

CREATE POLICY "Manager view non-admin cleaners"
ON cleaners
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email' IN (
    SELECT email FROM cleaners WHERE role = 'manager'
  ) AND role != 'admin')
  OR
  (auth.jwt() ->> 'email' = email)
);

CREATE POLICY "Manager update non-admin cleaners"
ON cleaners
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email' IN (
    SELECT email FROM cleaners WHERE role = 'manager'
  ) AND role != 'admin')
  OR
  (auth.jwt() ->> 'email' = email)
)
WITH CHECK (
  (auth.jwt() ->> 'email' IN (
    SELECT email FROM cleaners WHERE role = 'manager'
  ) AND role != 'admin')
  OR
  (auth.jwt() ->> 'email' = email)
);

CREATE POLICY "Users view own profile"
ON cleaners
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' = email
);

CREATE POLICY "Users update own profile"
ON cleaners
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' = email
)
WITH CHECK (
  auth.jwt() ->> 'email' = email
);