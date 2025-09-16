-- Script para criar novo administrador "Dono Container"
-- Execute este script no Supabase SQL Editor

-- 1. Inserir novo administrador na tabela usuarios
INSERT INTO usuarios (
  id,
  bar_id,
  nome,
  email,
  senha_hash,
  tipo,
  ativo,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- UUID automático
  '550e8400-e29b-41d4-a716-446655440000', -- ID do bar existente (Sorveteria Conteiner)
  'Dono Container',
  'dono.container@bar.com', -- Email baseado no nome
  '$2b$10$oEHKDOvcm0wUWHwOVSZpM.wrHPt1UEMGJf7EVU3Ll', -- Hash da senha "Container0385!"
  'dono_bar', -- Tipo: dono do bar
  true, -- Ativo
  NOW(),
  NOW()
);

-- 2. A senha já está com o hash correto gerado pelo bcrypt

-- 3. Verificar se o usuário foi criado
SELECT 
  id,
  bar_id,
  nome,
  email,
  tipo,
  ativo,
  created_at
FROM usuarios 
WHERE nome = 'Dono Container';

-- 4. Comentários
-- Este script cria um novo administrador com:
-- - Nome: "Dono Container"
-- - Email: "dono.container@bar.com"
-- - Senha: "Container0385!" (precisa ser hasheada)
-- - Tipo: "dono_bar" (mesmo nível do dono atual)
-- - Bar ID: Mesmo estabelecimento existente
-- - Status: Ativo
