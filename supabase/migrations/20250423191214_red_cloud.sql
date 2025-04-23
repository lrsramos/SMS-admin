/*
  # Add triggers for automatic logging
  
  1. Changes
    - Add triggers for authentication events (login, logout)
    - Add triggers for appointment status changes
    - Add triggers for cleaner location updates
    - Add triggers for service completion
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper user context for logging
*/

-- Function to log authentication events
CREATE OR REPLACE FUNCTION log_auth_event()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
  v_user_type text;
  v_details jsonb;
BEGIN
  -- Try to get dashboard user first
  SELECT id, 'admin' INTO v_user_id, v_user_type
  FROM dashboard_users
  WHERE email = NEW.email
  AND active = true;

  -- If not found, try to get cleaner
  IF v_user_id IS NULL THEN
    SELECT id, 'cleaner' INTO v_user_id, v_user_type
    FROM cleaners
    WHERE email = NEW.email
    AND active = true;
  END IF;

  -- Create details JSON
  v_details = jsonb_build_object(
    'email', NEW.email,
    'timestamp', CURRENT_TIMESTAMP
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
    TG_ARGV[0]::text, -- 'login' or 'logout'
    'auth',
    v_details
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log appointment status changes
CREATE OR REPLACE FUNCTION log_appointment_status_change()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
  v_user_type text;
  v_details jsonb;
  v_cleaner_name text;
  v_client_name text;
BEGIN
  -- Get user information
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

  -- Get cleaner and client names
  SELECT name INTO v_cleaner_name
  FROM cleaners
  WHERE id = NEW.cleaner_id;

  -- Create details JSON
  v_details = jsonb_build_object(
    'appointment_id', NEW.id,
    'old_status', OLD.status,
    'new_status', NEW.status,
    'cleaner_name', v_cleaner_name,
    'client_name', NEW.client_name,
    'scheduled_at', NEW.scheduled_at,
    'address', NEW.address
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
    'status_change',
    'appointments',
    v_details
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log service completion
CREATE OR REPLACE FUNCTION log_service_completion()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
  v_user_type text;
  v_details jsonb;
  v_duration interval;
BEGIN
  -- Only proceed if status changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get user information
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

    -- Calculate service duration
    IF NEW.started_at IS NOT NULL AND NEW.completed_at IS NOT NULL THEN
      v_duration = NEW.completed_at - NEW.started_at;
    END IF;

    -- Create details JSON
    v_details = jsonb_build_object(
      'appointment_id', NEW.id,
      'client_name', NEW.client_name,
      'started_at', NEW.started_at,
      'completed_at', NEW.completed_at,
      'duration_minutes', EXTRACT(EPOCH FROM v_duration) / 60,
      'address', NEW.address
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
      'service_completed',
      'appointments',
      v_details
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log location updates
CREATE OR REPLACE FUNCTION log_location_update()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
  v_user_type text;
  v_details jsonb;
BEGIN
  -- Only proceed if coordinates changed
  IF (NEW.latitude IS DISTINCT FROM OLD.latitude) OR 
     (NEW.longitude IS DISTINCT FROM OLD.longitude) THEN
    -- Get user information
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
      'appointment_id', NEW.id,
      'old_latitude', OLD.latitude,
      'old_longitude', OLD.longitude,
      'new_latitude', NEW.latitude,
      'new_longitude', NEW.longitude,
      'client_name', NEW.client_name,
      'address', NEW.address
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
      'location_update',
      'appointments',
      v_details
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER log_appointment_status
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_appointment_status_change();

CREATE TRIGGER log_service_completion
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION log_service_completion();

CREATE TRIGGER log_location_update
  AFTER UPDATE OF latitude, longitude ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION log_location_update();