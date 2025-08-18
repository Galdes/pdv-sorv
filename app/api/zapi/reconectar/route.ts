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

    console.log('Tentando reconectar Z-API:', { instancia_id, token });

    // Tentar reconectar a instância Z-API
    const response = await fetch(`https://api.z-api.io/instances/${instancia_id}/token/${token}/reconnect`, {
      method: 'POST',
      headers: {
        'Client-Token': token,
        'Content-Type': 'application/json'
      }
    });

    console.log('Resposta reconexão Z-API status:', response.status);

    if (response.ok) {
      // Aguardar um pouco para a reconexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se reconectou com sucesso
      const statusResponse = await fetch(`https://api.z-api.io/instances/${instancia_id}/token/${token}/status`, {
        method: 'GET',
        headers: {
          'Client-Token': token,
          'Content-Type': 'application/json'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Dados do status após reconexão:', statusData);
        
        // Usar a mesma lógica de verificação de status
        let isConnected = false;
        
        if (statusData && typeof statusData === 'object') {
          if (statusData.status === 'connected' || statusData.status === 'online') {
            isConnected = true;
          } else if (statusData.connected === true || statusData.online === true) {
            isConnected = true;
          } else if (statusData.connection && statusData.connection.status === 'connected') {
            isConnected = true;
          } else if (statusData.instance && statusData.instance.status === 'connected') {
            isConnected = true;
          } else if (statusResponse.status === 200) {
            isConnected = true;
          }
        }
        
        console.log('Status após reconexão:', isConnected ? 'conectado' : 'desconectado');
        
        return NextResponse.json({
          success: true,
          status: isConnected ? 'conectado' : 'desconectado',
          message: isConnected ? 'Z-API reconectada com sucesso' : 'Z-API ainda desconectada após tentativa de reconexão',
          data: statusData,
          debug: {
            responseStatus: statusResponse.status,
            hasData: !!statusData,
            dataKeys: statusData ? Object.keys(statusData) : [],
            detectedStatus: isConnected
          }
        });
      } else {
        const errorText = await statusResponse.text();
        console.error('Erro ao verificar status após reconexão:', statusResponse.status, errorText);
        
        return NextResponse.json({
          success: false,
          status: 'desconectado',
          message: 'Falha ao verificar status após reconexão',
          error: statusResponse.statusText,
          debug: {
            responseStatus: statusResponse.status,
            errorText: errorText
          }
        }, { status: statusResponse.status });
      }
    } else {
      const errorText = await response.text();
      console.error('Erro ao tentar reconectar Z-API:', response.status, errorText);
      
      return NextResponse.json({
        success: false,
        status: 'desconectado',
        message: 'Falha ao tentar reconectar Z-API',
        error: response.statusText,
        debug: {
          responseStatus: response.status,
          errorText: errorText
        }
      }, { status: response.status });
    }

  } catch (error) {
    console.error('Erro ao reconectar Z-API:', error);
    return NextResponse.json({
      success: false,
      status: 'desconectado',
      message: 'Erro interno ao tentar reconectar',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
