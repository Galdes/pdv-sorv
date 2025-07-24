'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Pedido, Produto, Mesa, Cliente } from '../../../lib/types';
import AdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminTable, 
  AdminTableHeader, 
  AdminTableHeaderCell, 
  AdminTableBody, 
  AdminTableCell 
} from '../../../components/AdminLayout';

interface PedidoCozinha extends Pedido {
  produtos?: Produto;
  comandas?: {
    clientes: Cliente;
    mesas: Mesa;
  };
  // Para pedidos de delivery
  pedidos_externos?: {
    tipo_servico: string;
    enderecos_entrega: Array<{
      nome_destinatario: string;
      telefone: string;
      endereco: string;
    }>;
  };
  // Para itens de pedidos externos
  itens_pedido_externo?: {
    quantidade: number;
    produtos: Array<{
      nome: string;
      preco: number;
    }>;
  };
  // Propriedades adicionais para unificação
  tipo: 'comanda' | 'delivery';
  tipo_servico?: string;
  valor_total?: number;
  itens?: Array<{
    quantidade: number;
    produtos: {
      nome: string;
      preco: number;
    };
  }>;
}

export default function CozinhaPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [pedidos, setPedidos] = useState<PedidoCozinha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'pendente' | 'preparando' | 'todos'>('todos');

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (!userData) {
      router.push('/admin/login');
      return;
    }
    setAdminUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => {
    if (!adminUser) return;
    fetchPedidosCozinha();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchPedidosCozinha, 30000);
    return () => clearInterval(interval);
  }, [adminUser, filtroStatus]);

  const fetchPedidosCozinha = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Primeiro buscar todas as mesas do bar
      const { data: mesas, error: errMesas } = await supabase
        .from('mesas')
        .select('id')
        .eq('bar_id', adminUser.bar_id);
      
      if (errMesas) throw errMesas;
      
      const mesaIds = mesas?.map(m => m.id) || [];

      // 2. Buscar comandas das mesas do bar
      const { data: comandas, error: errComandas } = await supabase
        .from('comandas')
        .select('id')
        .in('mesa_id', mesaIds);
      
      if (errComandas) throw errComandas;
      
      const comandaIds = comandas?.map((c: any) => c.id) || [];

      // 3. Buscar pedidos de comandas (apenas pendentes e preparando)
      let pedidosComandas: any[] = [];
      if (comandaIds.length > 0) {
        let queryComandas = supabase
          .from('pedidos')
          .select(`
            *,
            produtos:produto_id(*),
            comandas:comanda_id(
              clientes:cliente_id(*),
              mesas:mesa_id(*)
            )
          `)
          .in('comanda_id', comandaIds)
          .in('status', ['pendente', 'preparando'])
          .order('created_at', { ascending: true });

        if (filtroStatus !== 'todos') {
          queryComandas = queryComandas.eq('status', filtroStatus);
        }

        const { data: pedidosCom, error: errPedidosCom } = await queryComandas;
        if (errPedidosCom) throw errPedidosCom;
        
        pedidosComandas = (pedidosCom || []).map((pedido: any) => ({
          ...pedido,
          tipo: 'comanda',
          comandas: {
            clientes: pedido.comandas?.clientes,
            mesas: pedido.comandas?.mesas
          }
        }));
      }

      // 4. Buscar pedidos de delivery (apenas pendentes e preparando)
      let queryDelivery = supabase
        .from('pedidos_externos')
        .select(`
          *,
          enderecos_entrega(*),
          itens_pedido_externo(
            quantidade,
            produtos(*)
          )
        `)
        .eq('bar_id', adminUser.bar_id)
        .in('status', ['pendente', 'preparando'])
        .order('created_at', { ascending: true });

      if (filtroStatus !== 'todos') {
        queryDelivery = queryDelivery.eq('status', filtroStatus);
      }

      const { data: pedidosDelivery, error: errPedidosDelivery } = await queryDelivery;
      if (errPedidosDelivery) throw errPedidosDelivery;

      // Transformar pedidos de delivery em formato compatível
      const pedidosDeliveryFormatados = (pedidosDelivery || []).map((pedido: any) => ({
        id: pedido.id,
        status: pedido.status,
        created_at: pedido.created_at,
        tipo: 'delivery',
        tipo_servico: pedido.tipo_servico,
        pedidos_externos: {
          tipo_servico: pedido.tipo_servico,
          enderecos_entrega: pedido.enderecos_entrega
        },
        // Para cada item do pedido, criar um "pedido" separado
        itens: pedido.itens_pedido_externo?.map((item: any) => ({
          quantidade: item.quantidade,
          produtos: item.produtos
        })) || []
      }));

      // Combinar e ordenar todos os pedidos
      const todosPedidos = [
        ...pedidosComandas,
        ...pedidosDeliveryFormatados
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setPedidos(todosPedidos);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (pedidoId: string, novoStatus: string, tipo: string) => {
    setLoading(true);
    try {
      if (tipo === 'comanda') {
        // Atualizar pedido de comanda
        const { error: errUpdate } = await supabase
          .from('pedidos')
          .update({ status: novoStatus })
          .eq('id', pedidoId);
        
        if (errUpdate) throw errUpdate;
      } else {
        // Atualizar pedido de delivery
        const { error: errUpdate } = await supabase
          .from('pedidos_externos')
          .update({ status: novoStatus })
          .eq('id', pedidoId);
        
        if (errUpdate) throw errUpdate;
      }
      
      // Atualizar lista local
      setPedidos(prev => prev.map(pedido => 
        pedido.id === pedidoId 
          ? { ...pedido, status: novoStatus as any }
          : pedido
      ));
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-red-100 text-red-800 border-red-200';
      case 'preparando': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return '🆕 NOVO';
      case 'preparando': return '👨‍🍳 PREPARANDO';
      default: return status;
    }
  };

  const getTipoPedidoColor = (tipo: string) => {
    switch (tipo) {
      case 'delivery': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'comanda': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoPedidoText = (tipo: string, tipoServico?: string) => {
    if (tipo === 'delivery') {
      return tipoServico === 'entrega' ? '🚚 DELIVERY' : '📦 RETIRADA';
    }
    return '🍽️ COMANDA';
  };

  const formatarTempo = (data: string) => {
    const agora = new Date();
    const dataPedido = new Date(data);
    const diffMs = agora.getTime() - dataPedido.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `${diffMin}min atrás`;
    
    const diffHoras = Math.floor(diffMin / 60);
    return `${diffHoras}h ${diffMin % 60}min atrás`;
  };

  const formatarHora = (data: string) => {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTotalPendentes = () => {
    return pedidos.filter(p => p.status === 'pendente').length;
  };

  const calcularTotalPreparando = () => {
    return pedidos.filter(p => p.status === 'preparando').length;
  };

  const calcularTotalDelivery = () => {
    return pedidos.filter(p => p.tipo === 'delivery').length;
  };

  const calcularTotalComandas = () => {
    return pedidos.filter(p => p.tipo === 'comanda').length;
  };

  if (!adminUser) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <AdminLayout
      title="Cozinha"
      subtitle="Pedidos para preparação"
      onBack={() => router.push('/admin/dashboard')}
    >
      {/* Estatísticas Simplificadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{calcularTotalPendentes()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Novos</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{calcularTotalPreparando()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Preparando</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{calcularTotalDelivery()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Delivery</div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{calcularTotalComandas()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Comandas</div>
          </div>
        </AdminCard>
      </div>

      {/* Filtros */}
      <AdminCard title="Filtros" className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              filtroStatus === 'todos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Ver todos os pedidos da cozinha"
          >
            Todos ({pedidos.length})
          </button>
          
          <button
            onClick={() => setFiltroStatus('pendente')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              filtroStatus === 'pendente'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Ver apenas pedidos novos"
          >
            Novos ({calcularTotalPendentes()})
          </button>
          
          <button
            onClick={() => setFiltroStatus('preparando')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              filtroStatus === 'preparando'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Ver apenas pedidos em preparação"
          >
            Preparando ({calcularTotalPreparando()})
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          <p>�� Atualização automática a cada 30 segundos</p>
        </div>
      </AdminCard>

      {/* Lista de Pedidos Simplificada */}
      <AdminCard title={`Pedidos da Cozinha (${pedidos.length})`}>
        {loading ? (
          <div className="text-center">Carregando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-300">
            {filtroStatus === 'todos' 
              ? 'Nenhum pedido na cozinha no momento' 
              : `Nenhum pedido ${filtroStatus === 'pendente' ? 'novo' : 'em preparação'} no momento`
            }
          </div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell>Tipo</AdminTableHeaderCell>
              <AdminTableHeaderCell>Status</AdminTableHeaderCell>
              <AdminTableHeaderCell>Produto</AdminTableHeaderCell>
              <AdminTableHeaderCell>Destino</AdminTableHeaderCell>
              <AdminTableHeaderCell>Tempo</AdminTableHeaderCell>
              <AdminTableHeaderCell>Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="border-b border-gray-200">
                  <AdminTableCell>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border-2 ${getTipoPedidoColor(pedido.tipo)}`}>
                      {getTipoPedidoText(pedido.tipo, pedido.tipo_servico)}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border-2 ${getStatusColor(pedido.status)}`}>
                      {getStatusText(pedido.status)}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-y-1">
                      {pedido.tipo === 'comanda' ? (
                        <>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {pedido.produtos?.nome}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Qtd: {pedido.quantidade}
                          </div>
                          {pedido.observacoes && (
                            <div className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400 dark:border-yellow-500">
                              <span className="font-semibold text-yellow-800 dark:text-yellow-200">📝</span> <span className="text-yellow-700 dark:text-yellow-200">{pedido.observacoes}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            Pedido #{pedido.id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {pedido.itens?.map((item: any, index: number) => (
                              <div key={index}>
                                {item.quantidade}x {item.produtos?.nome}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-center">
                      {pedido.tipo === 'comanda' ? (
                        <>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            Mesa {pedido.comandas?.mesas?.numero}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {pedido.comandas?.mesas?.descricao || 'Mesa padrão'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {pedido.tipo_servico === 'entrega' ? '🚚 Entrega' : '📦 Retirada'}
                          </div>
                          {pedido.tipo_servico === 'entrega' && pedido.pedidos_externos?.enderecos_entrega?.[0] && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {pedido.pedidos_externos.enderecos_entrega[0].endereco}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatarHora(pedido.created_at)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatarTempo(pedido.created_at)}
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-y-2">
                      {pedido.status === 'pendente' && (
                        <AdminButton
                          variant="warning"
                          size="sm"
                          onClick={() => handleStatusChange(pedido.id, 'preparando', pedido.tipo)}
                          title="Iniciar preparação deste pedido"
                          className="w-full"
                        >
                          🍳 Iniciar
                        </AdminButton>
                      )}
                      
                      {pedido.status === 'preparando' && (
                        <AdminButton
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusChange(pedido.id, 'entregue', pedido.tipo)}
                          title="Marcar como entregue"
                          className="w-full"
                        >
                          ✅ Pronto
                        </AdminButton>
                      )}
                    </div>
                  </AdminTableCell>
                </tr>
              ))}
            </AdminTableBody>
          </AdminTable>
        )}
      </AdminCard>
    </AdminLayout>
  );
} 