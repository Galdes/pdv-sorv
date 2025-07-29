import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversaId = searchParams.get('id');

    if (!conversaId) {
      return NextResponse.json(
        { error: 'ID da conversa é obrigatório' },
        { status: 400 }
      );
    }

    console.log('=== EXCLUINDO CONVERSA ===');
    console.log('Conversa ID:', conversaId);
    console.log('Timestamp:', new Date().toISOString());

    // Verificar se a conversa existe
    const { data: conversa, error: errorBusca } = await supabase
      .from('conversas_whatsapp')
      .select('id, nome_cliente, numero_cliente')
      .eq('id', conversaId)
      .single();

    if (errorBusca || !conversa) {
      console.error('Conversa não encontrada:', conversaId);
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    console.log('Conversa encontrada:', conversa.nome_cliente);

    // Excluir a conversa (mensagens serão excluídas automaticamente por CASCADE)
    const { error: errorExclusao } = await supabase
      .from('conversas_whatsapp')
      .delete()
      .eq('id', conversaId);

    if (errorExclusao) {
      console.error('Erro ao excluir conversa:', errorExclusao);
      return NextResponse.json(
        { error: 'Erro ao excluir conversa' },
        { status: 500 }
      );
    }

    console.log('Conversa excluída com sucesso');
    console.log('=== EXCLUSÃO CONCLUÍDA ===');

    return NextResponse.json({
      success: true,
      message: 'Conversa excluída com sucesso',
      conversa_id: conversaId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao excluir conversa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}