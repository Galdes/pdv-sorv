import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    // Verificar token de autorização (temporariamente desabilitado para teste)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Token não fornecido, mas continuando para teste');
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader?.replace('Bearer ', '');
    if (token && token !== process.env.WEBHOOK_SECRET_TOKEN) {
      console.log('Token inválido, mas continuando para teste');
      // return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { conversa, mensagem } = body;

    // 1. Salvar/atualizar conversa
    const { data: conversaExistente } = await supabase
      .from('conversas_whatsapp')
      .select('id')
      .eq('numero_cliente', conversa.numero_cliente)
      .single();

    let conversaId: string;

    if (conversaExistente) {
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

    // 2. Salvar mensagem
    const { error: errorMensagem } = await supabase
      .from('mensagens_whatsapp')
      .insert({
        conversa_id: conversaId,
        tipo: mensagem.tipo,
        conteudo: mensagem.conteudo,
        timestamp: mensagem.timestamp
      });

    if (errorMensagem) throw errorMensagem;

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