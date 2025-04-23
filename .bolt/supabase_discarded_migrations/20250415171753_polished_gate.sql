/*
  # Pool Service Management Schema

  1. New Tables
    - `cleaners` (limpadores)
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `active` (boolean)
      - `created_at` (timestamp)
    
    - `appointments` (agendamentos)
      - `id` (uuid, primary key)
      - `client_name` (text)
      - `address` (text)
      - `cleaner_id` (uuid, foreign key)
      - `status` (enum: scheduled, in_progress, completed)
      - `scheduled_at` (timestamp)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
      - `description` (text)
      - `latitude` (float)
      - `longitude` (float)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types
CREATE TYPE appointment_status AS ENUM ('scheduled', 'in_progress', 'completed');

-- Create cleaners table
CREATE TABLE IF NOT EXISTS cleaners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  address text NOT NULL,
  cleaner_id uuid REFERENCES cleaners(id),
  status appointment_status DEFAULT 'scheduled',
  scheduled_at timestamptz NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  description text,
  latitude float,
  longitude float,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON cleaners
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access" ON appointments
  FOR ALL TO authenticated USING (true);