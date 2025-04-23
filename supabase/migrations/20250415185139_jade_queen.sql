/*
  # Adicionar campos adicionais à tabela de clientes

  1. Novos Campos
    - `tipo_piscina` (text) - Tipo da piscina (Vinil, Fibra, Alvenaria)
    - `frequencia_limpeza` (text) - Frequência de limpeza desejada
    - `observacoes` (text) - Observações adicionais
    - `telefone` (text) - Número de telefone

  2. Segurança
    - Mantém as políticas RLS existentes
*/

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS tipo_piscina text,
ADD COLUMN IF NOT EXISTS frequencia_limpeza text,
ADD COLUMN IF NOT EXISTS observacoes text,
ADD COLUMN IF NOT EXISTS telefone text;