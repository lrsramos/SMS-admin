/*
  # Add admin roles and policies

  1. New Roles
    - Create admin and manager roles
    - Add role column to cleaners table
    - Set up RLS policies based on roles

  2. Changes
    - Add role column to cleaners table
    - Update RLS policies to respect roles
    - Add default admin user

  3. Security
    - Ensure proper role-based access control
    - Maintain existing RLS policies
*/

-- Add role type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cleaner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role column to cleaners table
ALTER TABLE cleaners
ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'cleaner';

-- Create index on role column
CREATE INDEX IF NOT EXISTS idx_cleaners_role ON cleaners(role);

-- Update RLS policies for cleaners table
DROP POLICY IF EXISTS "Allow authenticated read access" ON cleaners;
DROP POLICY IF EXISTS "Allow authenticated users to delete cleaners" ON cleaners;
DROP POLICY IF EXISTS "Allow authenticated users to insert cleaners" ON cleaners;
DROP POLICY IF EXISTS "Allow authenticated users to update cleaners" ON cleaners;
DROP POLICY IF EXISTS "Allow authenticated users to view cleaners" ON cleaners;

-- Create new role-based policies
CREATE POLICY "Admins have full access to cleaners"
ON cleaners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners c
    WHERE c.email = auth.email()
    AND c.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cleaners c
    WHERE c.email = auth.email()
    AND c.role = 'admin'
  )
);

CREATE POLICY "Managers can view and update cleaners"
ON cleaners FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners c
    WHERE c.email = auth.email()
    AND c.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Managers can update non-admin cleaners"
ON cleaners FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners c
    WHERE c.email = auth.email()
    AND c.role = 'manager'
  )
  AND role != 'admin'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cleaners c
    WHERE c.email = auth.email()
    AND c.role = 'manager'
  )
  AND role != 'admin'
);

CREATE POLICY "Cleaners can view and update their own profile"
ON cleaners FOR SELECT
TO authenticated
USING (
  email = auth.email()
);

CREATE POLICY "Cleaners can update their own profile"
ON cleaners FOR UPDATE
TO authenticated
USING (
  email = auth.email()
  AND role = 'cleaner'
)
WITH CHECK (
  email = auth.email()
  AND role = 'cleaner'
);

-- Update clients table policies
DROP POLICY IF EXISTS "Allow authenticated full access" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to view clients" ON clients;

CREATE POLICY "Admins and managers have full access to clients"
ON clients FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners c
    WHERE c.email = auth.email()
    AND c.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cleaners c
    WHERE c.email = auth.email()
    AND c.role IN ('admin', 'manager')
  )
);

-- Update appointments table policies
DROP POLICY IF EXISTS "Allow authenticated full access" ON appointments;
DROP POLICY IF EXISTS "Allow authenticated users to delete appointments" ON appointments;
DROP POLICY IF EXISTS "Allow authenticated users to insert appointments" ON appointments;
DROP POLICY IF EXISTS "Allow authenticated users to update appointments" ON appointments;
DROP POLICY IF EXISTS "Allow authenticated users to view appointments" ON appointments;

CREATE POLICY "Admins and managers have full access to appointments"
ON appointments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners c
    WHERE c.email = auth.email()
    AND c.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cleaners c
    WHERE c.email = auth.email()
    AND c.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Cleaners can view and update their own appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  cleaner_id IN (
    SELECT id FROM cleaners
    WHERE email = auth.email()
  )
);

CREATE POLICY "Cleaners can update their own appointments"
ON appointments FOR UPDATE
TO authenticated
USING (
  cleaner_id IN (
    SELECT id FROM cleaners
    WHERE email = auth.email()
  )
)
WITH CHECK (
  cleaner_id IN (
    SELECT id FROM cleaners
    WHERE email = auth.email()
  )
);