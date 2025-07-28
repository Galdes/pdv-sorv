import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK WHATSAPP RECEBIDO ===');
    
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
    console.log('Body completo recebido:', body);
    
    // Extrair dados da estrutura do N8N
    let conversa, mensagem;
    
    if (body.body && body.body.conversa && body.body.mensagem) {
      // Estrutura do N8N: { body: { conversa: {...}, mensagem: {...} } }
      conversa = body.body.conversa;
      mensagem = body.body.mensagem;
    } else if (body.conversa && body.mensagem) {
      // Estrutura direta: { conversa: {...}, mensagem: {...} }
      conversa = body.conversa;
      mensagem = body.mensagem;
    } else {
      console.error('Estrutura inválida:', body);
      return NextResponse.json(
        { error: 'Invalid request structure' }, 
        { status: 400 }
      );
    }
    
    console.log('Dados extraídos:', { conversa, mensagem });

    // 1. Salvar/atualizar conversa
    const { data: conversaExistente } = await supabase
      .from('conversas_whatsapp')
      .select('id')
      .eq('numero_cliente', conversa.numero_cliente)
      .single();

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

      if (errorConversa) throw errorConversa;
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

      if (errorConversa) throw errorConversa;
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
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 