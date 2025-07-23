-- Schema para Delivery e Vendas por WhatsApp - VERSÃO CORRIGIDA
-- Execute este script no Supabase SQL Editor

-- 1. Tabela de endereços de entrega
CREATE TABLE IF NOT EXISTS enderecos_entrega (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_destinatario TEXT NOT NULL,
  telefone TEXT NOT NULL,
  cep TEXT,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  referencia TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de pedidos de delivery/WhatsApp
CREATE TABLE IF NOT EXISTS pedidos_externos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_id UUID REFERENCES bares(id) ON DELETE CASCADE,
  endereco_id UUID REFERENCES enderecos_entrega(id),
  tipo_pedido TEXT NOT NULL CHECK (tipo_pedido IN ('delivery', 'whatsapp', 'ecommerce')),
  tipo_servico TEXT NOT NULL CHECK (tipo_servico IN ('entrega', 'retirada')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'preparando', 'pronto', 'em_entrega', 'entregue', 'cancelado')),
  
  -- Informações de pagamento (cliente escolhe, atendente confirma)
  forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'cartao', 'dinheiro')),
  valor_subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_taxa_entrega DECIMAL(10,2) DEFAULT 0,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_pago DECIMAL(10,2) DEFAULT 0,
  valor_troco DECIMAL(10,2) DEFAULT 0,
  pagamento_confirmado BOOLEAN DEFAULT false,
  
  -- Informações de entrega
  horario_entrega TIMESTAMP WITH TIME ZONE,
  tempo_estimado_entrega INTEGER, -- em minutos
  observacoes TEXT,
  usuario_id UUID REFERENCES usuarios(id), -- atendente que processou
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de itens dos pedidos externos
CREATE TABLE IF NOT EXISTS itens_pedido_externo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_externo_id UUID REFERENCES pedidos_externos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  observacoes TEXT, -- para sabores escolhidos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de configurações de delivery
CREATE TABLE IF NOT EXISTS config_delivery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_id UUID REFERENCES bares(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  taxa_entrega_fixa DECIMAL(10,2) DEFAULT 0,
  taxa_entrega_por_km DECIMAL(10,2) DEFAULT 0,
  raio_entrega_km DECIMAL(5,2) DEFAULT 5.0,
  tempo_estimado_min INTEGER DEFAULT 30,
  horario_inicio TIME DEFAULT '10:00',
  horario_fim TIME DEFAULT '22:00',
  dias_funcionamento TEXT[] DEFAULT ARRAY['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
  valor_minimo_pedido DECIMAL(10,2) DEFAULT 0,
  aceita_retirada BOOLEAN DEFAULT true,
  aceita_entrega BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de configurações de WhatsApp
CREATE TABLE IF NOT EXISTS config_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_id UUID REFERENCES bares(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  numero_whatsapp TEXT NOT NULL,
  mensagem_boas_vindas TEXT,
  mensagem_menu TEXT,
  horario_atendimento TEXT,
  link_cardapio TEXT, -- Link para o cardápio digital
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de histórico de conversas WhatsApp
CREATE TABLE IF NOT EXISTS conversas_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_id UUID REFERENCES bares(id) ON DELETE CASCADE,
  numero_cliente TEXT NOT NULL,
  nome_cliente TEXT,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'finalizada', 'cancelada')),
  ultima_mensagem_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id UUID REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  conteudo TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_externos_bar_id ON pedidos_externos(bar_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_externos_status ON pedidos_externos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_externos_tipo ON pedidos_externos(tipo_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_externos_tipo_servico ON pedidos_externos(tipo_servico);
CREATE INDEX IF NOT EXISTS idx_enderecos_cliente_id ON enderecos_entrega(id);
CREATE INDEX IF NOT EXISTS idx_conversas_numero ON conversas_whatsapp(numero_cliente);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_externo_pedido_id ON itens_pedido_externo(pedido_externo_id);
CREATE INDEX IF NOT EXISTS idx_config_delivery_bar_id ON config_delivery(bar_id);
CREATE INDEX IF NOT EXISTS idx_config_whatsapp_bar_id ON config_whatsapp(bar_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE enderecos_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_externos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido_externo ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_whatsapp ENABLE ROW LEVEL SECURITY;

-- REMOVER políticas existentes antes de criar novas
DROP POLICY IF EXISTS "Permitir acesso total" ON enderecos_entrega;
DROP POLICY IF EXISTS "Permitir acesso total" ON pedidos_externos;
DROP POLICY IF EXISTS "Permitir acesso total" ON itens_pedido_externo;
DROP POLICY IF EXISTS "Permitir acesso total" ON config_delivery;
DROP POLICY IF EXISTS "Permitir acesso total" ON config_whatsapp;
DROP POLICY IF EXISTS "Permitir acesso total" ON conversas_whatsapp;
DROP POLICY IF EXISTS "Permitir acesso total" ON mensagens_whatsapp;

-- Criar políticas permissivas (ajustar conforme necessário)
CREATE POLICY "Permitir acesso total" ON enderecos_entrega FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total" ON pedidos_externos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total" ON itens_pedido_externo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total" ON config_delivery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total" ON config_whatsapp FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total" ON conversas_whatsapp FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total" ON mensagens_whatsapp FOR ALL USING (true) WITH CHECK (true);

-- Função para calcular taxa de entrega
CREATE OR REPLACE FUNCTION calcular_taxa_entrega(
  p_bar_id UUID,
  p_distancia_km DECIMAL(5,2),
  p_tipo_servico TEXT
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config RECORD;
  v_taxa DECIMAL(10,2);
BEGIN
  -- Buscar configurações do bar
  SELECT * INTO v_config
  FROM config_delivery
  WHERE bar_id = p_bar_id AND ativo = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calcular taxa baseada na configuração
  v_taxa := v_config.taxa_entrega_fixa;
  
  -- Adicionar taxa por km se aplicável
  IF p_tipo_servico = 'entrega' AND p_distancia_km > 0 THEN
    v_taxa := v_taxa + (p_distancia_km * v_config.taxa_entrega_por_km);
  END IF;
  
  RETURN v_taxa;
END;
$$;

-- Função para processar pedido externo
CREATE OR REPLACE FUNCTION processar_pedido_externo(
  p_bar_id UUID,
  p_tipo_servico TEXT,
  p_forma_pagamento TEXT,
  p_valor_subtotal DECIMAL(10,2),
  p_taxa_entrega DECIMAL(10,2),
  p_observacoes TEXT DEFAULT NULL,
  p_endereco_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido_id UUID;
  v_valor_total DECIMAL(10,2);
BEGIN
  -- Calcular valor total
  v_valor_total := p_valor_subtotal + p_taxa_entrega;
  
  -- Inserir pedido
  INSERT INTO pedidos_externos (
    bar_id,
    endereco_id,
    tipo_pedido,
    tipo_servico,
    status,
    forma_pagamento,
    valor_subtotal,
    valor_taxa_entrega,
    valor_total,
    observacoes
  ) VALUES (
    p_bar_id,
    p_endereco_id,
    'ecommerce',
    p_tipo_servico,
    'pendente',
    p_forma_pagamento,
    p_valor_subtotal,
    p_taxa_entrega,
    v_valor_total,
    p_observacoes
  ) RETURNING id INTO v_pedido_id;
  
  RETURN v_pedido_id;
END;
$$;

-- Função para confirmar pagamento (atendente)
CREATE OR REPLACE FUNCTION confirmar_pagamento_atendente(
  p_pedido_id UUID,
  p_usuario_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar pedido
  UPDATE pedidos_externos
  SET 
    pagamento_confirmado = true,
    status = 'confirmado',
    usuario_id = p_usuario_id,
    updated_at = NOW()
  WHERE id = p_pedido_id;
  
  RETURN FOUND;
END;
$$;

-- Inserir dados de exemplo para a Sorveteria Conteiner
INSERT INTO config_delivery (
  bar_id, ativo, taxa_entrega_fixa, taxa_entrega_por_km, raio_entrega_km, 
  tempo_estimado_min, horario_inicio, horario_fim, dias_funcionamento,
  valor_minimo_pedido, aceita_retirada, aceita_entrega
)
SELECT 
  id, true, 5.00, 2.00, 5.0, 30, '10:00', '22:00', 
  ARRAY['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
  15.00, true, true
FROM bares 
WHERE nome = 'Sorveteria Conteiner'
ON CONFLICT DO NOTHING;

INSERT INTO config_whatsapp (
  bar_id, ativo, numero_whatsapp, mensagem_boas_vindas, mensagem_menu, link_cardapio
)
SELECT 
  id, true, '5511999999999', 
  'Olá! Bem-vindo à Sorveteria Conteiner! Como posso ajudar?',
  'Confira nosso cardápio completo:',
  'https://sorveteria-conteiner.com/delivery/cardapio'
FROM bares 
WHERE nome = 'Sorveteria Conteiner'
ON CONFLICT DO NOTHING; 