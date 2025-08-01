/**
 * 🚨 AVISOS IMPORTANTES:
 * 
 * 1. URL do ngrok muda a cada reinicialização!
 *    - Atualizar N8N_SEND_WEBHOOK_URL no Vercel
 *    - URL atual: https://aec91f83329e.ngrok-free.app
 * 
 * 2. Fluxo: Sistema → ngrok → N8N → Z-API → WhatsApp
 * 
 * 3. Se der erro 500, verificar:
 *    - ngrok está rodando?
 *    - URL está correta no Vercel?
 *    - N8N está ativo?
 * 
 * 4. Logs detalhados para debug
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ENVIAR MENSAGEM WHATSAPP ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('URL:', request.url);
    
    const body = await request.json();
    const { numero_cliente, mensagem } = body;
    
    console.log('Dados recebidos:', { numero_cliente, mensagem });

    if (!numero_cliente || !mensagem) {
      console.error('Dados obrigatórios faltando:', { numero_cliente, mensagem });
      return NextResponse.json(
        { error: 'Número do cliente e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('Enviando via N8N (ngrok)...');
    
    // URL do webhook N8N via ngrok
    const n8nWebhookUrl = process.env.N8N_SEND_WEBHOOK_URL || 'https://fff4bcf1d092.ngrok-free.app/webhook/send-message';
    
    console.log('N8N Webhook URL (ngrok):', n8nWebhookUrl);
    console.log('Body para N8N:', { numero_cliente, mensagem });

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numero_cliente: numero_cliente,
        mensagem: mensagem
      })
    });

    console.log('Resposta N8N status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro N8N - Status:', response.status);
      console.error('Erro N8N - Body:', errorData);
      throw new Error(`Erro N8N: ${response.status} - ${errorData}`);
    }

    // Verificar se a resposta é JSON válido
    const responseText = await response.text();
    console.log('Resposta N8N texto:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('Resposta N8N JSON:', result);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta:', parseError);
      console.log('Resposta não é JSON válido, mas status é 200');
      // Se status é 200 mas não é JSON, consideramos sucesso
      result = { success: true, message: 'Mensagem enviada' };
    }
    
    console.log('=== MENSAGEM ENVIADA COM SUCESSO ===');
    
    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada via N8N',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 