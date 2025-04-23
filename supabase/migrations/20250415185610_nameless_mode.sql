/*
  # Add new client fields

  1. New Fields
    - `complemento` (text, nullable) - Additional address information
    - `ponto_referencia` (text, nullable) - Reference point for the address
    - `instrucoes_acesso` (text, nullable) - Access instructions
    - `tamanho_piscina` (text, nullable) - Pool size
    - `produtos_utilizados` (text, nullable) - Chemical products used
    - `equipamentos` (text, nullable) - Available equipment
    - `horario_preferido` (text, nullable) - Preferred service time
    - `como_conheceu` (text, nullable) - How they found us
*/

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS complemento text,
ADD COLUMN IF NOT EXISTS ponto_referencia text,
ADD COLUMN IF NOT EXISTS instrucoes_acesso text,
ADD COLUMN IF NOT EXISTS tamanho_piscina text,
ADD COLUMN IF NOT EXISTS produtos_utilizados text,
ADD COLUMN IF NOT EXISTS equipamentos text,
ADD COLUMN IF NOT EXISTS horario_preferido text,
ADD COLUMN IF NOT EXISTS como_conheceu text;