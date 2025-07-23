-- Corrigir políticas RLS para produtos
-- Remover políticas antigas que podem estar bloqueando UPDATE
DROP POLICY IF EXISTS "Usuários podem ver produtos do seu bar" ON produtos;
DROP POLICY IF EXISTS "Usuários podem inserir produtos no seu bar" ON produtos;
DROP POLICY IF EXISTS "Usuários podem atualizar produtos do seu bar" ON produtos;
DROP POLICY IF EXISTS "Usuários podem deletar produtos do seu bar" ON produtos;

-- Criar nova política permissiva que funciona com nosso sistema de login
CREATE POLICY "Permitir todas as operações em produtos" ON produtos
    FOR ALL USING (true)
    WITH CHECK (true);

-- Verificar se a tabela produtos tem RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'produtos';

-- Verificar políticas atuais
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'produtos';

-- Testar uma atualização simples
UPDATE produtos 
SET max_sabores = max_sabores 
WHERE id = '91992e88-b63d-4492-bb74-e2a16156c516' 
RETURNING id, nome, max_sabores; 