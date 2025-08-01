import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversa_id, acao, atendente_nome } = body;

    if (!conversa_id || !acao) {
      return NextResponse.json(
        { error: 'ID da conversa e ação são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('=== ASSUMIR/LIBERAR CONVERSA ===');
    console.log('Conversa ID:', conversa_id);
    console.log('Ação:', acao);
    console.log('Atendente:', atendente_nome);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Body completo:', JSON.stringify(body, null, 2));

    // Verificar se a conversa existe
    const { data: conversa, error: errorBusca } = await supabase
      .from('conversas_whatsapp')
      .select('id, modo_atendimento, atendente_nome')
      .eq('id', conversa_id)
      .single();

    console.log('=== DADOS DA CONVERSA ===');
    console.log('Conversa encontrada:', conversa);
    console.log('Erro na busca:', errorBusca);
    console.log('Modo atual:', conversa?.modo_atendimento);
    console.log('=== FIM DADOS ===');

    if (errorBusca || !conversa) {
      console.error('Conversa não encontrada:', conversa_id);
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    const agora = new Date();
    const timeoutMinutos = 5; // 5 minutos de timeout
    const bloqueadoAte = new Date(agora.getTime() + timeoutMinutos * 60 * 1000);

    if (acao === 'assumir') {
      if (conversa.modo_atendimento === 'humano') {
        return NextResponse.json(
          { error: 'Conversa já está sendo atendida por outro usuário' },
          { status: 400 }
        );
      }

      // Assumir conversa
      const { error: errorAssumir } = await supabase
        .from('conversas_whatsapp')
        .update({
          modo_atendimento: 'humano',
          atendente_nome: atendente_nome || 'Atendente',
          assumido_em: agora.toISOString(),
          bloqueado_ate: bloqueadoAte.toISOString(),
          updated_at: agora.toISOString()
        })
        .eq('id', conversa_id);

      if (errorAssumir) {
        console.error('Erro ao assumir conversa:', errorAssumir);
        return NextResponse.json(
          { error: 'Erro ao assumir conversa' },
          { status: 500 }
        );
      }

      console.log('Conversa assumida com sucesso');
      console.log('Bloqueado até:', bloqueadoAte.toISOString());

      return NextResponse.json({
        success: true,
        message: 'Conversa assumida com sucesso',
        conversa_id: conversa_id,
        modo: 'humano',
        atendente: atendente_nome,
        bloqueado_ate: bloqueadoAte.toISOString(),
        timestamp: agora.toISOString()
      });

    } else if (acao === 'liberar') {
      if (conversa.modo_atendimento === 'bot') {
        return NextResponse.json(
          { error: 'Conversa já está em modo bot' },
          { status: 400 }
        );
      }

      // Liberar conversa
      const { error: errorLiberar } = await supabase
        .from('conversas_whatsapp')
        .update({
          modo_atendimento: 'bot',
          atendente_id: null,
          atendente_nome: null,
          assumido_em: null,
          bloqueado_ate: null,
          updated_at: agora.toISOString()
        })
        .eq('id', conversa_id);

      if (errorLiberar) {
        console.error('Erro ao liberar conversa:', errorLiberar);
        return NextResponse.json(
          { error: 'Erro ao liberar conversa' },
          { status: 500 }
        );
      }

      console.log('Conversa liberada com sucesso');

      return NextResponse.json({
        success: true,
        message: 'Conversa liberada com sucesso',
        conversa_id: conversa_id,
        modo: 'bot',
        timestamp: agora.toISOString()
      });

    } else {
      return NextResponse.json(
        { error: 'Ação inválida. Use "assumir" ou "liberar"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro ao assumir/liberar conversa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}