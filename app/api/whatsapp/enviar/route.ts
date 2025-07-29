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

    console.log('Enviando diretamente para Z-API...');
    
    // Configurações Z-API
    const zapiUrl = 'https://api.z-api.io/instances/3E29A3AF9423B0EA10A44AAAADA6D328/token/7D1DE18113C654C07EA765C7/send-text';
    const zapiToken = process.env.ZAPI_CLIENT_TOKEN || 'F1a3944af237e41109ba151a729e869e9S';
    
    console.log('Z-API URL:', zapiUrl);
    console.log('Z-API Token existe:', !!zapiToken);
    console.log('Z-API Token (primeiros 10 chars):', zapiToken.substring(0, 10));

    // Preparar dados para Z-API
    const requestBody = {
      phone: numero_cliente,
      message: mensagem
    };

    console.log('Body para Z-API:', requestBody);

    // Enviar mensagem via Z-API
    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': zapiToken,
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Resposta Z-API status:', response.status);
    console.log('Resposta Z-API headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro Z-API - Status:', response.status);
      console.error('Erro Z-API - Body:', errorData);
      throw new Error(`Erro Z-API: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('Resposta Z-API sucesso:', result);
    
    console.log('=== MENSAGEM ENVIADA COM SUCESSO ===');
    
    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada via Z-API',
      message_id: result.id,
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