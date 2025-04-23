/*
  # Update authentication policies

  1. Security Changes
    - Drop existing policies
    - Add specific policies for each operation (SELECT, INSERT, UPDATE, DELETE)
    - Ensure authenticated users have appropriate access levels
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access their own data" ON cleaners;
DROP POLICY IF EXISTS "Users can only access their own data" ON appointments;
DROP POLICY IF EXISTS "Users can only access their own data" ON clients;
DROP POLICY IF EXISTS "Allow authenticated full access to cleaners" ON cleaners;
DROP POLICY IF EXISTS "Allow authenticated full access to appointments" ON appointments;
DROP POLICY IF EXISTS "Allow authenticated full access to clients" ON clients;

-- Create specific policies for cleaners table
CREATE POLICY "Allow authenticated users to view cleaners"
  ON cleaners
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert cleaners"
  ON cleaners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cleaners"
  ON cleaners
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete cleaners"
  ON cleaners
  FOR DELETE
  TO authenticated
  USING (true);

-- Create specific policies for appointments table
CREATE POLICY "Allow authenticated users to view appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete appointments"
  ON appointments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create specific policies for clients table
CREATE POLICY "Allow authenticated users to view clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);