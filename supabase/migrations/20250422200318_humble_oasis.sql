/*
  # Add dashboard users table
  
  1. New Tables
    - `dashboard_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `role` (user_role)
      - `active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS
    - Add policies for admin and manager access
    
  3. Changes
    - Create dashboard_users table
    - Add indexes for performance
    - Set up RLS policies
*/

-- Create dashboard_users table
CREATE TABLE dashboard_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'manager',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_dashboard_users_email ON dashboard_users(email);
CREATE INDEX idx_dashboard_users_role ON dashboard_users(role);

-- Enable RLS
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "admin_full_access_dashboard_users"
ON dashboard_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

CREATE POLICY "manager_view_own_profile"
ON dashboard_users FOR SELECT
TO authenticated
USING (
  email = auth.jwt() ->> 'email'
  AND active = true
);

-- Create trigger for updated_at
CREATE TRIGGER update_dashboard_users_updated_at
  BEFORE UPDATE ON dashboard_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial admin user (replace with actual admin email)
INSERT INTO dashboard_users (email, role)
VALUES ('admin@example.com', 'admin')
ON CONFLICT (email) DO NOTHING;