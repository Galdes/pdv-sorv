'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import AdminLayout, { AdminCard, AdminButton } from '../../../../components/AdminLayout';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface RelatorioVendas {
  totalVendas: number;
  totalPedidos: number;
  ticketMedio: number;
  pedidosHoje: number;
  vendasHoje: number;
  pedidosSemana: number;
  vendasSemana: number;
  pedidosMes: number;
  vendasMes: number;
}

interface PedidoRelatorio {
  id: string;
  created_at: string;
  valor_total: number;
  status: string;
  tipo_servico: string;
  enderecos_entrega: Array<{
    nome_destinatario: string;
  }> | null;
  itens_pedido_externo: Array<{
    quantidade: number;
    produtos: Array<{
      nome: string;
    }>;
  }>;
}

export default function RelatoriosDeliveryPage() {
  const [relatorio, setRelatorio] = useState<RelatorioVendas>({
    totalVendas: 0,
    totalPedidos: 0,
    ticketMedio: 0,
    pedidosHoje: 0,
    vendasHoje: 0,
    pedidosSemana: 0,
    vendasSemana: 0,
    pedidosMes: 0,
    vendasMes: 0
  });
  const [pedidos, setPedidos] = useState<PedidoRelatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState('hoje');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const router = useRouter();

  useEffect(() => {
    carregarRelatorios();
  }, [filtroPeriodo, filtroStatus]);

  useEffect(() => {
    setPaginaAtual(1); // Resetar para primeira página quando mudar filtros
  }, [filtroPeriodo, filtroStatus]);

  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      
      // Calcular datas
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay());
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      // Buscar pedidos
      let query = supabase
        .from('pedidos_externos')
        .select(`
          id,
          created_at,
          valor_total,
          status,
          tipo_servico,
          enderecos_entrega(nome_destinatario),
          itens_pedido_externo(
            quantidade,
            produtos(nome)
          )
        `)
        .eq('bar_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtroPeriodo === 'hoje') {
        query = query.gte('created_at', inicioHoje.toISOString());
      } else if (filtroPeriodo === 'semana') {
        query = query.gte('created_at', inicioSemana.toISOString());
      } else if (filtroPeriodo === 'mes') {
        query = query.gte('created_at', inicioMes.toISOString());
      }

      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }

      const { data: pedidosData, error } = await query;

      if (error) throw error;

      console.log('Pedidos carregados:', pedidosData);
      setPedidos(pedidosData || []);

      // Calcular estatísticas
      const calcularEstatisticas = (pedidos: PedidoRelatorio[]) => {
        const totalVendas = pedidos.reduce((sum, pedido) => sum + pedido.valor_total, 0);
        const totalPedidos = pedidos.length;
        const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;

        // Pedidos de hoje
        const pedidosHoje = pedidos.filter(pedido => 
          new Date(pedido.created_at) >= inicioHoje
        );
        const vendasHoje = pedidosHoje.reduce((sum, pedido) => sum + pedido.valor_total, 0);

        // Pedidos da semana
        const pedidosSemana = pedidos.filter(pedido => 
          new Date(pedido.created_at) >= inicioSemana
        );
        const vendasSemana = pedidosSemana.reduce((sum, pedido) => sum + pedido.valor_total, 0);

        // Pedidos do mês
        const pedidosMes = pedidos.filter(pedido => 
          new Date(pedido.created_at) >= inicioMes
        );
        const vendasMes = pedidosMes.reduce((sum, pedido) => sum + pedido.valor_total, 0);

        setRelatorio({
          totalVendas,
          totalPedidos,
          ticketMedio,
          pedidosHoje: pedidosHoje.length,
          vendasHoje,
          pedidosSemana: pedidosSemana.length,
          vendasSemana,
          pedidosMes: pedidosMes.length,
          vendasMes
        });
      };

      calcularEstatisticas(pedidosData || []);

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarRelatorio = () => {
    const csvContent = [
      ['ID', 'Data', 'Cliente', 'Valor Total', 'Status', 'Tipo Serviço'],
      ...pedidos.map(pedido => [
        pedido.id,
        new Date(pedido.created_at).toLocaleDateString('pt-BR'),
        pedido.enderecos_entrega?.[0]?.nome_destinatario || 'N/A',
        `R$ ${pedido.valor_total.toFixed(2)}`,
        pedido.status,
        pedido.tipo_servico
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-delivery-${filtroPeriodo}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'preparando': return 'bg-blue-100 text-blue-800';
      case 'pronto': return 'bg-green-100 text-green-800';
      case 'entregando': return 'bg-purple-100 text-purple-800';
      case 'entregue': return 'bg-gray-100 text-gray-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Funções de paginação
  const totalPaginas = Math.ceil(pedidos.length / itensPorPagina);
  const inicioIndex = (paginaAtual - 1) * itensPorPagina;
  const fimIndex = inicioIndex + itensPorPagina;
  const pedidosPaginados = pedidos.slice(inicioIndex, fimIndex);

  const irParaPagina = (pagina: number) => {
    setPaginaAtual(pagina);
  };

  const proximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };

  const paginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };

  const gerarBotoesPagina = () => {
    const botoes = [];
    const maxBotoes = 5;
    let inicio = Math.max(1, paginaAtual - Math.floor(maxBotoes / 2));
    let fim = Math.min(totalPaginas, inicio + maxBotoes - 1);

    if (fim - inicio + 1 < maxBotoes) {
      inicio = Math.max(1, fim - maxBotoes + 1);
    }

    for (let i = inicio; i <= fim; i++) {
      botoes.push(i);
    }

    return botoes;
  };

  if (loading) {
    return (
      <AdminLayout title="Relatórios de Vendas">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Relatórios de Vendas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios de Vendas</h1>
            <p className="text-gray-600 dark:text-gray-300">Análise detalhada das vendas do delivery</p>
          </div>
          <div className="flex gap-2">
            <AdminButton
              onClick={exportarRelatorio}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Download size={20} />
              Exportar CSV
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={() => router.push('/admin/delivery')}
            >
              Voltar
            </AdminButton>
          </div>
        </div>

        {/* Filtros */}
        <AdminCard>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Filtros:</span>
            </div>
            
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="hoje">Hoje</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mês</option>
              <option value="todos">Todos</option>
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="preparando">Preparando</option>
              <option value="pronto">Pronto</option>
              <option value="entregando">Entregando</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </AdminCard>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatarMoeda(relatorio.totalVendas)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-green-600" />
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{relatorio.totalPedidos}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag size={24} className="text-blue-600" />
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatarMoeda(relatorio.ticketMedio)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 size={24} className="text-purple-600" />
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pedidos Hoje</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{relatorio.pedidosHoje}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatarMoeda(relatorio.vendasHoje)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar size={24} className="text-orange-600" />
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Estatísticas por Período */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminCard>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Esta Semana</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Pedidos:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{relatorio.pedidosSemana}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Vendas:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatarMoeda(relatorio.vendasSemana)}</span>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Este Mês</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Pedidos:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{relatorio.pedidosMes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Vendas:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatarMoeda(relatorio.vendasMes)}</span>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Métricas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Taxa de Conversão:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {relatorio.totalPedidos > 0 ? ((relatorio.pedidosHoje / relatorio.totalPedidos) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Crescimento:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {relatorio.vendasSemana > 0 ? ((relatorio.vendasHoje / relatorio.vendasSemana) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Lista de Pedidos */}
        <AdminCard>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pedidos Recentes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {pedidosPaginados.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{pedido.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                      {pedido.enderecos_entrega?.[0]?.nome_destinatario || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {formatarMoeda(pedido.valor_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pedido.status)}`}>
                        {pedido.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {pedido.tipo_servico}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Mostrando {inicioIndex + 1} a {Math.min(fimIndex, pedidos.length)} de {pedidos.length} pedidos
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={paginaAnterior}
                  disabled={paginaAtual === 1}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    paginaAtual === 1
                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Anterior
                </button>

                {gerarBotoesPagina().map((pagina) => (
                  <button
                    key={pagina}
                    onClick={() => irParaPagina(pagina)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pagina === paginaAtual
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pagina}
                  </button>
                ))}

                <button
                  onClick={proximaPagina}
                  disabled={paginaAtual === totalPaginas}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    paginaAtual === totalPaginas
                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </AdminCard>
      </div>
    </AdminLayout>
  );
}