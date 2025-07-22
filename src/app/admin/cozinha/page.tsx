'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import type { Pedido, Produto, Mesa, Cliente } from '../../../../lib/types';
import AdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminTable, 
  AdminTableHeader, 
  AdminTableHeaderCell, 
  AdminTableBody, 
  AdminTableCell 
} from '../../../../components/AdminLayout';

interface PedidoCozinha extends Pedido {
  produtos: Produto;
  comandas: {
    clientes: Cliente;
    mesas: Mesa;
  };
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
      
      if (!mesas || mesas.length === 0) {
        setPedidos([]);
        return;
      }

      const mesaIds = mesas.map(m => m.id);
      
      // 2. Buscar comandas das mesas do bar
      const { data: comandas, error: errComandas } = await supabase
        .from('comandas')
        .select('id')
        .in('mesa_id', mesaIds);
      
      if (errComandas) throw errComandas;
      
      if (!comandas || comandas.length === 0) {
        setPedidos([]);
        return;
      }

      const comandaIds = comandas.map((c: any) => c.id);
      
      // Buscar pedidos para cozinha (pendentes e preparando)
      let query = supabase
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
        .order('created_at', { ascending: true }); // Mais antigos primeiro

      // Aplicar filtro de status
      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }

      const { data: pedidos, error: errPedidos } = await query;
      if (errPedidos) throw errPedidos;
      
      // Transformar os dados para o formato esperado
      const pedidosFormatados = (pedidos || []).map((pedido: any) => ({
        ...pedido,
        comandas: {
          clientes: pedido.comandas?.clientes,
          mesas: pedido.comandas?.mesas
        }
      }));
      
      setPedidos(pedidosFormatados);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (pedidoId: string, novoStatus: string) => {
    setLoading(true);
    try {
      const { error: errUpdate } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedidoId);
      
      if (errUpdate) throw errUpdate;
      
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

  if (!adminUser) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <AdminLayout
      title="Cozinha"
      subtitle="Pedidos para preparação"
      onBack={() => router.push('/admin/dashboard')}
    >
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{calcularTotalPendentes()}</div>
            <div className="text-sm text-gray-600">Pedidos Novos</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{calcularTotalPreparando()}</div>
            <div className="text-sm text-gray-600">Em Preparação</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{pedidos.length}</div>
            <div className="text-sm text-gray-600">Total na Cozinha</div>
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
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Ver apenas pedidos em preparação"
          >
            Preparando ({calcularTotalPreparando()})
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>🔄 Atualização automática a cada 30 segundos</p>
        </div>
      </AdminCard>

      {/* Lista de Pedidos */}
      <AdminCard title={`Pedidos da Cozinha (${pedidos.length})`}>
        {loading ? (
          <div className="text-center">Carregando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center text-gray-600">
            {filtroStatus === 'todos' 
              ? 'Nenhum pedido na cozinha no momento' 
              : `Nenhum pedido ${filtroStatus === 'pendente' ? 'novo' : 'em preparação'} no momento`
            }
          </div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell>Status</AdminTableHeaderCell>
              <AdminTableHeaderCell>Pedido</AdminTableHeaderCell>
              <AdminTableHeaderCell>Mesa</AdminTableHeaderCell>
              <AdminTableHeaderCell>Cliente</AdminTableHeaderCell>
              <AdminTableHeaderCell>Tempo</AdminTableHeaderCell>
              <AdminTableHeaderCell>Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="border-b border-gray-200">
                  <AdminTableCell>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border-2 ${getStatusColor(pedido.status)}`}>
                      {getStatusText(pedido.status)}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-gray-900">
                        {pedido.produtos?.nome}
                      </div>
                      <div className="text-sm text-gray-600">
                        Qtd: {pedido.quantidade} x R$ {pedido.preco_unitario?.toFixed(2)}
                      </div>
                      {pedido.observacoes && (
                        <div className="text-sm bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                          <span className="font-semibold">📝 Observações:</span> {pedido.observacoes}
                        </div>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        Mesa {pedido.comandas?.mesas?.numero}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pedido.comandas?.mesas?.descricao || 'Mesa padrão'}
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">
                        {pedido.comandas?.clientes?.nome || 'Sem nome'}
                      </div>
                      <div className="text-sm text-gray-600">
                        📱 {pedido.comandas?.clientes?.telefone}
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatarHora(pedido.created_at)}
                      </div>
                      <div className="text-xs text-gray-500">
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
                          onClick={() => handleStatusChange(pedido.id, 'preparando')}
                          title="Iniciar preparação deste pedido"
                          className="w-full"
                        >
                          🍳 Iniciar Preparação
                        </AdminButton>
                      )}
                      
                      {pedido.status === 'preparando' && (
                        <AdminButton
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusChange(pedido.id, 'entregue')}
                          title="Marcar como entregue"
                          className="w-full"
                        >
                          ✅ Pronto para Entrega
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