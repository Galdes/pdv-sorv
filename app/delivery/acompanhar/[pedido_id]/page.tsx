'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { Clock, CheckCircle, Truck, Store, DollarSign, MapPin, Phone } from 'lucide-react';

interface PedidoExterno {
  id: string;
  tipo_servico: 'entrega' | 'retirada';
  status: string;
  forma_pagamento: string;
  valor_total: number;
  valor_troco?: number;
  observacoes?: string;
  created_at: string;
  enderecos_entrega?: {
    nome_destinatario: string;
    telefone: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  itens_pedido_externo?: Array<{
    quantidade: number;
    observacoes?: string;
    produtos: {
      nome: string;
    };
  }>;
}

const statusSteps = [
  { key: 'pendente', label: 'Pedido Recebido', icon: Clock, color: 'text-yellow-600' },
  { key: 'confirmado', label: 'Confirmado', icon: CheckCircle, color: 'text-blue-600' },
  { key: 'preparando', label: 'Em Preparação', icon: Clock, color: 'text-orange-600' },
  { key: 'pronto', label: 'Pronto', icon: CheckCircle, color: 'text-green-600' },
  { key: 'em_entrega', label: 'Em Entrega', icon: Truck, color: 'text-purple-600' },
  { key: 'entregue', label: 'Entregue', icon: CheckCircle, color: 'text-gray-600' }
];

export default function AcompanharPedidoPage() {
  const [pedido, setPedido] = useState<PedidoExterno | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const pedidoId = params.pedido_id as string;

  useEffect(() => {
    if (pedidoId) {
      carregarPedido();
      // Atualizar a cada 30 segundos
      const interval = setInterval(carregarPedido, 30000);
      return () => clearInterval(interval);
    }
  }, [pedidoId]);

  const carregarPedido = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('pedidos_externos')
        .select(`
          *,
          enderecos_entrega(*),
          itens_pedido_externo(
            quantidade,
            observacoes,
            produtos(nome)
          )
        `)
        .eq('id', pedidoId)
        .single();

      if (error) throw error;
      setPedido(data);
    } catch (error: any) {
      console.error('Erro ao carregar pedido:', error);
      setError('Pedido não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!pedido) return -1;
    return statusSteps.findIndex(step => step.key === pedido.status);
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

  const getStatusMessage = () => {
    if (!pedido) return '';
    
    switch (pedido.status) {
      case 'pendente':
        return 'Seu pedido foi recebido e está sendo processado.';
      case 'confirmado':
        return 'Pagamento confirmado! Seu pedido será preparado em breve.';
      case 'preparando':
        return 'Seu pedido está sendo preparado com muito carinho!';
      case 'pronto':
        return pedido.tipo_servico === 'entrega' 
          ? 'Seu pedido está pronto! Em breve sairá para entrega.'
          : 'Seu pedido está pronto! Pode retirar no local.';
      case 'em_entrega':
        return 'Seu pedido está a caminho!';
      case 'entregue':
        return 'Pedido entregue! Aproveite!';
      case 'cancelado':
        return 'Pedido cancelado.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pedido não encontrado</h1>
          <p className="text-gray-600 mb-4">{error || 'O pedido solicitado não foi encontrado.'}</p>
          <a
            href="/delivery"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Delivery
          </a>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Acompanhar Pedido</h1>
            <p className="text-gray-600 mb-4">Pedido #{pedido.id.slice(-8).toUpperCase()}</p>
            <p className="text-sm text-gray-500">{formatarData(pedido.created_at)}</p>
          </div>
        </div>

        {/* Status do Pedido */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Status do Pedido</h2>
          
          {/* Timeline */}
          <div className="relative">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.key} className="flex items-center mb-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon size={20} className={isActive ? step.color : 'text-gray-400'} />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-blue-600 mt-1">{getStatusMessage()}</p>
                    )}
                  </div>
                  
                  {index < statusSteps.length - 1 && (
                    <div className={`w-px h-8 ml-5 ${
                      isActive ? 'bg-blue-200' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Informações do Pedido */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Detalhes do Pedido</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tipo de Serviço:</span>
              <div className="flex items-center gap-2">
                {pedido.tipo_servico === 'entrega' ? <Truck size={16} /> : <Store size={16} />}
                <span className="font-medium">
                  {pedido.tipo_servico === 'entrega' ? 'Entrega' : 'Retirada'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Forma de Pagamento:</span>
              <div className="flex items-center gap-2">
                <DollarSign size={16} />
                <span className="font-medium">{pedido.forma_pagamento?.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor Total:</span>
              <span className="font-bold text-lg text-blue-600">
                {formatarValor(pedido.valor_total)}
              </span>
            </div>
            
            {pedido.valor_troco && pedido.valor_troco > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Troco:</span>
                <span className="font-medium text-orange-600">
                  {formatarValor(pedido.valor_troco)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Endereço */}
        {pedido.enderecos_entrega && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Endereço de Entrega</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-500 mt-1" />
                <div>
                  <p className="font-medium">{pedido.enderecos_entrega.nome_destinatario}</p>
                  <p className="text-gray-600">{pedido.enderecos_entrega.telefone}</p>
                </div>
              </div>
              
              <p className="text-gray-600 ml-6">
                {pedido.enderecos_entrega.logradouro}, {pedido.enderecos_entrega.numero} - {pedido.enderecos_entrega.bairro}, {pedido.enderecos_entrega.cidade}/{pedido.enderecos_entrega.estado}
              </p>
            </div>
          </div>
        )}

        {/* Itens do Pedido */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Itens do Pedido</h2>
          
          <div className="space-y-3">
            {pedido.itens_pedido_externo?.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{item.quantidade}x {item.produtos.nome}</span>
                  {item.observacoes && (
                    <p className="text-sm text-gray-500 mt-1">{item.observacoes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {pedido.observacoes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-800 mb-2">Observações:</h3>
              <p className="text-gray-600">{pedido.observacoes}</p>
            </div>
          )}
        </div>

        {/* Contato */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">📞 Precisa de ajuda?</h2>
          <div className="flex items-center gap-3">
            <Phone size={20} className="text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Entre em contato</p>
              <p className="text-blue-600">(11) 99999-9999</p>
            </div>
          </div>
        </div>

        {/* Botão Voltar */}
        <div className="mt-6 text-center">
          <a
            href="/delivery"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Voltar ao Delivery
          </a>
        </div>
      </div>
    </div>
  );
} 