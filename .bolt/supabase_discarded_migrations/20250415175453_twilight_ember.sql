/*
  # Esquema de Gerenciamento de Serviços de Piscina

  1. Novas Tabelas
    - `cleaners` (limpadores)
      - `id` (uuid, chave primária)
      - `name` (texto)
      - `email` (texto, único)
      - `phone` (texto)
      - `active` (booleano)
      - `created_at` (timestamp)
    
    - `appointments` (agendamentos)
      - `id` (uuid, chave primária)
      - `client_name` (texto)
      - `address` (texto)
      - `cleaner_id` (uuid, chave estrangeira)
      - `status` (enum: agendado, em_andamento, concluido)
      - `scheduled_at` (timestamp)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
      - `description` (texto)
      - `latitude` (float)
      - `longitude` (float)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Adicionar políticas para usuários autenticados
*/

-- Criar tipos personalizados
CREATE TYPE appointment_status AS ENUM ('agendado', 'em_andamento', 'concluido');

-- Criar tabela de limpadores
CREATE TABLE IF NOT EXISTS cleaners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  address text NOT NULL,
  cleaner_id uuid REFERENCES cleaners(id),
  status appointment_status DEFAULT 'agendado',
  scheduled_at timestamptz NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  description text,
  latitude float,
  longitude float,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Permitir acesso de leitura autenticado" ON cleaners
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir acesso total autenticado" ON appointments
  FOR ALL TO authenticated USING (true);