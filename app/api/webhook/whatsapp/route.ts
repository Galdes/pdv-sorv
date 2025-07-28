import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK WHATSAPP RECEBIDO ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    // Verificar token de autorização (TEMPORARIAMENTE DESABILITADO PARA TESTE)
    // const authHeader = request.headers.get('authorization');
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   console.log('Token não fornecido, mas continuando para teste');
    //   // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // const token = authHeader?.replace('Bearer ', '');
    // if (token && token !== process.env.WEBHOOK_SECRET_TOKEN) {
    //   console.log('Token inválido, mas continuando para teste');
    //   // return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    // }

    const body = await request.json();
    console.log('Body completo recebido:', JSON.stringify(body, null, 2));
    
    // Extrair dados da estrutura do N8N
    let conversa, mensagem;
    
    if (body.body && body.body.conversa && body.body.mensagem) {
      // Estrutura do N8N: { body: { conversa: {...}, mensagem: {...} } }
      console.log('Estrutura N8N detectada');
      conversa = body.body.conversa;
      mensagem = body.body.mensagem;
    } else if (body.conversa && body.mensagem) {
      // Estrutura direta: { conversa: {...}, mensagem: {...} }
      console.log('Estrutura direta detectada');
      conversa = body.conversa;
      mensagem = body.mensagem;
    } else {
      console.error('Estrutura inválida:', JSON.stringify(body, null, 2));
      return NextResponse.json(
        { error: 'Invalid request structure' }, 
        { status: 400 }
      );
    }
    
    console.log('Dados extraídos:', { conversa, mensagem });

    // Validar dados obrigatórios
    if (!conversa.numero_cliente || !mensagem.conteudo) {
      console.error('Dados obrigatórios faltando:', { conversa, mensagem });
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // 1. Salvar/atualizar conversa
    console.log('Buscando conversa existente...');
    const { data: conversaExistente, error: errorBusca } = await supabase
      .from('conversas_whatsapp')
      .select('id')
      .eq('numero_cliente', conversa.numero_cliente)
      .single();

    if (errorBusca && errorBusca.code !== 'PGRST116') {
      console.error('Erro ao buscar conversa:', errorBusca);
      throw errorBusca;
    }

    let conversaId: string;

    if (conversaExistente) {
      console.log('Conversa existente encontrada:', conversaExistente.id);
      // Atualizar conversa existente
      const { data: conversaAtualizada, error: errorConversa } = await supabase
        .from('conversas_whatsapp')
        .update({
          nome_cliente: conversa.nome_cliente,
          status: conversa.status,
          ultima_interacao: conversa.ultima_interacao,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversaExistente.id)
        .select('id')
        .single();

      if (errorConversa) {
        console.error('Erro ao atualizar conversa:', errorConversa);
        throw errorConversa;
      }
      conversaId = conversaAtualizada.id;
    } else {
      console.log('Criando nova conversa');
      // Criar nova conversa
      const { data: novaConversa, error: errorConversa } = await supabase
        .from('conversas_whatsapp')
        .insert({
          numero_cliente: conversa.numero_cliente,
          nome_cliente: conversa.nome_cliente,
          status: conversa.status,
          ultima_interacao: conversa.ultima_interacao
        })
        .select('id')
        .single();

      if (errorConversa) {
        console.error('Erro ao criar conversa:', errorConversa);
        throw errorConversa;
      }
      conversaId = novaConversa.id;
    }

    console.log('Conversa ID:', conversaId);

    // 2. Salvar mensagem
    console.log('Salvando mensagem:', {
      conversa_id: conversaId,
      tipo: mensagem.tipo,
      conteudo: mensagem.conteudo,
      timestamp: mensagem.timestamp
    });
    
    const { error: errorMensagem } = await supabase
      .from('mensagens_whatsapp')
      .insert({
        conversa_id: conversaId,
        tipo: mensagem.tipo,
        conteudo: mensagem.conteudo,
        timestamp: mensagem.timestamp
      });

    if (errorMensagem) {
      console.error('Erro ao salvar mensagem:', errorMensagem);
      throw errorMensagem;
    }

    console.log('Mensagem salva com sucesso');

    return NextResponse.json({ 
      success: true, 
      conversa_id: conversaId 
    });

  } catch (error) {
    console.error('Erro no webhook WhatsApp:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 