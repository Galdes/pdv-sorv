'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabaseClient';
import AdminLayout, { AdminCard, AdminButton } from '../../../../../components/AdminLayout';

interface RelatorioData {
  totalVendas: number;
  totalPedidos: number;
  pedidosPendentes: number;
  pedidosEntregues: number;
  pedidosPagos: number;
  mediaTicket: number;
  topProdutos: Array<{
    nome: string;
    quantidade: number;
    total: number;
  }>;
  vendasPorDia: Array<{
    data: string;
    vendas: number;
    pedidos: number;
  }>;
  estabelecimentosAtivos: number;
  estabelecimentosInativos: number;
  estabelecimentosDetalhados: Array<{
    id: string;
    nome: string;
    endereco: string;
    telefone: string;
    email: string;
    ativo: boolean;
    totalUsuarios: number;
    totalMesas: number;
    totalProdutos: number;
    totalPedidos: number;
    totalVendas: number;
    pedidosPendentes: number;
    pedidosPagos: number;
    mediaTicket: number;
    ultimaAtividade: string;
  }>;
}

export default function RelatoriosPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatorioData, setRelatorioData] = useState<RelatorioData>({
    totalVendas: 0,
    totalPedidos: 0,
    pedidosPendentes: 0,
    pedidosEntregues: 0,
    pedidosPagos: 0,
    mediaTicket: 0,
    topProdutos: [],
    vendasPorDia: [],
    estabelecimentosAtivos: 0,
    estabelecimentosInativos: 0,
    estabelecimentosDetalhados: []
  });

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (!userData) {
      router.push('/admin/login');
      return;
    }
    const user = JSON.parse(userData);
    setAdminUser(user);
    
    // Verificar se é sistema_admin
    if (user.tipo !== 'sistema_admin') {
      router.push('/admin/dashboard');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!adminUser || adminUser.tipo !== 'sistema_admin') return;
    fetchRelatorioData();
  }, [adminUser]);

  const fetchRelatorioData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar dados em paralelo
      const [
        vendasResult,
        pedidosResult,
        pedidosStatusResult,
        topProdutosResult,
        vendasPorDiaResult,
        estabelecimentosResult
      ] = await Promise.all([
        // Total de vendas (pedidos pagos)
        supabase
          .from('pedidos')
          .select('subtotal')
          .eq('status', 'pago'),
        
        // Total de pedidos
        supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true }),
        
        // Pedidos por status
        supabase
          .from('pedidos')
          .select('status'),
        
        // Top produtos
        supabase
          .from('pedidos')
          .select(`
            quantidade,
            subtotal,
            produtos:produto_id(nome)
          `)
          .eq('status', 'pago')
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Vendas por dia (últimos 7 dias)
        supabase
          .from('pedidos')
          .select('subtotal, created_at')
          .eq('status', 'pago')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Estabelecimentos
        supabase
          .from('bares')
          .select('ativo')
      ]);

      // Processar dados
      const vendas = vendasResult.data || [];
      const pedidos = pedidosStatusResult.data || [];
      const topProdutos = topProdutosResult.data || [];
      const vendasPorDia = vendasPorDiaResult.data || [];
      const estabelecimentos = estabelecimentosResult.data || [];

      // Calcular estatísticas
      const totalVendas = vendas.reduce((sum, v) => sum + (v.subtotal || 0), 0);
      const totalPedidos = pedidosResult.count || 0;
      const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length;
      const pedidosEntregues = pedidos.filter(p => p.status === 'entregue').length;
      const pedidosPagos = pedidos.filter(p => p.status === 'pago').length;
      const mediaTicket = totalVendas > 0 ? totalVendas / pedidosPagos : 0;

      // Processar top produtos
      const produtosMap = new Map();
      topProdutos.forEach((pedido: any) => {
        const nome = pedido.produtos?.nome || 'Produto Desconhecido';
        const quantidade = pedido.quantidade || 0;
        const total = pedido.subtotal || 0;
        
        if (produtosMap.has(nome)) {
          const existing = produtosMap.get(nome);
          produtosMap.set(nome, {
            nome,
            quantidade: existing.quantidade + quantidade,
            total: existing.total + total
          });
        } else {
          produtosMap.set(nome, { nome, quantidade, total });
        }
      });

      const topProdutosProcessados = Array.from(produtosMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Processar vendas por dia
      const vendasPorDiaMap = new Map();
      vendasPorDia.forEach(pedido => {
        const data = new Date(pedido.created_at).toLocaleDateString('pt-BR');
        const subtotal = pedido.subtotal || 0;
        
        if (vendasPorDiaMap.has(data)) {
          const existing = vendasPorDiaMap.get(data);
          vendasPorDiaMap.set(data, {
            data,
            vendas: existing.vendas + subtotal,
            pedidos: existing.pedidos + 1
          });
        } else {
          vendasPorDiaMap.set(data, {
            data,
            vendas: subtotal,
            pedidos: 1
          });
        }
      });

      const vendasPorDiaProcessadas = Array.from(vendasPorDiaMap.values())
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

      // Estabelecimentos
      const estabelecimentosAtivos = estabelecimentos.filter(e => e.ativo).length;
      const estabelecimentosInativos = estabelecimentos.filter(e => !e.ativo).length;

      // Buscar dados detalhados dos estabelecimentos
      const estabelecimentosDetalhados = await Promise.all(
        estabelecimentos.map(async (bar: any) => {
          // Buscar dados do estabelecimento
          const [
            usuariosResult,
            mesasResult,
            produtosResult,
            pedidosResult,
            vendasResult,
            pedidosPendentesResult,
            pedidosPagosResult
          ] = await Promise.all([
            supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('bar_id', bar.id),
            supabase.from('mesas').select('*', { count: 'exact', head: true }).eq('bar_id', bar.id),
            supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('bar_id', bar.id),
            supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('bar_id', bar.id),
            supabase.from('pedidos').select('subtotal').eq('bar_id', bar.id).eq('status', 'pago'),
            supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('bar_id', bar.id).eq('status', 'pendente'),
            supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('bar_id', bar.id).eq('status', 'pago')
          ]);

          const totalUsuarios = usuariosResult.count || 0;
          const totalMesas = mesasResult.count || 0;
          const totalProdutos = produtosResult.count || 0;
          const totalPedidos = pedidosResult.count || 0;
          const totalVendas = vendasResult.data?.reduce((sum, v) => sum + (v.subtotal || 0), 0) || 0;
          const pedidosPendentes = pedidosPendentesResult.count || 0;
          const pedidosPagos = pedidosPagosResult.count || 0;
          const mediaTicket = pedidosPagos > 0 ? totalVendas / pedidosPagos : 0;

          return {
            id: bar.id,
            nome: bar.nome,
            endereco: bar.endereco || '',
            telefone: bar.telefone || '',
            email: bar.email || '',
            ativo: bar.ativo,
            totalUsuarios,
            totalMesas,
            totalProdutos,
            totalPedidos,
            totalVendas,
            pedidosPendentes,
            pedidosPagos,
            mediaTicket,
            ultimaAtividade: bar.updated_at || bar.created_at
          };
        })
      );

      setRelatorioData({
        totalVendas,
        totalPedidos,
        pedidosPendentes,
        pedidosEntregues,
        pedidosPagos,
        mediaTicket,
        topProdutos: topProdutosProcessados,
        vendasPorDia: vendasPorDiaProcessadas,
        estabelecimentosAtivos,
        estabelecimentosInativos,
        estabelecimentosDetalhados
      });

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/admin/sistema');
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (!adminUser || adminUser.tipo !== 'sistema_admin') {
    return <div className="text-center p-4">Acesso negado. Apenas administradores do sistema podem acessar esta página.</div>;
  }

  return (
    <AdminLayout
      title="Relatórios do Sistema"
      subtitle="Relatórios e análises do sistema"
      actions={
        <div className="flex gap-2">
          <AdminButton
            variant="secondary"
            onClick={handleBack}
            title="Voltar ao dashboard do sistema"
          >
            Voltar
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={fetchRelatorioData}
            disabled={loading}
            title="Atualizar relatórios"
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </AdminButton>
        </div>
      }
    >
      {error && (
        <AdminCard>
          <div className="text-red-600 text-center">{error}</div>
        </AdminCard>
      )}

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatarMoeda(relatorioData.totalVendas)}
            </div>
            <div className="text-sm text-gray-600">Total de Vendas</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {relatorioData.totalPedidos}
            </div>
            <div className="text-sm text-gray-600">Total de Pedidos</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {formatarMoeda(relatorioData.mediaTicket)}
            </div>
            <div className="text-sm text-gray-600">Ticket Médio</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {relatorioData.estabelecimentosAtivos}
            </div>
            <div className="text-sm text-gray-600">Estabelecimentos Ativos</div>
          </div>
        </AdminCard>
      </div>

      {/* Status dos Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AdminCard>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {relatorioData.pedidosPendentes}
            </div>
            <div className="text-sm text-gray-600">Pedidos Pendentes</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {relatorioData.pedidosEntregues}
            </div>
            <div className="text-sm text-gray-600">Pedidos Entregues</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {relatorioData.pedidosPagos}
            </div>
            <div className="text-sm text-gray-600">Pedidos Pagos</div>
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Produtos */}
        <AdminCard title="Top 5 Produtos Mais Vendidos">
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : relatorioData.topProdutos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum produto vendido ainda
            </div>
          ) : (
            <div className="space-y-3">
              {relatorioData.topProdutos.map((produto, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{produto.nome}</div>
                    <div className="text-sm text-gray-600">
                      {produto.quantidade} unidades
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatarMoeda(produto.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        {/* Vendas por Dia */}
        <AdminCard title="Vendas dos Últimos 7 Dias">
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : relatorioData.vendasPorDia.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma venda registrada
            </div>
          ) : (
            <div className="space-y-3">
              {relatorioData.vendasPorDia.map((venda, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{venda.data}</div>
                    <div className="text-sm text-gray-600">
                      {venda.pedidos} pedidos
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      {formatarMoeda(venda.vendas)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      {/* Estabelecimentos */}
      <AdminCard title="Status dos Estabelecimentos" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {relatorioData.estabelecimentosAtivos}
            </div>
            <div className="text-sm text-gray-600">Estabelecimentos Ativos</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {relatorioData.estabelecimentosInativos}
            </div>
            <div className="text-sm text-gray-600">Estabelecimentos Inativos</div>
          </div>
        </div>
      </AdminCard>

      {/* Relatório Detalhado dos Estabelecimentos */}
      <AdminCard title="Relatório Detalhado dos Estabelecimentos" className="mt-6">
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : relatorioData.estabelecimentosDetalhados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum estabelecimento cadastrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estabelecimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuários
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {relatorioData.estabelecimentosDetalhados.map((estabelecimento) => (
                  <tr key={estabelecimento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {estabelecimento.nome}
                        </div>
                        <div className="text-sm text-gray-500">
                          {estabelecimento.endereco || 'Endereço não informado'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {estabelecimento.telefone || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {estabelecimento.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estabelecimento.totalUsuarios}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estabelecimento.totalMesas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estabelecimento.totalProdutos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Total: {estabelecimento.totalPedidos}
                      </div>
                      <div className="text-sm text-gray-500">
                        Pendentes: {estabelecimento.pedidosPendentes} | Pagos: {estabelecimento.pedidosPagos}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatarMoeda(estabelecimento.totalVendas)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Ticket: {formatarMoeda(estabelecimento.mediaTicket)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        estabelecimento.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {estabelecimento.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
} 