-- Atualizar funções para incluir o campo max_sabores

-- Remover funções existentes primeiro
DROP FUNCTION IF EXISTS buscar_produtos_com_sabores(UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS buscar_produtos_completo(UUID, UUID, UUID, BOOLEAN);

-- Atualizar função buscar_produtos_com_sabores
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
    max_sabores INTEGER,
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
        COALESCE(p.max_sabores, 1) as max_sabores,
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

-- Atualizar função buscar_produtos_completo (mantida para compatibilidade)
CREATE OR REPLACE FUNCTION buscar_produtos_completo(
    p_bar_id UUID DEFAULT NULL,
    p_categoria_id UUID DEFAULT NULL,
    p_sabor_id UUID DEFAULT NULL,
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
    sabor_id UUID,
    sabor_nome VARCHAR,
    max_sabores INTEGER,
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
        p.sabor_id,
        s.nome as sabor_nome,
        COALESCE(p.max_sabores, 1) as max_sabores,
        p.created_at,
        p.updated_at
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN sabores s ON p.sabor_id = s.id
    WHERE (p_bar_id IS NULL OR p.bar_id = p_bar_id)
    AND (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)
    AND (p_sabor_id IS NULL OR p.sabor_id = p_sabor_id)
    AND (p_ativo IS NULL OR p.ativo = p_ativo)
    ORDER BY c.nome, p.nome;
END;
$$ LANGUAGE plpgsql; 