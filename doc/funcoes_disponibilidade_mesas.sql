-- =====================================================
-- FUNÇÕES PARA VERIFICAÇÃO DE DISPONIBILIDADE DE MESAS
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- Função para verificar se mesa está disponível (MELHORADA)
-- Considera mesa disponível se:
-- 1. Não há comandas abertas OU
-- 2. Há comandas abertas mas todos os pedidos estão pagos
DROP FUNCTION IF EXISTS mesa_disponivel_melhorada(UUID);
CREATE OR REPLACE FUNCTION mesa_disponivel_melhorada(p_mesa_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comandas_abertas INTEGER;
  v_pedidos_pendentes INTEGER;
BEGIN
  -- Verificar se há comandas abertas na mesa
  SELECT COUNT(*) INTO v_comandas_abertas
  FROM comandas
  WHERE mesa_id = p_mesa_id AND status = 'aberta';
  
  -- Se não há comandas abertas, mesa está disponível
  IF v_comandas_abertas = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Se há comandas abertas, verificar se há pedidos pendentes
  SELECT COUNT(*) INTO v_pedidos_pendentes
  FROM pedidos p
  JOIN comandas c ON p.comanda_id = c.id
  WHERE c.mesa_id = p_mesa_id 
    AND c.status = 'aberta'
    AND p.status NOT IN ('pago', 'cancelado');
  
  -- Mesa está disponível se não há pedidos pendentes
  RETURN v_pedidos_pendentes = 0;
END;
$$;

-- Função para verificar se mesa está disponível (ORIGINAL - mantida para compatibilidade)
-- Considera mesa disponível APENAS se não há comandas abertas
-- USO: Para sistemas que precisam de verificação mais restritiva
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

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION mesa_disponivel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mesa_disponivel_melhorada(UUID) TO authenticated; 