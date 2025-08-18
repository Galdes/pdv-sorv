import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { instancia_id, token } = await request.json();

    if (!instancia_id || !token) {
      return NextResponse.json(
        { error: 'ID da instância e token são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('Testando conexão Z-API:', { instancia_id, token });

    // Primeiro, tentar o endpoint de status
    let isConnected = false;
    let statusData = null;
    let errorInfo = null;

    try {
      const response = await fetch(`https://api.z-api.io/instances/${instancia_id}/token/${token}/status`, {
        method: 'GET',
        headers: {
          'Client-Token': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('Resposta Z-API status:', response.status);

      if (response.ok) {
        statusData = await response.json();
        console.log('Dados da resposta Z-API:', statusData);
        
        // Verificar diferentes possíveis formatos de resposta
        if (statusData && typeof statusData === 'object') {
          if (statusData.status === 'connected' || statusData.status === 'online') {
            isConnected = true;
          } else if (statusData.connected === true || statusData.online === true) {
            isConnected = true;
          } else if (statusData.connection && statusData.connection.status === 'connected') {
            isConnected = true;
          } else if (statusData.instance && statusData.instance.status === 'connected') {
            isConnected = true;
          }
        }
      } else {
        errorInfo = `Status endpoint retornou ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      errorInfo = `Erro no endpoint de status: ${error}`;
    }

    // Se não conseguiu determinar pelo status, tentar endpoint de informações da instância
    if (!isConnected && !statusData) {
      try {
        console.log('Tentando endpoint de informações da instância...');
        const infoResponse = await fetch(`https://api.z-api.io/instances/${instancia_id}/token/${token}`, {
          method: 'GET',
          headers: {
            'Client-Token': token,
            'Content-Type': 'application/json'
          }
        });

        if (infoResponse.ok) {
          const infoData = await infoResponse.json();
          console.log('Dados da instância:', infoData);
          
          // Se conseguiu buscar informações da instância, provavelmente está conectada
          isConnected = true;
          statusData = infoData;
        } else {
          errorInfo = `Info endpoint retornou ${infoResponse.status}: ${infoResponse.statusText}`;
        }
      } catch (error) {
        errorInfo = `Erro no endpoint de info: ${error}`;
      }
    }

    // Se ainda não conseguiu determinar, tentar enviar uma mensagem de teste
    if (!isConnected && !statusData) {
      try {
        console.log('Tentando enviar mensagem de teste...');
        const testResponse = await fetch(`https://api.z-api.io/instances/${instancia_id}/token/${token}/send-text`, {
          method: 'POST',
          headers: {
            'Client-Token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: '5511999999999', // Número de teste
            message: 'Teste de conexão'
          })
        });

        if (testResponse.ok) {
          isConnected = true;
          statusData = { message: 'Teste de conexão bem-sucedido' };
        } else {
          errorInfo = `Teste de envio retornou ${testResponse.status}: ${testResponse.statusText}`;
        }
      } catch (error) {
        errorInfo = `Erro no teste de envio: ${error}`;
      }
    }

    console.log('Status final detectado:', isConnected ? 'conectado' : 'desconectado');
    
    return NextResponse.json({
      success: true,
      status: isConnected ? 'conectado' : 'desconectado',
      message: isConnected ? 'Z-API conectada com sucesso' : 'Z-API desconectada',
      data: statusData,
      debug: {
        isConnected,
        errorInfo,
        hasStatusData: !!statusData
      }
    });

  } catch (error) {
    console.error('Erro ao testar conexão Z-API:', error);
    return NextResponse.json({
      success: false,
      status: 'desconectado',
      message: 'Erro interno ao testar conexão',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
