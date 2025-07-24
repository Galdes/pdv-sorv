'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Cliente } from '../../../lib/types';
import AdminLayout, { 
  AdminCard, 
  AdminButton,
  AdminInput,
  AdminTable, 
  AdminTableHeader, 
  AdminTableHeaderCell, 
  AdminTableBody, 
  AdminTableCell 
} from '../../../components/AdminLayout';

interface ClienteComStats extends Cliente {
  total_comandas?: number;
  total_pedidos?: number;
  total_delivery?: number;
  valor_total_gasto?: number;
  ultima_visita?: string;
  tipo: 'comanda' | 'delivery';
  produtos_mais_consumidos?: Array<{
    nome: string;
    quantidade: number;
    valor_total: number;
  }>;
  // Dados adicionais para clientes de delivery
  endereco?: {
    id: string;
    nome_destinatario: string;
    telefone: string;
    cep?: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    referencia?: string;
  };
}

export default function AdminClientesPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [clientes, setClientes] = useState<ClienteComStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroTelefone, setFiltroTelefone] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'comanda' | 'delivery'>('todos');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteComStats | null>(null);
  const [editForm, setEditForm] = useState({
    nome: '',
    telefone: '',
    // Dados de endereço para delivery
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    referencia: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteComStats | null>(null);

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
    fetchClientes();
  }, [adminUser, filtroNome, filtroTelefone, filtroTipo]);

  const fetchClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Buscar clientes de comandas
      let queryComandas = supabase
        .from('clientes')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .order('created_at', { ascending: false });

      if (filtroNome) {
        queryComandas = queryComandas.ilike('nome', `%${filtroNome}%`);
      }
      if (filtroTelefone) {
        queryComandas = queryComandas.ilike('telefone', `%${filtroTelefone}%`);
      }

      const { data: clientesComandas, error: errComandas } = await queryComandas;

      // 2. Buscar clientes de delivery - CORRIGIDO
      let queryDelivery = supabase
        .from('enderecos_entrega')
        .select(`
          *,
          pedidos_externos!inner(
            bar_id
          )
        `)
        .eq('pedidos_externos.bar_id', adminUser.bar_id);

      if (filtroNome) {
        queryDelivery = queryDelivery.ilike('nome_destinatario', `%${filtroNome}%`);
      }
      if (filtroTelefone) {
        queryDelivery = queryDelivery.ilike('telefone', `%${filtroTelefone}%`);
      }

      const { data: enderecosDelivery, error: errDelivery } = await queryDelivery;

      // Processar clientes de comandas
      const clientesComandasProcessados = await Promise.all(
        (clientesComandas || []).map(async (cliente) => {
          const stats = await getClienteStats(cliente.id, 'comanda');
          return {
            ...cliente,
            ...stats,
            tipo: 'comanda' as const
          };
        })
      );

      // Processar clientes de delivery (agrupar por telefone)
      const clientesDeliveryMap = new Map<string, ClienteComStats>();
      
      if (enderecosDelivery) {
        for (const endereco of enderecosDelivery) {
          const telefone = endereco.telefone;
          
          if (!clientesDeliveryMap.has(telefone)) {
            const stats = await getClienteStats(endereco.id, 'delivery');
            clientesDeliveryMap.set(telefone, {
              id: endereco.id,
              bar_id: adminUser.bar_id,
              nome: endereco.nome_destinatario,
              telefone: endereco.telefone,
              created_at: endereco.created_at,
              updated_at: endereco.updated_at || endereco.created_at,
              ...stats,
              tipo: 'delivery' as const,
              endereco: {
                id: endereco.id,
                nome_destinatario: endereco.nome_destinatario,
                telefone: endereco.telefone,
                cep: endereco.cep,
                logradouro: endereco.logradouro,
                numero: endereco.numero,
                complemento: endereco.complemento,
                bairro: endereco.bairro,
                cidade: endereco.cidade,
                estado: endereco.estado,
                referencia: endereco.referencia
              }
            });
          }
        }
      }

      const clientesDeliveryProcessados = Array.from(clientesDeliveryMap.values());

      // Combinar e filtrar por tipo
      let todosClientes = [...clientesComandasProcessados, ...clientesDeliveryProcessados];
      
      if (filtroTipo !== 'todos') {
        todosClientes = todosClientes.filter(cliente => cliente.tipo === filtroTipo);
      }

      // Ordenar por valor total gasto (maior primeiro)
      todosClientes.sort((a, b) => (b.valor_total_gasto || 0) - (a.valor_total_gasto || 0));

      setClientes(todosClientes);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar clientes');
    } finally {
      setLoading(false);
    }
  };

  const getClienteStats = async (clienteId: string, tipo: 'comanda' | 'delivery') => {
    if (tipo === 'comanda') {
      // Estatísticas para clientes de comandas
      const { data: comandas } = await supabase
        .from('comandas')
        .select('id, created_at')
        .eq('cliente_id', clienteId);

      const comandaIds = comandas?.map(c => c.id) || [];
      let totalPedidos = 0;
      let valorTotal = 0;
      let produtosConsumidos = new Map<string, { quantidade: number, valor_total: number }>();

      if (comandaIds.length > 0) {
        const { data: pedidos } = await supabase
          .from('pedidos')
          .select(`
            quantidade,
            subtotal,
            produtos:produto_id(nome)
          `)
          .in('comanda_id', comandaIds);

        if (pedidos) {
          totalPedidos = pedidos.length;
          valorTotal = pedidos.reduce((sum, p) => sum + (p.subtotal || 0), 0);
          
          // Agrupar produtos mais consumidos
          pedidos.forEach(pedido => {
            const nomeProduto = (pedido.produtos as any)?.nome || 'Produto desconhecido';
            const existing = produtosConsumidos.get(nomeProduto);
            if (existing) {
              existing.quantidade += pedido.quantidade;
              existing.valor_total += pedido.subtotal || 0;
            } else {
              produtosConsumidos.set(nomeProduto, {
                quantidade: pedido.quantidade,
                valor_total: pedido.subtotal || 0
              });
            }
          });
        }
      }

      const ultimaComanda = comandas?.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        total_comandas: comandas?.length || 0,
        total_pedidos: totalPedidos,
        total_delivery: 0,
        valor_total_gasto: valorTotal,
        ultima_visita: ultimaComanda?.created_at,
        produtos_mais_consumidos: Array.from(produtosConsumidos.entries())
          .map(([nome, stats]) => ({ nome, ...stats }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5)
      };
    } else {
      // Estatísticas para clientes de delivery - CORRIGIDO
      const { data: pedidosDelivery } = await supabase
        .from('pedidos_externos')
        .select(`
          valor_total,
          created_at,
          itens_pedido_externo(
            quantidade,
            produtos(nome, preco)
          )
        `)
        .eq('bar_id', adminUser.bar_id)
        .eq('endereco_id', clienteId);

      let totalDelivery = 0;
      let valorTotal = 0;
      let produtosConsumidos = new Map<string, { quantidade: number, valor_total: number }>();

      if (pedidosDelivery) {
        totalDelivery = pedidosDelivery.length;
        valorTotal = pedidosDelivery.reduce((sum, p) => sum + (p.valor_total || 0), 0);
        
        // Agrupar produtos mais consumidos
        pedidosDelivery.forEach(pedido => {
          pedido.itens_pedido_externo?.forEach(item => {
            const nomeProduto = (item.produtos as any)?.nome || 'Produto desconhecido';
            const precoProduto = (item.produtos as any)?.preco || 0;
            const existing = produtosConsumidos.get(nomeProduto);
            if (existing) {
              existing.quantidade += item.quantidade;
              existing.valor_total += precoProduto * item.quantidade;
            } else {
              produtosConsumidos.set(nomeProduto, {
                quantidade: item.quantidade,
                valor_total: precoProduto * item.quantidade
              });
            }
          });
        });
      }

      return {
        total_comandas: 0,
        total_pedidos: 0,
        total_delivery: totalDelivery,
        valor_total_gasto: valorTotal,
        ultima_visita: pedidosDelivery?.[0]?.created_at,
        produtos_mais_consumidos: Array.from(produtosConsumidos.entries())
          .map(([nome, stats]) => ({ nome, ...stats }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5)
      };
    }
  };

  const handleEdit = (cliente: ClienteComStats) => {
    setEditingCliente(cliente);
    setEditForm({
      nome: cliente.nome || '',
      telefone: cliente.telefone,
      // Dados de endereço para delivery
      cep: cliente.endereco?.cep || '',
      logradouro: cliente.endereco?.logradouro || '',
      numero: cliente.endereco?.numero || '',
      complemento: cliente.endereco?.complemento || '',
      bairro: cliente.endereco?.bairro || '',
      cidade: cliente.endereco?.cidade || '',
      estado: cliente.endereco?.estado || '',
      referencia: cliente.endereco?.referencia || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCliente) return;
    
    setLoading(true);
    try {
      if (editingCliente.tipo === 'comanda') {
        // Atualizar cliente de comanda
        const { error } = await supabase
          .from('clientes')
          .update({
            nome: editForm.nome,
            telefone: editForm.telefone
          })
          .eq('id', editingCliente.id);
        
        if (error) throw error;
      } else {
        // Atualizar cliente de delivery com todos os dados
        const { error } = await supabase
          .from('enderecos_entrega')
          .update({
            nome_destinatario: editForm.nome,
            telefone: editForm.telefone,
            cep: editForm.cep,
            logradouro: editForm.logradouro,
            numero: editForm.numero,
            complemento: editForm.complemento,
            bairro: editForm.bairro,
            cidade: editForm.cidade,
            estado: editForm.estado,
            referencia: editForm.referencia
          })
          .eq('id', editingCliente.id);
        
        if (error) throw error;
      }
      
      setShowEditModal(false);
      setEditingCliente(null);
      fetchClientes();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cliente: ClienteComStats) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome || cliente.telefone}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      if (cliente.tipo === 'comanda') {
        // Verificar se tem comandas ativas
        const { data: comandasAtivas } = await supabase
          .from('comandas')
          .select('id')
          .eq('cliente_id', cliente.id)
          .eq('status', 'aberta');
        
        if (comandasAtivas && comandasAtivas.length > 0) {
          setError('Não é possível excluir cliente com comandas ativas');
          return;
        }
        
        const { error } = await supabase
          .from('clientes')
          .delete()
          .eq('id', cliente.id);
        
        if (error) throw error;
      } else {
        // Para delivery, apenas marcar como inativo
        const { error } = await supabase
          .from('enderecos_entrega')
          .update({ ativo: false })
          .eq('id', cliente.id);
        
        if (error) throw error;
      }
      
      fetchClientes();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (cliente: ClienteComStats) => {
    setSelectedCliente(cliente);
    setShowDetailsModal(true);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarTelefone = (telefone: string) => {
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return telefone;
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarEndereco = (cliente: ClienteComStats) => {
    if (cliente.tipo === 'delivery' && cliente.endereco) {
      const end = cliente.endereco;
      return `${end.logradouro}, ${end.numero}${end.complemento ? ` - ${end.complemento}` : ''}, ${end.bairro}, ${end.cidade} - ${end.estado}`;
    }
    return 'N/A';
  };

  const clientesFiltrados = clientes.filter(cliente => {
    const nomeMatch = !filtroNome || 
      (cliente.nome && cliente.nome.toLowerCase().includes(filtroNome.toLowerCase()));
    const telefoneMatch = !filtroTelefone || 
      cliente.telefone.includes(filtroTelefone);
    return nomeMatch && telefoneMatch;
  });

  if (!adminUser) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <AdminLayout
      title="Clientes"
      subtitle="Visualizar histórico de clientes do estabelecimento"
      onBack={() => router.push('/admin/dashboard')}
    >
      {/* Filtros */}
      <AdminCard title="Filtros" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">
              Buscar por Nome
            </label>
            <input
              type="text"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              placeholder="Digite o nome do cliente..."
              className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">
              Buscar por Telefone
            </label>
            <input
              type="text"
              value={filtroTelefone}
              onChange={(e) => setFiltroTelefone(e.target.value)}
              placeholder="Digite o telefone..."
              className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">
              Tipo de Cliente
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-700 border-gray-600 text-white"
            >
              <option value="todos">Todos os Clientes</option>
              <option value="comanda">Clientes de Comanda</option>
              <option value="delivery">Clientes de Delivery</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          <p>🔍 Filtros aplicados em tempo real</p>
        </div>
      </AdminCard>

      {/* Lista de Clientes */}
      <AdminCard title={`Clientes (${clientesFiltrados.length})`}>
        {loading ? (
          <div className="text-center">Carregando clientes...</div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-300">
            {filtroNome || filtroTelefone || filtroTipo !== 'todos'
              ? 'Nenhum cliente encontrado com os filtros aplicados' 
              : 'Nenhum cliente cadastrado no sistema'
            }
          </div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell>Cliente</AdminTableHeaderCell>
              <AdminTableHeaderCell>Telefone</AdminTableHeaderCell>
              <AdminTableHeaderCell>Tipo</AdminTableHeaderCell>
              <AdminTableHeaderCell>Endereço</AdminTableHeaderCell>
              <AdminTableHeaderCell>Estatísticas</AdminTableHeaderCell>
              <AdminTableHeaderCell>Valor Total</AdminTableHeaderCell>
              <AdminTableHeaderCell>Última Visita</AdminTableHeaderCell>
              <AdminTableHeaderCell>Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {clientesFiltrados.map((cliente) => (
                <tr key={`${cliente.tipo}-${cliente.id}`} className="border-b border-gray-200 dark:border-gray-700">
                  <AdminTableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {cliente.nome || 'Sem nome'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {cliente.id.slice(-8)}
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatarTelefone(cliente.telefone)}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      cliente.tipo === 'comanda' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {cliente.tipo === 'comanda' ? '🍽️ Comanda' : '🚚 Delivery'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {formatarEndereco(cliente)}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-y-1">
                      {cliente.tipo === 'comanda' ? (
                        <>
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Comandas:</span>
                            <span className="ml-1 font-semibold text-blue-600 dark:text-blue-400">
                              {cliente.total_comandas || 0}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Pedidos:</span>
                            <span className="ml-1 font-semibold text-green-600 dark:text-green-400">
                              {cliente.total_pedidos || 0}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Deliveries:</span>
                            <span className="ml-1 font-semibold text-purple-600 dark:text-purple-400">
                              {cliente.total_delivery || 0}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatarValor(cliente.valor_total_gasto || 0)}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {cliente.ultima_visita 
                        ? formatarData(cliente.ultima_visita)
                        : 'Nunca visitou'
                      }
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-x-2">
                      <AdminButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewDetails(cliente)}
                        title="Ver detalhes do cliente"
                      >
                        👁️
                      </AdminButton>
                      <AdminButton
                        variant="warning"
                        size="sm"
                        onClick={() => handleEdit(cliente)}
                        title="Editar dados do cliente"
                      >
                        ✏️
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(cliente)}
                        title="Excluir cliente"
                      >
                        🗑️
                      </AdminButton>
                    </div>
                  </AdminTableCell>
                </tr>
              ))}
            </AdminTableBody>
          </AdminTable>
        )}
      </AdminCard>

      {/* Modal de Edição Completo */}
      {showEditModal && editingCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Editar Cliente - {editingCliente.tipo === 'comanda' ? 'Comanda' : 'Delivery'}
            </h3>
            <div className="space-y-4">
              {/* Dados Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    className="block w-full border rounded-lg px-3 py-2 bg-gray-700 border-gray-600 text-white"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    value={editForm.telefone}
                    onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                    className="block w-full border rounded-lg px-3 py-2 bg-gray-700 border-gray-600 text-white"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* Dados de Endereço (apenas para delivery) */}
              {editingCliente.tipo === 'delivery' && (
                <>
                  <div className="border-t border-gray-600 pt-4">
                    <h4 className="text-md font-semibold mb-3 text-white">📍 Dados de Endereço</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-200">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={editForm.cep}
                        onChange={(e) => setEditForm({ ...editForm, cep: e.target.value })}
                        className="block w-full border rounded-lg px-3 py-2 bg-gray-700 border-gray-600 text-white"
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-200">
                        Logradouro *
                      </label>
                      <input
                        type="text"
                        value={editForm.logradouro}
                        onChange={(e) => setEditForm({ ...editForm, logradouro: e.target.value })}
                        className="block w-full border rounded-lg px-3 py-2 bg-gray-700 border-gray-600 text-white"
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-200">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={editForm.numero}
                        onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })}
                        className="block w-full border rounded-lg px-3 py-2 bg-gray-700 border-gray-600 text-white"
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-200">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={editForm.complemento}
                        onChange={(e) => setEditForm({ ...editForm, complemento: e.target.value })}
                        className="block w-full border rounded-lg px-3 py-2 bg-gray-700 border-gray-600 text-white"
                        placeholder="Apto, Casa, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-200">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={editForm.bairro}
                        onChange={(e) => setEditForm({ ...editForm, bairro: e.target.value })}
                        className="block w-full border rounded-lg px-3 py-2 bg-gray-700 border-gray-600 text-white"
                        placeholder="Centro"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-200">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={editForm.cidade}
                        onChange={(e) => setEditForm({ ...editForm, cidade: e.target.value })}
                        className="block w-full border rounded-lg px-3 py-2 bg-gray-700 border-gray-600 text-white"
                        placeholder="São Paulo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-200">
                        Estado *
                      </label>
                      <input
                        type="text"
                        value={editForm.estado}
                        onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                        className="block w-full border rounded-lg px-3 py-2 bg-gray-700 border-gray-600 text-white"
                        placeholder="SP"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-200">
                      Referência
                    </label>
                    <input
                      type="text"
                      value={editForm.referencia}
                      onChange={(e) => setEditForm({ ...editForm, referencia: e.target.value })}
                      className="block w-full border rounded-lg px-3 py-2 bg-gray-700 border-gray-600 text-white"
                      placeholder="Próximo ao shopping, etc."
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex space-x-2 mt-6">
              <AdminButton
                variant="primary"
                onClick={handleSaveEdit}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </AdminButton>
              <AdminButton
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCliente(null);
                }}
              >
                Cancelar
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Detalhes do Cliente
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Nome</label>
                  <p className="text-white">{selectedCliente.nome || 'Sem nome'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Telefone</label>
                  <p className="text-white">{formatarTelefone(selectedCliente.telefone)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Tipo</label>
                  <p className="text-white">{selectedCliente.tipo === 'comanda' ? 'Comanda' : 'Delivery'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Valor Total Gasto</label>
                  <p className="text-green-400 font-semibold">{formatarValor(selectedCliente.valor_total_gasto || 0)}</p>
                </div>
              </div>

              {/* Endereço para clientes de delivery */}
              {selectedCliente.tipo === 'delivery' && selectedCliente.endereco && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Endereço Completo</label>
                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-white">
                      {selectedCliente.endereco.logradouro}, {selectedCliente.endereco.numero}
                      {selectedCliente.endereco.complemento && ` - ${selectedCliente.endereco.complemento}`}
                    </p>
                    <p className="text-white">
                      {selectedCliente.endereco.bairro}, {selectedCliente.endereco.cidade} - {selectedCliente.endereco.estado}
                    </p>
                    {selectedCliente.endereco.cep && (
                      <p className="text-gray-300">CEP: {selectedCliente.endereco.cep}</p>
                    )}
                    {selectedCliente.endereco.referencia && (
                      <p className="text-gray-300">Referência: {selectedCliente.endereco.referencia}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Produtos Mais Consumidos</label>
                {selectedCliente.produtos_mais_consumidos && selectedCliente.produtos_mais_consumidos.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCliente.produtos_mais_consumidos.map((produto, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                        <span className="text-white">{produto.nome}</span>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">{produto.quantidade}x</div>
                          <div className="text-sm text-green-400">{formatarValor(produto.valor_total)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">Nenhum produto consumido ainda</p>
                )}
              </div>
            </div>
            <div className="mt-6">
              <AdminButton
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Fechar
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg z-50">
          {error}
        </div>
      )}
    </AdminLayout>
  );
} 