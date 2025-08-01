/**
 * 🚨 AVISOS IMPORTANTES:
 * 
 * 1. Este webhook recebe dados do N8N
 *    - Fluxo: Z-API → N8N → Este webhook → Sistema
 * 
 * 2. Intervenção Humana:
 *    - Verifica modo_atendimento (bot/humano)
 *    - Bloqueia processamento se humano ativo
 *    - Libera automaticamente após 5 minutos
 * 
 * 3. ⚠️ PROBLEMA CONHECIDO:
 *    - Sistema e Redis têm contadores independentes
 *    - Pode haver desincronização de timeout
 *    - Solução: Implementar sincronização via webhooks
 * 
 * 4. Logs detalhados para debug
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK WHATSAPP RECEBIDO ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('URL:', request.url);
    console.log('User-Agent:', request.headers.get('user-agent'));
    console.log('Content-Type:', request.headers.get('content-type'));
    
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
    
    // Identificar origem da chamada
    const userAgent = request.headers.get('user-agent') || '';
    const isFromN8N = userAgent.includes('node') || userAgent.includes('n8n') || userAgent.includes('axios');
    console.log('=== ORIGEM DA CHAMADA ===');
    console.log('User-Agent:', userAgent);
    console.log('Vem do N8N:', isFromN8N);
    console.log('=== FIM ORIGEM ===');
    
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
      console.log('=== BLOQUEANDO CHAMADA COM DADOS VAZIOS ===');
      console.log('User-Agent:', userAgent);
      console.log('Vem do N8N:', isFromN8N);
      console.log('Body:', JSON.stringify(body, null, 2));
      console.log('=== FIM BLOQUEIO ===');
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Corrigir o tipo da mensagem se necessário
    let tipoMensagem = mensagem.tipo;
    console.log('=== DEBUG TIPO MENSAGEM ===');
    console.log('Tipo original:', mensagem.tipo);
    console.log('Conteúdo:', mensagem.conteudo);
    console.log('Timestamp:', mensagem.timestamp);
    
    if (tipoMensagem === 'sistema') {
      tipoMensagem = 'enviada'; // Mudar para 'enviada' que é aceito pelo banco
      console.log('Tipo "sistema" alterado para "enviada"');
    }
    
    console.log('Tipo final:', tipoMensagem);
    console.log('=== FIM DEBUG TIPO MENSAGEM ===');

    // 1. Salvar/atualizar conversa
    console.log('Buscando conversa existente...');
    const { data: conversaExistente, error: errorBusca } = await supabase
      .from('conversas_whatsapp')
      .select('id, modo_atendimento, bloqueado_ate')
      .eq('numero_cliente', conversa.numero_cliente)
      .single();

    if (errorBusca && errorBusca.code !== 'PGRST116') {
      console.error('Erro ao buscar conversa:', errorBusca);
      throw errorBusca;
    }

    let conversaId: string;

    if (conversaExistente) {
      console.log('Conversa existente encontrada:', conversaExistente.id);
      
      // Verificar se conversa está em modo humano e se o bloqueio ainda é válido
      const agora = new Date();
      const bloqueioExpirado = conversaExistente.bloqueado_ate && new Date(conversaExistente.bloqueado_ate) < agora;
      
      console.log('=== VERIFICAÇÃO MODO ATENDIMENTO ===');
      console.log('Modo atual:', conversaExistente.modo_atendimento);
      console.log('Bloqueado até:', conversaExistente.bloqueado_ate);
      console.log('Agora:', agora.toISOString());
      console.log('Bloqueio expirado:', bloqueioExpirado);
      console.log('Deve bloquear processamento:', conversaExistente.modo_atendimento === 'humano' && !bloqueioExpirado);
      console.log('=== FIM VERIFICAÇÃO ===');
      
      if (conversaExistente.modo_atendimento === 'humano' && !bloqueioExpirado) {
        console.log('Conversa em modo humano - bloqueando processamento');
        // Atualizar conversa mas não processar
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
        
        // Salvar mensagem mas não processar
        const { error: errorMensagem } = await supabase
          .from('mensagens_whatsapp')
          .insert({
            conversa_id: conversaId,
            tipo: tipoMensagem,
            conteudo: mensagem.conteudo,
            timestamp: new Date().toISOString(),
            lida: tipoMensagem === 'recebida' ? false : true
          });

        if (errorMensagem) {
          console.error('Erro ao salvar mensagem:', errorMensagem);
          throw errorMensagem;
        }

        console.log('Mensagem salva em modo humano - processamento bloqueado');
        return NextResponse.json({
          success: true,
          message: 'Mensagem salva em modo humano',
          conversa_id: conversaId,
          modo: 'humano',
          timestamp: new Date().toISOString()
        });
      } else if (bloqueioExpirado) {
        console.log('Bloqueio expirado - voltando para modo bot');
        // Liberar conversa automaticamente
        const { data: conversaLiberada, error: errorLiberacao } = await supabase
          .from('conversas_whatsapp')
          .update({
            modo_atendimento: 'bot',
            atendente_id: null,
            atendente_nome: null,
            assumido_em: null,
            bloqueado_ate: null,
            nome_cliente: conversa.nome_cliente,
            status: conversa.status,
            ultima_interacao: conversa.ultima_interacao,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversaExistente.id)
          .select('id')
          .single();

        if (errorLiberacao) {
          console.error('Erro ao liberar conversa:', errorLiberacao);
          throw errorLiberacao;
        }
        conversaId = conversaLiberada.id;
        console.log('Conversa liberada automaticamente');
      } else {
        // Modo bot - processar normalmente
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
      }
    } else {
      console.log('Criando nova conversa');
      // Criar nova conversa
      const { data: novaConversa, error: errorConversa } = await supabase
        .from('conversas_whatsapp')
        .insert({
          numero_cliente: conversa.numero_cliente,
          nome_cliente: conversa.nome_cliente,
          status: conversa.status,
          ultima_interacao: conversa.ultima_interacao,
          modo_atendimento: 'bot' // Nova conversa sempre em modo bot
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

    // 2. Verificar se mensagem já existe (evitar duplicação)
    console.log('=== VERIFICAÇÃO DE DUPLICAÇÃO ===');
    console.log('Conteúdo da mensagem:', mensagem.conteudo);
    console.log('Tipo da mensagem:', tipoMensagem);
    console.log('Conversa ID:', conversaId);
    console.log('Timestamp atual:', new Date().toISOString());
    console.log('Janela de verificação:', new Date(Date.now() - 30000).toISOString());
    
    // Verificar se a mesma mensagem (mesmo conteúdo) já foi salva nos últimos 30 segundos
    const { data: mensagemExistente, error: errorVerificacao } = await supabase
      .from('mensagens_whatsapp')
      .select('id, tipo, timestamp')
      .eq('conversa_id', conversaId)
      .eq('conteudo', mensagem.conteudo)
      .gte('timestamp', new Date(Date.now() - 30000).toISOString()) // Últimos 30 segundos
      .order('timestamp', { ascending: false })
      .limit(1);

    console.log('Mensagens encontradas na janela:', mensagemExistente);
    
    if (mensagemExistente && mensagemExistente.length > 0) {
      console.log('=== DUPLICAÇÃO POR CONTEÚDO DETECTADA ===');
      console.log('Mensagem com mesmo conteúdo já salva:', mensagemExistente[0]);
      console.log('Ignorando salvamento da nova mensagem...');
      console.log('=== FIM DUPLICAÇÃO ===');
      return NextResponse.json({
        success: true,
        message: 'Mensagem duplicada ignorada',
        conversa_id: conversaId,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Nenhuma duplicação encontrada - salvando mensagem...');
    console.log('=== FIM VERIFICAÇÃO ===');

    // 3. Salvar mensagem
    console.log('Salvando mensagem:', {
      conversa_id: conversaId,
      tipo: tipoMensagem,
      conteudo: mensagem.conteudo,
      timestamp: new Date().toISOString()
    });
    
    const { error: errorMensagem } = await supabase
      .from('mensagens_whatsapp')
      .insert({
        conversa_id: conversaId,
        tipo: tipoMensagem,
        conteudo: mensagem.conteudo,
        timestamp: new Date().toISOString(),
        lida: tipoMensagem === 'recebida' ? false : true
      });

    if (errorMensagem) {
      console.error('Erro ao salvar mensagem:', errorMensagem);
      throw errorMensagem;
    }

    console.log('Mensagem salva com sucesso');
    console.log('Preparando resposta...');

    console.log('=== WEBHOOK PROCESSADO COM SUCESSO ===');
    console.log('Conversa ID:', conversaId);
    console.log('Tempo de processamento:', new Date().toISOString());
    
    const response = { 
      success: true, 
      conversa_id: conversaId,
      timestamp: new Date().toISOString()
    };
    
    console.log('Resposta final:', response);
    console.log('Enviando resposta...');
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro no webhook WhatsApp:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 