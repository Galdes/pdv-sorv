-- Corrigir políticas RLS para categorias
-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver categorias do seu bar" ON categorias;
DROP POLICY IF EXISTS "Usuários podem inserir categorias no seu bar" ON categorias;
DROP POLICY IF EXISTS "Usuários podem atualizar categorias do seu bar" ON categorias;
DROP POLICY IF EXISTS "Usuários podem deletar categorias do seu bar" ON categorias;

-- Criar novas políticas que funcionam com nosso sistema de login
CREATE POLICY "Permitir todas as operações em categorias" ON categorias
    FOR ALL USING (true)
    WITH CHECK (true);

-- Ou, se preferir manter alguma segurança, usar uma política mais simples:
-- CREATE POLICY "Permitir operações em categorias por bar_id" ON categorias
--     FOR ALL USING (bar_id IS NOT NULL)
--     WITH CHECK (bar_id IS NOT NULL); 