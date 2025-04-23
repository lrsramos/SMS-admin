/*
  # Fix clients table RLS policies

  1. Changes
    - Remove direct role comparison from policies
    - Update policies to check user role properly through dashboard_users table
    - Maintain existing access patterns but with correct role handling

  2. Security
    - Policies ensure admin and manager roles retain full access
    - Policies verify user roles through dashboard_users table instead of direct JWT claims
*/

-- Drop existing policies
DROP POLICY IF EXISTS "admin_manager_full_access_clients" ON clients;

-- Create new policies with proper role checking
CREATE POLICY "admin_manager_full_access_clients" ON clients
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboard_users
      WHERE dashboard_users.email = auth.jwt()->>'email'
      AND dashboard_users.role IN ('admin', 'manager')
      AND dashboard_users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboard_users
      WHERE dashboard_users.email = auth.jwt()->>'email'
      AND dashboard_users.role IN ('admin', 'manager')
      AND dashboard_users.active = true
    )
  );