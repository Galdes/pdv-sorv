import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numero_cliente, mensagem } = body;

    if (!numero_cliente || !mensagem) {
      return NextResponse.json(
        { error: 'Número do cliente e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    // Enviar mensagem via Z-API
    const response = await fetch('https://api.z-api.io/instances/3E29A3AF9423B0EA10A44AAAADA6D328/token/7D1DE18113C654C07EA765C7/send-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': process.env.ZAPI_CLIENT_TOKEN || '',
      },
      body: JSON.stringify({
        phone: numero_cliente,
        message: mensagem
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro Z-API:', errorData);
      throw new Error('Erro ao enviar mensagem via Z-API');
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message_id: result.id
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 