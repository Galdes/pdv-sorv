-- Função RPC para atualizar estabelecimentos
-- Esta função contorna as políticas RLS e permite atualização direta

CREATE OR REPLACE FUNCTION atualizar_estabelecimento(
  p_bar_id UUID,
  p_nome TEXT,
  p_endereco TEXT,
  p_telefone TEXT,
  p_email TEXT,
  p_descricao TEXT,
  p_ativo BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Atualizar o estabelecimento
  UPDATE bares 
  SET 
    nome = p_nome,
    endereco = p_endereco,
    telefone = p_telefone,
    email = p_email,
    descricao = p_descricao,
    ativo = p_ativo,
    updated_at = NOW()
  WHERE id = p_bar_id;
  
  -- Verificar se alguma linha foi afetada
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estabelecimento não encontrado';
  END IF;
  
  -- Retornar sucesso
  v_result := json_build_object(
    'success', true,
    'message', 'Estabelecimento atualizado com sucesso',
    'bar_id', p_bar_id
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    v_result := json_build_object(
      'success', false,
      'message', SQLERRM,
      'bar_id', p_bar_id
    );
    RETURN v_result;
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION atualizar_estabelecimento(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION atualizar_estabelecimento(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon;

-- Teste da função (opcional)
-- SELECT atualizar_estabelecimento(
--   '550e8400-e29b-41d4-a716-446655440000'::UUID,
--   'Sorveteria Conteiner Teste',
--   'Rua das Flores, 123',
--   '(11) 99999-9999',
--   'teste@sorveteria.com',
--   'Descrição de teste',
--   true
-- ); 