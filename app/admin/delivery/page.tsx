'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import AdminLayout, { AdminCard, AdminButton } from '../../../components/AdminLayout';
import { usePrint } from '../../../lib/hooks/usePrint';
import { 
  Truck, 
  Store, 
  DollarSign, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Printer,
  Phone,
  Calendar,
  Package
} from 'lucide-react';

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

export default function AdminDeliveryPage() {
  const [pedidos, setPedidos] = useState<PedidoExterno[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroData, setFiltroData] = useState('hoje');
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    emPreparo: 0,
    prontos: 0,
    entregues: 0,
    cancelados: 0
  });
  const router = useRouter();
  const { printThermal, isPrinting, printError, clearError } = usePrint();

  useEffect(() => {
    carregarPedidos();
  }, []);

  useEffect(() => {
    carregarPedidos();
  }, [filtroStatus, filtroTipo, filtroData]);

  const carregarPedidos = async () => {
    setLoading(true);
    try {
      let query = supabase
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
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }
      
      if (filtroTipo !== 'todos') {
        query = query.eq('tipo_servico', filtroTipo);
      }

      // Filtro de data
      if (filtroData === 'hoje') {
        const hoje = new Date().toISOString().split('T')[0];
        query = query.gte('created_at', hoje);
      } else if (filtroData === 'semana') {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
        query = query.gte('created_at', umaSemanaAtras.toISOString());
      } else if (filtroData === 'mes') {
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);
        query = query.gte('created_at', umMesAtras.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setPedidos(data || []);
      calcularEstatisticas(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = (pedidosData: PedidoExterno[]) => {
    const stats = {
      total: pedidosData.length,
      pendentes: pedidosData.filter(p => p.status === 'pendente').length,
      emPreparo: pedidosData.filter(p => p.status === 'preparando').length,
      prontos: pedidosData.filter(p => p.status === 'pronto').length,
      entregues: pedidosData.filter(p => p.status === 'entregue').length,
      cancelados: pedidosData.filter(p => p.status === 'cancelado').length
    };
    setStats(stats);
  };

  const atualizarStatus = async (pedidoId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('pedidos_externos')
        .update({ status: novoStatus })
        .eq('id', pedidoId);

      if (error) throw error;
      
      // Recarregar pedidos
      carregarPedidos();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido');
    }
  };

  const confirmarPagamento = async (pedidoId: string) => {
    try {
      const { error } = await supabase
        .from('pedidos_externos')
        .update({ status: 'confirmado' })
        .eq('id', pedidoId);

      if (error) throw error;
      
      alert('Pagamento confirmado com sucesso!');
      carregarPedidos();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      alert('Erro ao confirmar pagamento.');
    }
  };

  const imprimirPedido = async (pedido: PedidoExterno) => {
    const dataFormatada = new Date(pedido.created_at).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const conteudoImpressao = `
${'='.repeat(48)}
           SORVETERIA CONTEINER
           PEDIDO DE DELIVERY
${'='.repeat(48)}

PEDIDO: #${pedido.id.slice(-8).toUpperCase()}
DATA: ${dataFormatada}
STATUS: ${pedido.status.toUpperCase()}
TIPO: ${pedido.tipo_servico === 'entrega' ? 'ENTREGA' : 'RETIRADA'}
PAGAMENTO: ${pedido.forma_pagamento.toUpperCase()}
${'-'.repeat(48)}
CLIENTE: ${pedido.enderecos_entrega?.nome_destinatario || 'N/A'}
TELEFONE: ${pedido.enderecos_entrega?.telefone || 'N/A'}
${'-'.repeat(48)}
ENDEREÇO:
${pedido.enderecos_entrega ? 
  `${pedido.enderecos_entrega.logradouro}, ${pedido.enderecos_entrega.numero}` : 
  'RETIRADA NO LOCAL'}
${pedido.enderecos_entrega ? 
  `${pedido.enderecos_entrega.bairro}, ${pedido.enderecos_entrega.cidade}/${pedido.enderecos_entrega.estado}` : 
  ''}
${'-'.repeat(48)}
ITENS DO PEDIDO:
${pedido.itens_pedido_externo?.map(item => 
  `${item.quantidade}x ${item.produtos.nome}${item.observacoes ? `\n  (${item.observacoes})` : ''}`
).join('\n') || 'Nenhum item encontrado'}
${'-'.repeat(48)}
TOTAL: R$ ${pedido.valor_total.toFixed(2).replace('.', ',')}
${pedido.valor_troco && pedido.valor_troco > 0 ? `TROCO: R$ ${pedido.valor_troco.toFixed(2).replace('.', ',')}\n` : ''}${'-'.repeat(48)}
OBSERVAÇÕES:
${pedido.observacoes || 'Nenhuma observação'}
${'-'.repeat(48)}
           OBRIGADO PELA PREFERÊNCIA!

        Nosso Instagram: @containersorv
${'='.repeat(48)}
`;

    try {
      const result = await printThermal(conteudoImpressao, `Pedido #${pedido.id.slice(-8).toUpperCase()}`);
      
      if (!result.success) {
        alert(`Erro ao imprimir: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao imprimir pedido:', error);
      alert('Erro ao imprimir pedido');
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
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'confirmado':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'preparando':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'pronto':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'em_entrega':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'entregue':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock size={16} />;
      case 'confirmado':
        return <CheckCircle size={16} />;
      case 'preparando':
        return <AlertCircle size={16} />;
      case 'pronto':
        return <CheckCircle size={16} />;
      case 'em_entrega':
        return <Truck size={16} />;
      case 'entregue':
        return <CheckCircle size={16} />;
      case 'cancelado':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusTimeline = (status: string) => {
    const steps = [
      { key: 'pendente', label: 'Pendente', icon: <Clock size={14} /> },
      { key: 'confirmado', label: 'Confirmado', icon: <CheckCircle size={14} /> },
      { key: 'preparando', label: 'Preparando', icon: <AlertCircle size={14} /> },
      { key: 'pronto', label: 'Pronto', icon: <CheckCircle size={14} /> },
      { key: 'em_entrega', label: 'Em Entrega', icon: <Truck size={14} /> },
      { key: 'entregue', label: 'Entregue', icon: <CheckCircle size={14} /> }
    ];

    const currentIndex = steps.findIndex(step => step.key === status);
    
    return (
      <div className="flex items-center gap-2 mt-3">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              index <= currentIndex 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-4 h-0.5 mx-1 ${
                index < currentIndex ? 'bg-blue-300' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout title="Gestão de Delivery">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🚚 Gestão de Delivery</h1>
              <p className="text-gray-600">Gerencie pedidos de delivery e retirada</p>
            </div>
            <div className="flex gap-2">
              <AdminButton
                variant="primary"
                onClick={() => router.push('/admin/delivery/relatorios')}
              >
                📊 Relatórios
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => router.push('/admin/delivery/configuracoes')}
              >
                ⚙️ Configurações
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => router.push('/admin/dashboard')}
              >
                Voltar
              </AdminButton>
            </div>
          </div>
        </div>

        {/* Notificação de Erro de Impressão */}
        {printError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-500" />
                <span className="text-red-800 font-medium">Erro na Impressão</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                <XCircle size={20} />
              </button>
            </div>
            <p className="text-red-700 mt-2">{printError}</p>
          </div>
        )}

        {/* Filtros */}
        <AdminCard>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="preparando">Preparando</option>
              <option value="pronto">Pronto</option>
              <option value="em_entrega">Em Entrega</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="entrega">Entrega</option>
              <option value="retirada">Retirada</option>
            </select>

            <select
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="todos">Todas as Datas</option>
              <option value="hoje">Hoje</option>
              <option value="semana">Última Semana</option>
              <option value="mes">Último Mês</option>
            </select>
            
            <AdminButton
              variant="primary"
              onClick={carregarPedidos}
            >
              Atualizar
            </AdminButton>
          </div>
        </AdminCard>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <AdminCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.emPreparo}</div>
              <div className="text-sm text-gray-600">Em Preparo</div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.prontos}</div>
              <div className="text-sm text-gray-600">Prontos</div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.entregues}</div>
              <div className="text-sm text-gray-600">Entregues</div>
            </div>
          </AdminCard>
          
          <AdminCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.cancelados}</div>
              <div className="text-sm text-gray-600">Cancelados</div>
            </div>
          </AdminCard>
        </div>

        {/* Lista de Pedidos */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <AdminCard>
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando pedidos...</p>
              </div>
            </AdminCard>
          ) : pedidos.length === 0 ? (
            <AdminCard>
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhum pedido encontrado</p>
              </div>
            </AdminCard>
          ) : (
            pedidos.map((pedido) => (
              <AdminCard key={pedido.id}>
                {/* Header do Pedido */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                      <Package size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Pedido #{pedido.id.slice(-8).toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar size={14} />
                          {formatarData(pedido.created_at)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {pedido.tipo_servico === 'entrega' ? <Truck size={14} /> : <Store size={14} />}
                          {pedido.tipo_servico === 'entrega' ? 'Entrega' : 'Retirada'}
                        </div>
                      </div>
                      {getStatusTimeline(pedido.status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatarValor(pedido.valor_total)}
                      </div>
                      <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {pedido.forma_pagamento?.toUpperCase()}
                      </div>
                      {pedido.valor_troco && pedido.valor_troco > 0 && (
                        <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-1">
                          Troco: {formatarValor(pedido.valor_troco)}
                        </div>
                      )}
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${getStatusColor(pedido.status)}`}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(pedido.status)}
                        {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                      </div>
                    </span>
                  </div>
                </div>

                {/* Informações do Cliente */}
                {pedido.enderecos_entrega && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${pedido.tipo_servico === 'retirada' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                        {pedido.tipo_servico === 'retirada' ? <Store size={16} className="text-white" /> : <MapPin size={16} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{pedido.enderecos_entrega.nome_destinatario}</h4>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone size={14} />
                            {pedido.enderecos_entrega.telefone}
                          </div>
                        </div>
                        {pedido.tipo_servico === 'retirada' ? (
                          <div className="text-sm text-gray-700">
                            <p className="font-medium text-orange-600">📍 Retirada no local</p>
                            <p className="text-gray-600">Cliente retirará na sorveteria</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-700">
                              {pedido.enderecos_entrega.logradouro}, {pedido.enderecos_entrega.numero} - {pedido.enderecos_entrega.bairro}
                            </p>
                            <p className="text-sm text-gray-600">
                              {pedido.enderecos_entrega.cidade}/{pedido.enderecos_entrega.estado}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Itens do Pedido */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package size={16} />
                    Itens do Pedido
                  </h4>
                  <div className="space-y-2">
                    {pedido.itens_pedido_externo?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                            {item.quantidade}x
                          </span>
                          <span className="font-medium text-black">{item.produtos.nome}</span>
                        </div>
                        {item.observacoes && (
                          <span className="text-sm text-gray-600 bg-yellow-50 px-2 py-1 rounded">
                            {item.observacoes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                {pedido.observacoes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Observações
                    </h4>
                    <p className="text-sm text-gray-700">{pedido.observacoes}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <AdminButton
                    variant="primary"
                    onClick={() => imprimirPedido(pedido)}
                    disabled={isPrinting}
                  >
                    <Printer size={16} className="mr-2" />
                    {isPrinting ? 'Imprimindo...' : 'Imprimir Pedido'}
                  </AdminButton>

                  {pedido.status === 'pendente' && (
                    <>
                      <AdminButton
                        variant="success"
                        onClick={() => confirmarPagamento(pedido.id)}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Confirmar Pagamento
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        onClick={() => atualizarStatus(pedido.id, 'cancelado')}
                      >
                        <XCircle size={16} className="mr-2" />
                        Cancelar
                      </AdminButton>
                    </>
                  )}
                  
                  {pedido.status === 'confirmado' && (
                    <AdminButton
                      variant="primary"
                      onClick={() => atualizarStatus(pedido.id, 'preparando')}
                    >
                      Iniciar Preparo
                    </AdminButton>
                  )}
                  
                  {pedido.status === 'preparando' && (
                    <AdminButton
                      variant="success"
                      onClick={() => atualizarStatus(pedido.id, 'pronto')}
                    >
                      Marcar como Pronto
                    </AdminButton>
                  )}
                  
                  {pedido.status === 'pronto' && pedido.tipo_servico === 'entrega' && (
                    <AdminButton
                      variant="warning"
                      onClick={() => atualizarStatus(pedido.id, 'em_entrega')}
                    >
                      Iniciar Entrega
                    </AdminButton>
                  )}
                  
                  {pedido.status === 'pronto' && pedido.tipo_servico === 'retirada' && (
                    <AdminButton
                      variant="success"
                      onClick={() => atualizarStatus(pedido.id, 'entregue')}
                    >
                      Entregue
                    </AdminButton>
                  )}
                  
                  {pedido.status === 'em_entrega' && (
                    <AdminButton
                      variant="success"
                      onClick={() => atualizarStatus(pedido.id, 'entregue')}
                    >
                      Confirmar Entrega
                    </AdminButton>
                  )}
                </div>
              </AdminCard>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 