-- Corrigir políticas RLS para sabores
-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver sabores do seu bar" ON sabores;
DROP POLICY IF EXISTS "Usuários podem inserir sabores no seu bar" ON sabores;
DROP POLICY IF EXISTS "Usuários podem atualizar sabores do seu bar" ON sabores;
DROP POLICY IF EXISTS "Usuários podem deletar sabores do seu bar" ON sabores;

-- Criar novas políticas que funcionam com nosso sistema de login
CREATE POLICY "Permitir todas as operações em sabores" ON sabores
    FOR ALL USING (true)
    WITH CHECK (true);

-- Ou, se preferir manter alguma segurança, usar uma política mais simples:
-- CREATE POLICY "Permitir operações em sabores por bar_id" ON sabores
--     FOR ALL USING (bar_id IS NOT NULL)
--     WITH CHECK (bar_id IS NOT NULL); 