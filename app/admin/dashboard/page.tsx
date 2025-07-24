'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Mesa, Pedido, Produto } from '../../../lib/types';
import AdminLayout, { AdminCard, AdminButton } from '../../../components/AdminLayout';
import PagamentoMesaModal from '../../../components/PagamentoMesaModal';
import SelecionarMesaModal from '../../../components/SelecionarMesaModal';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    mesasAtivas: 0,
    pedidosPendentes: 0,
    vendasHoje: 0
  });
  const [pedidosRecentes, setPedidosRecentes] = useState<any[]>([]);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [mesaPagamento, setMesaPagamento] = useState<{id: string, numero: number} | null>(null);
  const [showSelecionarMesaModal, setShowSelecionarMesaModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (!userData) {
      router.push('/admin/login');
      return;
    }
    const user = JSON.parse(userData);
    setAdminUser(user);
    
    // Redirecionar sistema_admin para dashboard do sistema
    if (user.tipo === 'sistema_admin') {
      router.push('/admin/sistema');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!adminUser) return;
    fetchDashboardData();
  }, [adminUser]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Buscar todas as mesas do bar
      const { data: mesas, error: errMesas } = await supabase
        .from('mesas')
        .select('id')
        .eq('bar_id', adminUser.bar_id);
      
      if (errMesas) throw errMesas;
      
      if (!mesas || mesas.length === 0) {
        setStats({ mesasAtivas: 0, pedidosPendentes: 0, vendasHoje: 0 });
        setPedidosRecentes([]);
        return;
      }

      const mesaIds = mesas.map(m => m.id);
      
      // 2. Buscar comandas abertas das mesas do bar
      const { data: comandasAbertas, error: errComandas } = await supabase
        .from('comandas')
        .select('id')
        .in('mesa_id', mesaIds)
        .eq('status', 'aberta');
      
      if (errComandas) throw errComandas;
      
      const comandaIds = comandasAbertas?.map(c => c.id) || [];
      
      // 3. Buscar pedidos pendentes
      const { data: pedidosPendentes, error: errPedidos } = await supabase
        .from('pedidos')
        .select('*')
        .in('comanda_id', comandaIds)
        .eq('status', 'pendente');
      
      // 4. Buscar vendas de hoje (pedidos pagos)
      const hoje = new Date().toISOString().split('T')[0];
      const { data: vendasHoje, error: errVendas } = await supabase
        .from('pedidos')
        .select('subtotal')
        .in('comanda_id', comandaIds)
        .eq('status', 'pago')
        .gte('created_at', hoje);

      // 5. Buscar pedidos recentes
      const { data: pedidosRecentes, error: errRecentes } = await supabase
        .from('pedidos')
        .select(`
          *,
          produtos:produto_id(nome, preco),
          comandas:comanda_id(
            mesa_id,
            clientes:cliente_id(nome, telefone),
            mesas:mesa_id(numero)
          )
        `)
        .in('comanda_id', comandaIds)
        .order('created_at', { ascending: false })
        .limit(5);

      if (errMesas || errPedidos || errVendas || errRecentes) {
        throw new Error('Erro ao carregar dados do dashboard');
      }

      setStats({
        mesasAtivas: comandasAbertas?.length || 0,
        pedidosPendentes: pedidosPendentes?.length || 0,
        vendasHoje: vendasHoje?.reduce((total, pedido) => total + (pedido.subtotal || 0), 0) || 0
      });

      setPedidosRecentes(pedidosRecentes || []);
    } catch (error: any) {
      console.error('Erro no dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const handlePagamentoMesa = (mesaId: string, mesaNumero: number) => {
    setMesaPagamento({ id: mesaId, numero: mesaNumero });
    setShowPagamentoModal(true);
  };

  const handlePagamentoSuccess = () => {
    fetchDashboardData();
  };

  const handleMesaSelecionada = (mesa: { id: string; numero: number }) => {
    setMesaPagamento(mesa);
    setShowPagamentoModal(true);
  };

  if (!adminUser) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <AdminLayout
      title="Dashboard Administrativo"
      subtitle={`Bem-vindo, ${adminUser.nome}`}
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
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.mesasAtivas}</div>
            <div className="text-sm text-gray-600">Mesas Ativas</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.pedidosPendentes}</div>
            <div className="text-sm text-gray-600">Pedidos Pendentes</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              R$ {stats.vendasHoje.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total de Vendas Hoje</div>
          </div>
        </AdminCard>
      </div>

      {/* Cards de Ação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {/* GRUPO 1: OPERAÇÕES PRINCIPAIS (AZUL) */}
        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">💰 Pagar Mesa</h3>
            <p className="text-sm text-gray-600 mb-4">Escolher mesa e realizar pagamento</p>
            <AdminButton
              variant="success"
              onClick={() => setShowSelecionarMesaModal(true)}
              title="Abrir modal para selecionar mesa e pagar"
            >
              Pagar Mesa
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">🍽️ Cozinha</h3>
            <p className="text-sm text-gray-600 mb-4">Pedidos para preparação</p>
            <AdminButton
              variant="warning"
              onClick={() => router.push('/admin/cozinha')}
              title="Acessar painel da cozinha"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">📋 Ver Pedidos</h3>
            <p className="text-sm text-gray-600 mb-4">Visualizar e gerenciar pedidos</p>
            <AdminButton
              variant="primary"
              onClick={() => router.push('/admin/pedidos')}
              title="Acessar gerenciamento de pedidos"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">🚚 Delivery</h3>
            <p className="text-sm text-gray-600 mb-4">Gerenciar pedidos de delivery</p>
            <AdminButton
              variant="success"
              onClick={() => router.push('/admin/delivery')}
              title="Acessar gerenciamento de delivery"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>

        {/* GRUPO 2: CONFIGURAÇÕES DE PRODUTOS (AZUL) */}
        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">🍦 Gerenciar Produtos</h3>
            <p className="text-sm text-gray-600 mb-4">Adicionar, editar e remover produtos</p>
            <AdminButton
              variant="primary"
              onClick={() => router.push('/admin/produtos')}
              title="Acessar gerenciamento de produtos"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">🏷️ Categorias</h3>
            <p className="text-sm text-gray-600 mb-4">Organizar produtos por categorias</p>
            <AdminButton
              variant="primary"
              onClick={() => router.push('/admin/categorias')}
              title="Acessar gerenciamento de categorias"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">🍨 Sabores</h3>
            <p className="text-sm text-gray-600 mb-4">Definir sabores disponíveis</p>
            <AdminButton
              variant="primary"
              onClick={() => router.push('/admin/sabores')}
              title="Acessar gerenciamento de sabores"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>

        {/* GRUPO 3: CONFIGURAÇÕES DO SISTEMA (AZUL) */}
        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">🪑 Gerenciar Mesas</h3>
            <p className="text-sm text-gray-600 mb-4">Configurar mesas e QR Codes</p>
            <AdminButton
              variant="primary"
              onClick={() => router.push('/admin/mesas')}
              title="Acessar gerenciamento de mesas"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">👥 Usuários</h3>
            <p className="text-sm text-gray-600 mb-4">Gerenciar garçons e admins</p>
            <AdminButton
              variant="primary"
              onClick={() => router.push('/admin/usuarios')}
              title="Acessar gerenciamento de usuários"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">👤 Clientes</h3>
            <p className="text-sm text-gray-600 mb-4">Visualizar histórico de clientes</p>
            <AdminButton
              variant="primary"
              onClick={() => router.push('/admin/clientes')}
              title="Acessar visualização de clientes"
            >
              Acessar
            </AdminButton>
          </div>
        </AdminCard>
      </div>

      {/* Pedidos Recentes */}
      <AdminCard title="Pedidos Recentes">
        {loading ? (
          <div className="text-center">Carregando pedidos...</div>
        ) : pedidosRecentes.length === 0 ? (
          <div className="text-center text-gray-600">Nenhum pedido recente</div>
        ) : (
          <div className="space-y-4">
            {pedidosRecentes.map((pedido) => (
              <div key={pedido.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{pedido.produtos?.nome}</div>
                  <div className="text-sm text-gray-600">
                    Cliente: {pedido.comandas?.clientes?.nome || pedido.comandas?.clientes?.telefone || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Mesa: {pedido.comandas?.mesas?.numero || 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">R$ {pedido.subtotal?.toFixed(2)}</div>
                  <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                    pedido.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                    pedido.status === 'entregue' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {pedido.status}
                  </div>
                  {pedido.status !== 'pago' && (
                    <AdminButton
                      variant="success"
                      size="sm"
                      onClick={() => handlePagamentoMesa(
                        pedido.comandas?.mesas?.id || pedido.comandas?.mesa_id,
                        pedido.comandas?.mesas?.numero || 0
                      )}
                      title="Pagar mesa"
                      className="mt-2"
                    >
                      💰 Pagar Mesa
                    </AdminButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Modal de Pagamento */}
      {showPagamentoModal && mesaPagamento && (
        <PagamentoMesaModal
          mesaId={mesaPagamento.id}
          mesaNumero={mesaPagamento.numero}
          isOpen={showPagamentoModal}
          onClose={() => {
            setShowPagamentoModal(false);
            setMesaPagamento(null);
          }}
          onSuccess={handlePagamentoSuccess}
          adminUserId={adminUser.id}
        />
      )}

      {/* Modal de Seleção de Mesa */}
      {showSelecionarMesaModal && (
        <SelecionarMesaModal
          isOpen={showSelecionarMesaModal}
          onClose={() => setShowSelecionarMesaModal(false)}
          onMesaSelecionada={handleMesaSelecionada}
          adminUserId={adminUser.id}
          barId={adminUser.bar_id}
        />
      )}
    </AdminLayout>
  );
} 