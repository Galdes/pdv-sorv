-- Corrigir estrutura das tabelas
-- Adicionar colunas que estão faltando

-- Adicionar coluna descricao na tabela bares (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bares' AND column_name = 'descricao'
    ) THEN
        ALTER TABLE bares ADD COLUMN descricao TEXT;
    END IF;
END $$;

-- Adicionar colunas categoria_id e sabor_id na tabela produtos (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'produtos' AND column_name = 'categoria_id'
    ) THEN
        ALTER TABLE produtos ADD COLUMN categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'produtos' AND column_name = 'sabor_id'
    ) THEN
        ALTER TABLE produtos ADD COLUMN sabor_id UUID REFERENCES sabores(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Criar índices para as novas colunas (se não existirem)
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_sabor_id ON produtos(sabor_id);

-- Verificar se a função buscar_produtos_completo existe, se não, criar
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