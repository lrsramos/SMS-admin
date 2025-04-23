/*
  # Add logs table for system activity tracking
  
  1. New Tables
    - `logs`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz, default now())
      - `user_id` (uuid, nullable)
      - `user_type` (text, 'admin' or 'cleaner')
      - `action` (text)
      - `module` (text)
      - `details` (jsonb)
      - `ip_address` (text)
      - `device_info` (text)
  
  2. Security
    - Enable RLS
    - Add policies for admin access
    - Add policies for users to view their own logs
*/

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  user_id uuid,
  user_type text CHECK (user_type IN ('admin', 'cleaner')),
  action text NOT NULL,
  module text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  device_info text,
  
  -- Add foreign key constraints with ON DELETE SET NULL
  CONSTRAINT fk_cleaner_logs
    FOREIGN KEY (user_id)
    REFERENCES cleaners(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_dashboard_user_logs
    FOREIGN KEY (user_id)
    REFERENCES dashboard_users(id)
    ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_action ON logs(action);
CREATE INDEX idx_logs_module ON logs(module);

-- Enable RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all logs"
ON logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
    AND active = true
  )
);

CREATE POLICY "Users can view their own logs"
ON logs FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM cleaners WHERE email = auth.jwt() ->> 'email'
    UNION
    SELECT id FROM dashboard_users WHERE email = auth.jwt() ->> 'email'
  )
);

-- Create function to automatically log changes
CREATE OR REPLACE FUNCTION log_table_change()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
  v_user_type text;
  v_details jsonb;
BEGIN
  -- Get user ID and type based on the current user's email
  SELECT id, 'admin' INTO v_user_id, v_user_type
  FROM dashboard_users
  WHERE email = auth.jwt() ->> 'email'
  AND active = true;

  IF v_user_id IS NULL THEN
    SELECT id, 'cleaner' INTO v_user_id, v_user_type
    FROM cleaners
    WHERE email = auth.jwt() ->> 'email'
    AND active = true;
  END IF;

  -- Create details JSON
  v_details = jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'old_data', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );

  -- Insert log entry
  INSERT INTO logs (
    user_id,
    user_type,
    action,
    module,
    details
  ) VALUES (
    v_user_id,
    v_user_type,
    LOWER(TG_OP),
    TG_TABLE_NAME,
    v_details
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for tables we want to log
CREATE TRIGGER log_appointments_changes
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER log_cleaners_changes
  AFTER INSERT OR UPDATE OR DELETE ON cleaners
  FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER log_clients_changes
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER log_service_locations_changes
  AFTER INSERT OR UPDATE OR DELETE ON service_locations
  FOR EACH ROW EXECUTE FUNCTION log_table_change();

CREATE TRIGGER log_dashboard_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON dashboard_users
  FOR EACH ROW EXECUTE FUNCTION log_table_change();