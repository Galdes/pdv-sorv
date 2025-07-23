-- Adicionar suporte a múltiplos sabores nos produtos
-- Criar tabela de relacionamento produto_sabores

-- Criar tabela de relacionamento
CREATE TABLE IF NOT EXISTS produto_sabores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
    sabor_id UUID REFERENCES sabores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(produto_id, sabor_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_produto_sabores_produto_id ON produto_sabores(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_sabores_sabor_id ON produto_sabores(sabor_id);

-- RLS (Row Level Security)
ALTER TABLE produto_sabores ENABLE ROW LEVEL SECURITY;

-- Remover política existente se houver
DROP POLICY IF EXISTS "Permitir todas as operações em produto_sabores" ON produto_sabores;

-- Políticas RLS permissivas para funcionar com nosso sistema de login
CREATE POLICY "Permitir todas as operações em produto_sabores" ON produto_sabores
    FOR ALL USING (true)
    WITH CHECK (true);

-- Função para buscar produtos com múltiplos sabores
CREATE OR REPLACE FUNCTION buscar_produtos_com_sabores(
    p_bar_id UUID DEFAULT NULL,
    p_categoria_id UUID DEFAULT NULL,
    p_ativo BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    nome VARCHAR,
    descricao TEXT,
    preco DECIMAL,
    imagem_url TEXT,
    ativo BOOLEAN,
    bar_id UUID,
    categoria_id UUID,
    categoria_nome VARCHAR,
    sabores TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nome,
        p.descricao,
        p.preco,
        p.imagem_url,
        p.ativo,
        p.bar_id,
        p.categoria_id,
        c.nome as categoria_nome,
        COALESCE(
            (SELECT string_agg(s.nome, ', ' ORDER BY s.nome)
             FROM produto_sabores ps
             JOIN sabores s ON ps.sabor_id = s.id
             WHERE ps.produto_id = p.id), 
            'Sem sabor específico'
        ) as sabores,
        p.created_at,
        p.updated_at
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE (p_bar_id IS NULL OR p.bar_id = p_bar_id)
    AND (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
    AND (p_ativo IS NULL OR p.ativo = p_ativo)
    ORDER BY c.nome, p.nome;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar sabores a um produto
CREATE OR REPLACE FUNCTION adicionar_sabores_ao_produto(
    p_produto_id UUID,
    p_sabores_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
    sabor_id UUID;
BEGIN
    -- Remover sabores existentes
    DELETE FROM produto_sabores WHERE produto_id = p_produto_id;
    
    -- Adicionar novos sabores
    FOREACH sabor_id IN ARRAY p_sabores_ids
    LOOP
        INSERT INTO produto_sabores (produto_id, sabor_id)
        VALUES (p_produto_id, sabor_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar sabores de um produto
CREATE OR REPLACE FUNCTION buscar_sabores_do_produto(p_produto_id UUID)
RETURNS TABLE (
    sabor_id UUID,
    sabor_nome VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.nome
    FROM produto_sabores ps
    JOIN sabores s ON ps.sabor_id = s.id
    WHERE ps.produto_id = p_produto_id
    ORDER BY s.nome;
END;
$$ LANGUAGE plpgsql; 