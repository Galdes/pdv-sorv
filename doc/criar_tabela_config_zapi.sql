-- Script para criar a tabela de configurações da Z-API
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela de configurações Z-API
CREATE TABLE IF NOT EXISTS config_zapi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_id UUID REFERENCES bares(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  instancia_id TEXT NOT NULL,
  token TEXT NOT NULL,
  status_conexao TEXT DEFAULT 'desconectado' CHECK (status_conexao IN ('conectado', 'desconectado', 'reconectando')),
  ultima_verificacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bar_id)
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE config_zapi ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para permitir acesso apenas aos donos dos estabelecimentos
CREATE POLICY "Usuários podem ver configurações Z-API do próprio estabelecimento" ON config_zapi
  FOR SELECT USING (
    bar_id IN (
      SELECT id FROM bares 
      WHERE id = bar_id
    )
  );

CREATE POLICY "Dono pode editar configurações Z-API do próprio estabelecimento" ON config_zapi
  FOR ALL USING (
    bar_id IN (
      SELECT id FROM bares 
      WHERE id = bar_id
    )
  );

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_config_zapi_bar_id ON config_zapi(bar_id);

-- 5. Inserir configuração padrão para o estabelecimento existente (se necessário)
-- Substitua o UUID abaixo pelo ID real do seu estabelecimento
INSERT INTO config_zapi (bar_id, instancia_id, token, ativo, status_conexao)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000', -- Substitua pelo ID real do seu estabelecimento
  '3E29A3AF9423B0EA10A44AAAADA6D328',
  '7D1DE18113C654C07EA765C7',
  true,
  'desconectado'
) ON CONFLICT (bar_id) DO NOTHING;

-- 6. Comentários da tabela
COMMENT ON TABLE config_zapi IS 'Configurações da Z-API para cada estabelecimento';
COMMENT ON COLUMN config_zapi.bar_id IS 'ID do estabelecimento';
COMMENT ON COLUMN config_zapi.instancia_id IS 'ID da instância Z-API';
COMMENT ON COLUMN config_zapi.token IS 'Token de autenticação Z-API';
COMMENT ON COLUMN config_zapi.status_conexao IS 'Status atual da conexão: conectado, desconectado, reconectando';
COMMENT ON COLUMN config_zapi.ultima_verificacao IS 'Data/hora da última verificação de status';
