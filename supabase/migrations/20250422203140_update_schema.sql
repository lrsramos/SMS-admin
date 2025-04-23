-- Update appointments table to match TypeScript types
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS client_name text NOT NULL,
ADD COLUMN IF NOT EXISTS address text NOT NULL,
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Add foreign key constraints
ALTER TABLE appointments
ADD CONSTRAINT appointments_cleaner_id_fkey
FOREIGN KEY (cleaner_id)
REFERENCES cleaners(id)
ON DELETE CASCADE;

-- Update clients table to match TypeScript types
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS telefone text,
ADD COLUMN IF NOT EXISTS frequencia_limpeza text,
ADD COLUMN IF NOT EXISTS como_conheceu text;

-- Create service_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  street text,
  street_number text,
  neighborhood text,
  city text,
  state text,
  postal_code text,
  complemento text,
  ponto_referencia text,
  instrucoes_acesso text,
  latitude double precision,
  longitude double precision,
  address_validated boolean NOT NULL DEFAULT false,
  tipo_piscina text,
  tamanho_piscina text,
  produtos_utilizados text,
  equipamentos text,
  horario_preferido text,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for service_locations
ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers have full access to service_locations"
ON service_locations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
    AND active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dashboard_users
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'manager')
    AND active = true
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_locations_updated_at
  BEFORE UPDATE ON service_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 