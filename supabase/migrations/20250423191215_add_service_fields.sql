-- Criar tabela de tipos de serviço primeiro
CREATE TABLE IF NOT EXISTS service_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  price decimal(10,2) NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'bi_weekly', 'monthly', 'one_time')),
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de tarefas de serviço
CREATE TABLE IF NOT EXISTS service_tasks (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Inserir tipos de serviço padrão
INSERT INTO service_types (id, name, description, duration_minutes, price, frequency) VALUES
  ('weekly', 'Limpeza Semanal', 'Manutenção semanal regular incluindo peneiração, aspiração, escovação e balanceamento químico', 60, 100.00, 'weekly'),
  ('bi_weekly', 'Limpeza Quinzenal', 'Manutenção a cada duas semanas incluindo todas as tarefas básicas de limpeza', 90, 150.00, 'bi_weekly'),
  ('monthly', 'Limpeza Mensal', 'Limpeza mensal completa incluindo manutenção do filtro', 120, 200.00, 'monthly')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  price = EXCLUDED.price,
  frequency = EXCLUDED.frequency;

-- Inserir tarefas de serviço padrão
INSERT INTO service_tasks (id, name, description, duration_minutes, price) VALUES
  ('skimming', 'Peneiração', 'Remover folhas e detritos da superfície da piscina', 15, 20.00),
  ('vacuuming', 'Aspiração', 'Limpar o fundo e as paredes da piscina', 30, 40.00),
  ('brushing', 'Escovação', 'Escovar paredes, degraus e linha da água', 20, 25.00),
  ('basket_empty', 'Limpeza de Cestos', 'Limpar cestos do skimmer e da bomba', 10, 15.00),
  ('chemistry', 'Química da Água', 'Testar e balancear produtos químicos da piscina', 20, 30.00),
  ('filter', 'Manutenção do Filtro', 'Retrolavar ou limpar sistema de filtro', 30, 45.00),
  ('algae', 'Tratamento de Algas', 'Remover e prevenir crescimento de algas', 45, 60.00),
  ('shock', 'Tratamento de Choque', 'Tratamento de supercloração', 30, 40.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  price = EXCLUDED.price;

-- Criar a tabela de agendamentos se não existir
CREATE TABLE IF NOT EXISTS appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Adicionar colunas necessárias se não existirem
DO $$ 
BEGIN
    -- Remover a coluna client_name se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'appointments' AND column_name = 'client_name') THEN
        ALTER TABLE appointments DROP COLUMN client_name;
    END IF;

    -- Remover a coluna address se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'appointments' AND column_name = 'address') THEN
        ALTER TABLE appointments DROP COLUMN address;
    END IF;

    -- Adicionar client_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'client_id') THEN
        -- Primeiro adicionar a coluna como nullable
        ALTER TABLE appointments ADD COLUMN client_id uuid;
        -- Atualizar registros existentes com um valor padrão (você precisará ajustar isso)
        UPDATE appointments SET client_id = '00000000-0000-0000-0000-000000000000' WHERE client_id IS NULL;
        -- Agora tornar a coluna NOT NULL
        ALTER TABLE appointments ALTER COLUMN client_id SET NOT NULL;
    END IF;

    -- Adicionar service_location_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'service_location_id') THEN
        -- Primeiro adicionar a coluna como nullable
        ALTER TABLE appointments ADD COLUMN service_location_id uuid;
        -- Atualizar registros existentes com um valor padrão
        UPDATE appointments SET service_location_id = '00000000-0000-0000-0000-000000000000' WHERE service_location_id IS NULL;
        -- Agora tornar a coluna NOT NULL
        ALTER TABLE appointments ALTER COLUMN service_location_id SET NOT NULL;
    END IF;

    -- Adicionar cleaner_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'cleaner_id') THEN
        -- Primeiro adicionar a coluna como nullable
        ALTER TABLE appointments ADD COLUMN cleaner_id uuid;
        -- Atualizar registros existentes com um valor padrão
        UPDATE appointments SET cleaner_id = '00000000-0000-0000-0000-000000000000' WHERE cleaner_id IS NULL;
        -- Agora tornar a coluna NOT NULL
        ALTER TABLE appointments ALTER COLUMN cleaner_id SET NOT NULL;
    END IF;

    -- Adicionar scheduled_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'scheduled_at') THEN
        -- Primeiro adicionar a coluna como nullable
        ALTER TABLE appointments ADD COLUMN scheduled_at timestamptz;
        -- Atualizar registros existentes com a data atual
        UPDATE appointments SET scheduled_at = now() WHERE scheduled_at IS NULL;
        -- Agora tornar a coluna NOT NULL
        ALTER TABLE appointments ALTER COLUMN scheduled_at SET NOT NULL;
    END IF;

    -- Adicionar status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'status') THEN
        -- Primeiro adicionar a coluna como nullable
        ALTER TABLE appointments ADD COLUMN status text;
        -- Atualizar registros existentes com um valor padrão
        UPDATE appointments SET status = 'scheduled' WHERE status IS NULL;
        -- Agora tornar a coluna NOT NULL e adicionar a constraint
        ALTER TABLE appointments ALTER COLUMN status SET NOT NULL;
        ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
            CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));
    END IF;

    -- Adicionar description se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'description') THEN
        ALTER TABLE appointments ADD COLUMN description text;
    END IF;

    -- Adicionar service_type_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'service_type_id') THEN
        ALTER TABLE appointments ADD COLUMN service_type_id text REFERENCES service_types(id);
    END IF;

    -- Adicionar service_tasks se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'service_tasks') THEN
        ALTER TABLE appointments ADD COLUMN service_tasks text[];
    END IF;

    -- Adicionar additional_notes se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'additional_notes') THEN
        ALTER TABLE appointments ADD COLUMN additional_notes text;
    END IF;

    -- Adicionar frequency se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'frequency') THEN
        ALTER TABLE appointments ADD COLUMN frequency text;
        ALTER TABLE appointments ADD CONSTRAINT appointments_frequency_check 
            CHECK (frequency IN ('weekly', 'bi_weekly', 'monthly', 'one_time'));
    END IF;

    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'updated_at') THEN
        ALTER TABLE appointments ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_cleaner_id ON appointments(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_service_location_id ON appointments(service_location_id);

-- Habilitar RLS nas novas tabelas
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Criar políticas para as novas tabelas
CREATE POLICY "Permitir acesso de leitura para usuários autenticados" ON service_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir acesso de leitura para usuários autenticados" ON service_tasks
  FOR SELECT TO authenticated USING (true);

-- Políticas para a tabela de agendamentos
CREATE POLICY "Permitir acesso total para usuários autenticados" ON appointments
  FOR ALL TO authenticated USING (true); 