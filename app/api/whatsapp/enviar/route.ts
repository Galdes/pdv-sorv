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

    console.log('Enviando via N8N Webhook...');
    
    // URL do webhook N8N (você precisa configurar isso)
    const n8nWebhookUrl = process.env.N8N_SEND_WEBHOOK_URL || 'https://seu-n8n.com/webhook/send-message';
    
    console.log('N8N Webhook URL:', n8nWebhookUrl);
    console.log('Body para N8N:', { numero_cliente, mensagem });

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numero_cliente: numero_cliente,
        mensagem: mensagem,
        tipo: 'sistema',
        timestamp: new Date().toISOString()
      })
    });

    console.log('Resposta N8N status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro N8N - Status:', response.status);
      console.error('Erro N8N - Body:', errorData);
      throw new Error(`Erro N8N: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('Resposta N8N sucesso:', result);
    
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