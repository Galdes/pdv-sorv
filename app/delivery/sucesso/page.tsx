'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, Phone, MapPin, Home } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

function SucessoDeliveryContent() {
  const [pedidoInfo, setPedidoInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedido_id');

  useEffect(() => {
    if (pedidoId) {
      carregarPedido(pedidoId);
    } else {
      // Fallback para dados simulados se não houver pedido_id
      setPedidoInfo({
        numero: 'DEL' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        tipo: 'Retirada',
        tempoEstimado: '15-20 minutos',
        telefone: '(11) 99999-9999',
        endereco: 'Rua das Flores, 123 - Centro, São Paulo/SP'
      });
      setLoading(false);
    }
  }, [pedidoId]);

  const carregarPedido = async (id: string) => {
    try {
      // Buscar pedido com endereço
      const { data: pedido, error } = await supabase
        .from('pedidos_externos')
        .select(`
          *,
          enderecos_entrega(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Buscar itens do pedido
      const { data: itens, error: itensError } = await supabase
        .from('itens_pedido_externo')
        .select(`
          *,
          produtos(nome, descricao)
        `)
        .eq('pedido_externo_id', id);

      if (itensError) throw itensError;

      // Formatar dados do pedido
      const pedidoFormatado = {
        id: pedido.id,
        numero: 'DEL' + pedido.id.slice(-8).toUpperCase(),
        tipo: pedido.tipo_servico === 'entrega' ? 'Entrega' : 'Retirada',
        status: pedido.status,
        formaPagamento: pedido.forma_pagamento,
        valorTotal: pedido.valor_total,
        tempoEstimado: pedido.tipo_servico === 'entrega' ? '30-45 minutos' : '15-20 minutos',
        telefone: pedido.enderecos_entrega?.telefone || '(11) 99999-9999',
        endereco: pedido.enderecos_entrega ? 
          `${pedido.enderecos_entrega.logradouro}, ${pedido.enderecos_entrega.numero} - ${pedido.enderecos_entrega.bairro}, ${pedido.enderecos_entrega.cidade}/${pedido.enderecos_entrega.estado}` :
          'Retirada no local',
        itens: itens || [],
        observacoes: pedido.observacoes,
        created_at: pedido.created_at
      };

      setPedidoInfo(pedidoFormatado);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      // Fallback para dados simulados
      setPedidoInfo({
        numero: 'DEL' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        tipo: 'Retirada',
        tempoEstimado: '15-20 minutos',
        telefone: '(11) 99999-9999',
        endereco: 'Rua das Flores, 123 - Centro, São Paulo/SP'
      });
    } finally {
      setLoading(false);
    }
  };

  const voltarAoCardapio = () => {
    router.push('/delivery/cardapio');
  };

  const acompanharPedido = () => {
    if (pedidoInfo?.id) {
      router.push(`/delivery/acompanhar/${pedidoInfo.id}`);
    } else {
      alert('ID do pedido não encontrado');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!pedidoInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Pedido não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Ícone de Sucesso */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Pedido Confirmado!</h1>
            <p className="text-gray-600">Seu pedido foi recebido com sucesso</p>
          </div>

          {/* Informações do Pedido */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Número do Pedido:</span>
                <span className="font-bold text-lg text-blue-600">{pedidoInfo.numero}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tipo de Serviço:</span>
                <span className="font-medium">{pedidoInfo.tipo}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tempo Estimado:</span>
                <span className="font-medium text-orange-600">{pedidoInfo.tempoEstimado}</span>
              </div>
            </div>
          </div>

          {/* Status do Pedido */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Status do Pedido</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Pedido Recebido</span>
              </div>
              <div className="w-8 h-1 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                <span className="text-sm text-gray-500">Em Preparação</span>
              </div>
              <div className="w-8 h-1 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                <span className="text-sm text-gray-500">Pronto</span>
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-800 mb-4">📞 Informações de Contato</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <Phone size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium text-gray-800">Telefone</p>
                  <p className="text-gray-600">{pedidoInfo.telefone}</p>
                </div>
              </div>
              
              {pedidoInfo.tipo === 'Entrega' && (
                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-800">Endereço de Entrega</p>
                    <p className="text-gray-600">{pedidoInfo.endereco}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Próximos Passos */}
          <div className="bg-green-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-800 mb-3">✅ Próximos Passos</h3>
            <ul className="text-sm text-green-700 space-y-2 text-left">
              <li>• Nosso atendente confirmará o pagamento</li>
              <li>• Seu pedido será preparado</li>
              <li>• Você receberá notificação quando estiver pronto</li>
              <li>• {pedidoInfo.tipo === 'Retirada' ? 'Retire no local' : 'Entregaremos no seu endereço'}</li>
            </ul>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            <button
              onClick={acompanharPedido}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Acompanhar Pedido
            </button>
            
            <button
              onClick={voltarAoCardapio}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Fazer Novo Pedido
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full text-gray-500 py-2 px-4 hover:text-gray-700 transition-colors text-sm"
            >
              Voltar ao Início
            </button>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Em caso de dúvidas, entre em contato conosco pelo telefone {pedidoInfo.telefone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SucessoDelivery() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <SucessoDeliveryContent />
    </Suspense>
  );
} 