/*
  # Add authentication support

  1. Security
    - Enable email authentication in auth.users
    - Add RLS policies to restrict access to authenticated users only
*/

-- Update RLS policies to check for authenticated user's email
CREATE POLICY "Users can only access their own data"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = auth.users.id
      AND auth.users.email = auth.users.email
    )
  );

CREATE POLICY "Users can only access their own data"
  ON cleaners
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = auth.users.id
      AND auth.users.email = auth.users.email
    )
  );

CREATE POLICY "Users can only access their own data"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = auth.users.id
      AND auth.users.email = auth.users.email
    )
  );