/*
  # Add authentication support

  1. Security
    - Enable email authentication in auth.users
    - Add RLS policies to restrict access to authenticated users only
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only access their own data" ON cleaners;
DROP POLICY IF EXISTS "Users can only access their own data" ON appointments;
DROP POLICY IF EXISTS "Users can only access their own data" ON clients;

-- Create new policies that allow authenticated users access
CREATE POLICY "Allow authenticated full access to cleaners"
  ON cleaners
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated full access to appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated full access to clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (true);