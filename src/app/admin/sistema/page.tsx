'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import AdminLayout, { AdminCard, AdminButton } from '../../../../components/AdminLayout';

interface SistemaStats {
  totalBares: number;
  totalUsuarios: number;
  totalMesas: number;
  totalProdutos: number;
  totalPedidos: number;
  pedidosPendentes: number;
  vendasHoje: number;
}

export default function SistemaAdminPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SistemaStats>({
    totalBares: 0,
    totalUsuarios: 0,
    totalMesas: 0,
    totalProdutos: 0,
    totalPedidos: 0,
    pedidosPendentes: 0,
    vendasHoje: 0
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
    fetchSistemaStats();
  }, [adminUser]);

  const fetchSistemaStats = async () => {
    setLoading(true);
    try {
      // Buscar estatísticas gerais do sistema
      const [
        { count: totalBares },
        { count: totalUsuarios },
        { count: totalMesas },
        { count: totalProdutos },
        { count: totalPedidos },
        { count: pedidosPendentes },
        { count: vendasHoje }
      ] = await Promise.all([
        supabase.from('bares').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('mesas').select('*', { count: 'exact', head: true }),
        supabase.from('produtos').select('*', { count: 'exact', head: true }),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('status', 'pago').gte('created_at', new Date().toISOString().split('T')[0])
      ]);

      setStats({
        totalBares: totalBares || 0,
        totalUsuarios: totalUsuarios || 0,
        totalMesas: totalMesas || 0,
        totalProdutos: totalProdutos || 0,
        totalPedidos: totalPedidos || 0,
        pedidosPendentes: pedidosPendentes || 0,
        vendasHoje: vendasHoje || 0
      });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  if (!adminUser || adminUser.tipo !== 'sistema_admin') {
    return <div className="text-center p-4">Acesso negado. Apenas administradores do sistema podem acessar esta página.</div>;
  }

  return (
    <AdminLayout
      title="Dashboard do Sistema"
      subtitle="Visão geral de todos os estabelecimentos"
      actions={
        <AdminButton
          variant="danger"
          onClick={handleLogout}
          title="Sair do sistema administrativo"
        >
          Sair
        </AdminButton>
      }
    >
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalBares}</div>
            <div className="text-sm text-gray-600">Estabelecimentos</div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalUsuarios}</div>
            <div className="text-sm text-gray-600">Usuários Ativos</div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalMesas}</div>
            <div className="text-sm text-gray-600">Mesas Cadastradas</div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.totalProdutos}</div>
            <div className="text-sm text-gray-600">Produtos no Sistema</div>
          </div>
        </AdminCard>
      </div>

      {/* Estatísticas de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{stats.totalPedidos}</div>
            <div className="text-sm text-gray-600">Total de Pedidos</div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.pedidosPendentes}</div>
            <div className="text-sm text-gray-600">Pedidos Pendentes</div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{stats.vendasHoje}</div>
            <div className="text-sm text-gray-600">Vendas Hoje</div>
          </div>
        </AdminCard>
      </div>

      {/* Ações do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Gerenciar Estabelecimentos</h3>
            <p className="text-sm text-gray-600 mb-4">Visualizar e gerenciar todos os bares</p>
            <AdminButton
              variant="primary"
              onClick={() => router.push('/admin/sistema/estabelecimentos')}
              title="Gerenciar estabelecimentos"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Usuários do Sistema</h3>
            <p className="text-sm text-gray-600 mb-4">Gerenciar todos os usuários</p>
            <AdminButton
              variant="primary"
              onClick={() => router.push('/admin/sistema/usuarios')}
              title="Gerenciar usuários do sistema"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Relatórios</h3>
            <p className="text-sm text-gray-600 mb-4">Relatórios e análises do sistema</p>
            <AdminButton
              variant="primary"
              onClick={() => router.push('/admin/sistema/relatorios')}
              title="Visualizar relatórios"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>
      </div>

      {/* Informações do Sistema */}
      <AdminCard title="Informações do Sistema" className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Versão do Sistema</h4>
            <p className="text-sm text-gray-600">PDV v1.0.0</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Última Atualização</h4>
            <p className="text-sm text-gray-600">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Status</h4>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Sistema Online
            </span>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Administrador</h4>
            <p className="text-sm text-gray-600">{adminUser.nome}</p>
          </div>
        </div>
      </AdminCard>
    </AdminLayout>
  );
} 