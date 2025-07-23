-- Funções para processamento de pagamentos e fechamento de comandas
-- Execute este script no Supabase SQL Editor

-- Função para processar pagamento parcial
DROP FUNCTION IF EXISTS processar_pagamento_parcial(UUID, DECIMAL, UUID, TEXT);
CREATE OR REPLACE FUNCTION processar_pagamento_parcial(
  p_mesa_id UUID,
  p_valor_pago DECIMAL(10,2),
  p_usuario_id UUID,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comanda_id UUID;
  v_pedidos RECORD;
  v_valor_restante DECIMAL(10,2);
  v_valor_aplicar DECIMAL(10,2);
BEGIN
  -- Buscar comanda aberta da mesa
  SELECT id INTO v_comanda_id
  FROM comandas
  WHERE mesa_id = p_mesa_id AND status = 'aberta'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_comanda_id IS NULL THEN
    RETURN json_build_object('error', 'Nenhuma comanda aberta encontrada para esta mesa');
  END IF;
  
  -- Registrar pagamento
  INSERT INTO pagamentos_mesa (
    mesa_id,
    valor_total_mesa,
    valor_pago,
    valor_restante,
    tipo_pagamento,
    observacoes,
    usuario_id
  ) VALUES (
    p_mesa_id,
    (SELECT COALESCE(SUM(valor_restante), SUM(subtotal)) FROM pedidos WHERE comanda_id = v_comanda_id AND status != 'cancelado'),
    p_valor_pago,
    (SELECT COALESCE(SUM(valor_restante), SUM(subtotal)) FROM pedidos WHERE comanda_id = v_comanda_id AND status != 'cancelado') - p_valor_pago,
    'parcial',
    p_observacoes,
    p_usuario_id
  );
  
  -- Aplicar pagamento aos pedidos (do mais antigo para o mais novo)
  v_valor_restante := p_valor_pago;
  
  FOR v_pedidos IN 
    SELECT id, COALESCE(valor_restante, subtotal) as valor_devido
    FROM pedidos 
    WHERE comanda_id = v_comanda_id AND status != 'cancelado'
    ORDER BY created_at ASC
  LOOP
    IF v_valor_restante <= 0 THEN
      EXIT;
    END IF;
    
    v_valor_aplicar := LEAST(v_valor_restante, v_pedidos.valor_devido);
    
    UPDATE pedidos 
    SET 
      valor_pago = COALESCE(valor_pago, 0) + v_valor_aplicar,
      valor_restante = v_pedidos.valor_devido - v_valor_aplicar,
      status = CASE 
        WHEN v_pedidos.valor_devido - v_valor_aplicar <= 0 THEN 'pago'
        ELSE status
      END
    WHERE id = v_pedidos.id;
    
    v_valor_restante := v_valor_restante - v_valor_aplicar;
  END LOOP;
  
  -- Verificar se todos os pedidos foram pagos para fechar a comanda
  PERFORM verificar_e_fechar_comanda(v_comanda_id);
  
  RETURN json_build_object('success', true, 'message', 'Pagamento parcial processado com sucesso');
END;
$$;

-- Função para processar pagamento seletivo
DROP FUNCTION IF EXISTS processar_pagamento_seletivo(UUID, UUID[], UUID, TEXT);
CREATE OR REPLACE FUNCTION processar_pagamento_seletivo(
  p_mesa_id UUID,
  p_pedidos_ids UUID[],
  p_usuario_id UUID,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comanda_id UUID;
  v_valor_total DECIMAL(10,2);
BEGIN
  -- Buscar comanda aberta da mesa
  SELECT id INTO v_comanda_id
  FROM comandas
  WHERE mesa_id = p_mesa_id AND status = 'aberta'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_comanda_id IS NULL THEN
    RETURN json_build_object('error', 'Nenhuma comanda aberta encontrada para esta mesa');
  END IF;
  
  -- Calcular valor total dos pedidos selecionados
  SELECT COALESCE(SUM(valor_restante), SUM(subtotal)) INTO v_valor_total
  FROM pedidos 
  WHERE id = ANY(p_pedidos_ids) AND comanda_id = v_comanda_id AND status != 'cancelado';
  
  -- Registrar pagamento
  INSERT INTO pagamentos_mesa (
    mesa_id,
    valor_total_mesa,
    valor_pago,
    valor_restante,
    tipo_pagamento,
    observacoes,
    usuario_id
  ) VALUES (
    p_mesa_id,
    v_valor_total,
    v_valor_total,
    0,
    'seletivo',
    p_observacoes,
    p_usuario_id
  );
  
  -- Marcar pedidos selecionados como pagos
  UPDATE pedidos 
  SET 
    valor_pago = COALESCE(valor_restante, subtotal),
    valor_restante = 0,
    status = 'pago'
  WHERE id = ANY(p_pedidos_ids) AND comanda_id = v_comanda_id;
  
  -- Verificar se todos os pedidos foram pagos para fechar a comanda
  PERFORM verificar_e_fechar_comanda(v_comanda_id);
  
  RETURN json_build_object('success', true, 'message', 'Pagamento seletivo processado com sucesso');
END;
$$;

-- Função para processar pagamento total
DROP FUNCTION IF EXISTS processar_pagamento_total(UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION processar_pagamento_total(
  p_mesa_id UUID,
  p_usuario_id UUID,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comanda_id UUID;
  v_valor_total DECIMAL(10,2);
BEGIN
  -- Buscar comanda aberta da mesa
  SELECT id INTO v_comanda_id
  FROM comandas
  WHERE mesa_id = p_mesa_id AND status = 'aberta'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_comanda_id IS NULL THEN
    RETURN json_build_object('error', 'Nenhuma comanda aberta encontrada para esta mesa');
  END IF;
  
  -- Calcular valor total
  SELECT COALESCE(SUM(valor_restante), SUM(subtotal)) INTO v_valor_total
  FROM pedidos 
  WHERE comanda_id = v_comanda_id AND status != 'cancelado';
  
  -- Registrar pagamento
  INSERT INTO pagamentos_mesa (
    mesa_id,
    valor_total_mesa,
    valor_pago,
    valor_restante,
    tipo_pagamento,
    observacoes,
    usuario_id
  ) VALUES (
    p_mesa_id,
    v_valor_total,
    v_valor_total,
    0,
    'total',
    p_observacoes,
    p_usuario_id
  );
  
  -- Marcar todos os pedidos como pagos
  UPDATE pedidos 
  SET 
    valor_pago = COALESCE(valor_restante, subtotal),
    valor_restante = 0,
    status = 'pago'
  WHERE comanda_id = v_comanda_id AND status != 'cancelado';
  
  -- Fechar a comanda
  UPDATE comandas 
  SET status = 'fechada', updated_at = NOW()
  WHERE id = v_comanda_id;
  
  RETURN json_build_object('success', true, 'message', 'Pagamento total processado e comanda fechada com sucesso');
END;
$$;

-- Função para verificar e fechar comanda automaticamente
DROP FUNCTION IF EXISTS verificar_e_fechar_comanda(UUID);
CREATE OR REPLACE FUNCTION verificar_e_fechar_comanda(p_comanda_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedidos_pendentes INTEGER;
BEGIN
  -- Verificar se há pedidos pendentes
  SELECT COUNT(*) INTO v_pedidos_pendentes
  FROM pedidos 
  WHERE comanda_id = p_comanda_id 
    AND status NOT IN ('pago', 'cancelado');
  
  -- Se não há pedidos pendentes, fechar a comanda
  IF v_pedidos_pendentes = 0 THEN
    UPDATE comandas 
    SET status = 'fechada', updated_at = NOW()
    WHERE id = p_comanda_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Função para verificar se mesa está disponível
DROP FUNCTION IF EXISTS mesa_disponivel(UUID);
CREATE OR REPLACE FUNCTION mesa_disponivel(p_mesa_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comandas_abertas INTEGER;
BEGIN
  -- Verificar se há comandas abertas na mesa
  SELECT COUNT(*) INTO v_comandas_abertas
  FROM comandas
  WHERE mesa_id = p_mesa_id AND status = 'aberta';
  
  RETURN v_comandas_abertas = 0;
END;
$$;

-- Trigger para verificar e fechar comanda quando pedido é marcado como pago
DROP FUNCTION IF EXISTS trigger_verificar_comanda();
CREATE OR REPLACE FUNCTION trigger_verificar_comanda()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se o status mudou para 'pago', verificar se deve fechar a comanda
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') THEN
    PERFORM verificar_e_fechar_comanda(NEW.comanda_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_verificar_comanda_on_pedidos ON pedidos;
CREATE TRIGGER trigger_verificar_comanda_on_pedidos
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_verificar_comanda();

-- RLS Policies para as novas funções
GRANT EXECUTE ON FUNCTION processar_pagamento_parcial(UUID, DECIMAL, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION processar_pagamento_seletivo(UUID, UUID[], UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION processar_pagamento_total(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verificar_e_fechar_comanda(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mesa_disponivel(UUID) TO authenticated; 