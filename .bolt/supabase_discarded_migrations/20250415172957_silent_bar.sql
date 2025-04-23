/*
  # Create clients table and relationships

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `address` (text, required)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `clients` table
    - Add policy for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access"
  ON clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);