/*
  # Service Locations Migration
  
  1. New Tables
    - `service_locations`
      - Core fields: id, client_id, name, is_primary
      - Address fields: street, number, city, etc.
      - Pool-specific fields: tipo_piscina, tamanho_piscina, etc.
      - Timestamps: created_at, updated_at
  
  2. Changes
    - Create service_locations table
    - Add appropriate indexes
    - Enable RLS with policies
    - Migrate existing address data
    - Remove old address fields
  
  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create service_locations table
CREATE TABLE IF NOT EXISTS service_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_primary boolean DEFAULT false,
  
  -- Address fields
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
  address_validated boolean DEFAULT false,
  
  -- Pool specific fields
  tipo_piscina text,
  tamanho_piscina text,
  produtos_utilizados text,
  equipamentos text,
  horario_preferido text,
  observacoes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_locations_client_id ON service_locations(client_id);
CREATE INDEX IF NOT EXISTS idx_service_locations_coordinates 
ON service_locations(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Enable RLS
ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_locations' 
        AND policyname = 'Service locations are viewable by authenticated users'
    ) THEN
        CREATE POLICY "Service locations are viewable by authenticated users" 
        ON service_locations FOR SELECT TO authenticated 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_locations' 
        AND policyname = 'Service locations are insertable by authenticated users'
    ) THEN
        CREATE POLICY "Service locations are insertable by authenticated users" 
        ON service_locations FOR INSERT TO authenticated 
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_locations' 
        AND policyname = 'Service locations are updatable by authenticated users'
    ) THEN
        CREATE POLICY "Service locations are updatable by authenticated users" 
        ON service_locations FOR UPDATE TO authenticated 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_locations' 
        AND policyname = 'Service locations are deletable by authenticated users'
    ) THEN
        CREATE POLICY "Service locations are deletable by authenticated users" 
        ON service_locations FOR DELETE TO authenticated 
        USING (true);
    END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_locations_updated_at
    BEFORE UPDATE ON service_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing data from address field if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'address'
    ) THEN
        INSERT INTO service_locations (
            client_id,
            name,
            is_primary,
            street,
            tipo_piscina,
            tamanho_piscina,
            produtos_utilizados,
            equipamentos,
            horario_preferido,
            observacoes,
            complemento,
            ponto_referencia,
            instrucoes_acesso
        )
        SELECT 
            id as client_id,
            'Endereço Principal' as name,
            true as is_primary,
            address as street,
            tipo_piscina,
            tamanho_piscina,
            produtos_utilizados,
            equipamentos,
            horario_preferido,
            observacoes,
            complemento,
            ponto_referencia,
            instrucoes_acesso
        FROM clients
        WHERE address IS NOT NULL;

        -- Remove old address field
        ALTER TABLE clients DROP COLUMN IF EXISTS address;
    END IF;
END $$;