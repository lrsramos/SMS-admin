/*
  # Add missing client fields

  1. Changes
    - Add missing columns to clients table for storing additional client information:
      - complemento (text): Additional address details
      - ponto_referencia (text): Reference point for the address
      - instrucoes_acesso (text): Access instructions
      - tipo_piscina (text): Pool type
      - tamanho_piscina (text): Pool size
      - produtos_utilizados (text): Products used
      - equipamentos (text): Equipment
      - horario_preferido (text): Preferred schedule
      - observacoes (text): Additional observations
      - como_conheceu (text): How they found us
      - address_validated (boolean): Whether the address has been validated
      - street (text): Street name
      - street_number (text): Street number
      - neighborhood (text): Neighborhood
      - city (text): City
      - state (text): State
      - postal_code (text): Postal code
      - latitude (double precision): Location latitude
      - longitude (double precision): Location longitude

  2. Security
    - No changes to RLS policies needed
*/

DO $$ 
BEGIN
  -- Address fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'complemento') THEN
    ALTER TABLE clients ADD COLUMN complemento text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'ponto_referencia') THEN
    ALTER TABLE clients ADD COLUMN ponto_referencia text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'instrucoes_acesso') THEN
    ALTER TABLE clients ADD COLUMN instrucoes_acesso text;
  END IF;

  -- Pool information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tipo_piscina') THEN
    ALTER TABLE clients ADD COLUMN tipo_piscina text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tamanho_piscina') THEN
    ALTER TABLE clients ADD COLUMN tamanho_piscina text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'produtos_utilizados') THEN
    ALTER TABLE clients ADD COLUMN produtos_utilizados text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'equipamentos') THEN
    ALTER TABLE clients ADD COLUMN equipamentos text;
  END IF;

  -- Preferences and additional info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'horario_preferido') THEN
    ALTER TABLE clients ADD COLUMN horario_preferido text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'observacoes') THEN
    ALTER TABLE clients ADD COLUMN observacoes text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'como_conheceu') THEN
    ALTER TABLE clients ADD COLUMN como_conheceu text;
  END IF;

  -- Address validation and components
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'address_validated') THEN
    ALTER TABLE clients ADD COLUMN address_validated boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'street') THEN
    ALTER TABLE clients ADD COLUMN street text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'street_number') THEN
    ALTER TABLE clients ADD COLUMN street_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'neighborhood') THEN
    ALTER TABLE clients ADD COLUMN neighborhood text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'city') THEN
    ALTER TABLE clients ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'state') THEN
    ALTER TABLE clients ADD COLUMN state text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'postal_code') THEN
    ALTER TABLE clients ADD COLUMN postal_code text;
  END IF;

  -- Geolocation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'latitude') THEN
    ALTER TABLE clients ADD COLUMN latitude double precision;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'longitude') THEN
    ALTER TABLE clients ADD COLUMN longitude double precision;
  END IF;
END $$;