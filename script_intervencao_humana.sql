-- Script para adicionar campos de intervenção humana na tabela conversas_whatsapp
-- Execute este script no Supabase SQL Editor

-- Adicionar campos para controle de intervenção humana na tabela conversas_whatsapp
ALTER TABLE conversas_whatsapp 
ADD COLUMN modo_atendimento text DEFAULT 'bot',
ADD COLUMN atendente_id uuid,
ADD COLUMN atendente_nome text,
ADD COLUMN assumido_em timestamp with time zone,
ADD COLUMN bloqueado_ate timestamp with time zone;

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN conversas_whatsapp.modo_atendimento IS 'Modo de atendimento: bot ou humano';
COMMENT ON COLUMN conversas_whatsapp.atendente_id IS 'ID do usuário que assumiu a conversa';
COMMENT ON COLUMN conversas_whatsapp.atendente_nome IS 'Nome do atendente que assumiu';
COMMENT ON COLUMN conversas_whatsapp.assumido_em IS 'Timestamp quando a conversa foi assumida';
COMMENT ON COLUMN conversas_whatsapp.bloqueado_ate IS 'Timestamp quando o bloqueio expira (5 minutos)';

-- Criar índice para melhor performance nas consultas por modo_atendimento
CREATE INDEX idx_conversas_modo_atendimento ON conversas_whatsapp(modo_atendimento);

-- Criar índice para consultas por atendente
CREATE INDEX idx_conversas_atendente_id ON conversas_whatsapp(atendente_id);

-- Verificar se os campos foram adicionados corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversas_whatsapp' 
    AND column_name IN ('modo_atendimento', 'atendente_id', 'atendente_nome', 'assumido_em', 'bloqueado_ate')
ORDER BY column_name;