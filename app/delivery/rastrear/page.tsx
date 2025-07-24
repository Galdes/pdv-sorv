'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Phone, Hash, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export default function RastrearPedidoPage() {
  const [codigo, setCodigo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const router = useRouter();

  const buscarPorCodigo = async () => {
    if (!codigo.trim()) {
      setError('Digite um código de rastreamento');
      return;
    }

    setLoading(true);
    setError('');
    setPedidos([]);

    try {
      // Remove o prefixo DEL se o usuário digitou
      const codigoLimpo = codigo.replace(/^DEL/i, '').trim();
      
      // Busca por ID (últimos 8 caracteres do UUID) e filtra apenas pedidos válidos
      const { data, error } = await supabase
        .from('pedidos_externos')
        .select(`
          *,
          enderecos_entrega(*)
        `)
        .ilike('id', `%${codigoLimpo}`)
        .not('status', 'eq', 'cancelado') // Exclui pedidos cancelados
        .not('valor_total', 'eq', 0); // Exclui pedidos com valor zero (testes)

      if (error) throw error;

      if (data && data.length > 0) {
        // Filtra apenas pedidos que tenham telefone válido ou sejam de retirada
        const pedidosValidos = data.filter(pedido => {
          // Exclui pedidos com status inválidos
          if (pedido.status === 'cancelado' || pedido.valor_total <= 0) {
            return false;
          }
          
          // Se for entrega, deve ter telefone válido
          if (pedido.tipo_servico === 'entrega') {
            return pedido.enderecos_entrega?.telefone && 
                   pedido.enderecos_entrega.telefone.trim() !== '' &&
                   pedido.enderecos_entrega.telefone !== 'N/A' &&
                   pedido.enderecos_entrega.telefone !== 'null';
          }
          // Se for retirada, pode não ter endereço mas deve ter algum identificador
          return true;
        });

        if (pedidosValidos.length > 0) {
          const pedidosFormatados = pedidosValidos.map(pedido => ({
            ...pedido,
            numero: 'DEL' + pedido.id.slice(-8).toUpperCase(),
            telefone: pedido.enderecos_entrega?.telefone || 'Retirada no local'
          }));
          setPedidos(pedidosFormatados);
        } else {
          setError('Nenhum pedido válido encontrado com este código');
        }
      } else {
        setError('Nenhum pedido encontrado com este código');
      }
    } catch (error: any) {
      console.error('Erro ao buscar pedido:', error);
      setError('Erro ao buscar pedido. Tente novamente.');
    } finally {
      setLoading(false);
      setBuscaRealizada(true);
    }
  };

  const buscarPorTelefone = async () => {
    if (!telefone.trim()) {
      setError('Digite um número de telefone');
      return;
    }

    setLoading(true);
    setError('');
    setPedidos([]);

    try {
      // Limpa o telefone (remove caracteres especiais)
      const telefoneLimpo = telefone.replace(/\D/g, '');
      
      if (telefoneLimpo.length < 10) {
        setError('Digite um número de telefone válido');
        setLoading(false);
        return;
      }
      
      // Busca por telefone nos endereços de entrega e filtra apenas pedidos válidos
      const { data, error } = await supabase
        .from('pedidos_externos')
        .select(`
          *,
          enderecos_entrega(*)
        `)
        .ilike('enderecos_entrega.telefone', `%${telefoneLimpo}%`)
        .not('status', 'eq', 'cancelado') // Exclui pedidos cancelados
        .not('valor_total', 'eq', 0); // Exclui pedidos com valor zero (testes)

      if (error) throw error;

      if (data && data.length > 0) {
        // Filtra apenas pedidos que tenham telefone válido
        const pedidosValidos = data.filter(pedido => {
          // Exclui pedidos com status inválidos
          if (pedido.status === 'cancelado' || pedido.valor_total <= 0) {
            return false;
          }
          
          return pedido.enderecos_entrega?.telefone && 
                 pedido.enderecos_entrega.telefone.trim() !== '' &&
                 pedido.enderecos_entrega.telefone !== 'N/A' &&
                 pedido.enderecos_entrega.telefone !== 'null' &&
                 pedido.enderecos_entrega.telefone.replace(/\D/g, '').includes(telefoneLimpo);
        });

        if (pedidosValidos.length > 0) {
          const pedidosFormatados = pedidosValidos.map(pedido => ({
            ...pedido,
            numero: 'DEL' + pedido.id.slice(-8).toUpperCase(),
            telefone: pedido.enderecos_entrega?.telefone || 'N/A'
          }));
          setPedidos(pedidosFormatados);
        } else {
          setError('Nenhum pedido válido encontrado com este telefone');
        }
      } else {
        setError('Nenhum pedido encontrado com este telefone');
      }
    } catch (error: any) {
      console.error('Erro ao buscar pedido:', error);
      setError('Erro ao buscar pedido. Tente novamente.');
    } finally {
      setLoading(false);
      setBuscaRealizada(true);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'text-yellow-600 bg-yellow-100';
      case 'confirmado': return 'text-blue-600 bg-blue-100';
      case 'preparando': return 'text-orange-600 bg-orange-100';
      case 'pronto': return 'text-green-600 bg-green-100';
      case 'em_entrega': return 'text-purple-600 bg-purple-100';
      case 'entregue': return 'text-gray-600 bg-gray-100';
      case 'cancelado': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'confirmado': return 'Confirmado';
      case 'preparando': return 'Em Preparação';
      case 'pronto': return 'Pronto';
      case 'em_entrega': return 'Em Entrega';
      case 'entregue': return 'Entregue';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const acompanharPedido = (pedidoId: string) => {
    router.push(`/delivery/acompanhar/${pedidoId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/delivery')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Rastrear Pedido</h1>
              <p className="text-gray-600">Consulte o status do seu pedido</p>
            </div>
          </div>
        </div>

        {/* Formulário de Busca */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Como você quer rastrear?</h2>
          
          {/* Busca por Código */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash size={16} className="inline mr-2" />
              Código de Rastreamento
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: DEL12345678"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={buscarPorCodigo}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search size={16} />
                Buscar
              </button>
            </div>
          </div>

          {/* Separador */}
          <div className="flex items-center mb-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">ou</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Busca por Telefone */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="inline mr-2" />
              Número de Telefone
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: (11) 99999-9999"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={buscarPorTelefone}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search size={16} />
                Buscar
              </button>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Buscando pedidos...</p>
            </div>
          )}
        </div>

        {/* Resultados */}
        {buscaRealizada && !loading && pedidos.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Pedidos Encontrados ({pedidos.length})
            </h2>
            
            <div className="space-y-4">
              {pedidos.map((pedido) => (
                <div key={pedido.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{pedido.numero}</h3>
                      <p className="text-sm text-gray-600">{formatarData(pedido.created_at)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                      {getStatusLabel(pedido.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">
                        {pedido.tipo_servico === 'entrega' ? 'Entrega' : 'Retirada'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valor:</span>
                      <span className="font-medium text-blue-600">
                        {formatarValor(pedido.valor_total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Telefone:</span>
                      <span className="font-medium">
                        {pedido.tipo_servico === 'retirada' && (!pedido.enderecos_entrega?.telefone || pedido.enderecos_entrega.telefone === 'N/A') 
                          ? 'Retirada no local' 
                          : pedido.telefone}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => acompanharPedido(pedido.id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Acompanhar Pedido
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nenhum resultado */}
        {buscaRealizada && !loading && pedidos.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-600 mb-4">
              Verifique se o código ou telefone estão corretos
            </p>
            <button
              onClick={() => {
                setCodigo('');
                setTelefone('');
                setError('');
                setPedidos([]);
                setBuscaRealizada(false);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nova Busca
            </button>
          </div>
        )}

        {/* Informações para N8N */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-800 mb-3">🤖 Integração com IA</h3>
          <p className="text-sm text-blue-700 mb-3">
            Nosso agente de IA pode ajudar você a rastrear pedidos via WhatsApp. 
            Envie o código de rastreamento ou seu número de telefone.
          </p>
          <div className="text-xs text-blue-600">
            <p><strong>Código de exemplo:</strong> {pedidos[0]?.numero || 'DEL12345678'}</p>
            <p><strong>Telefone de exemplo:</strong> {pedidos[0]?.telefone || '(11) 99999-9999'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 