'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Pedido, Produto, Mesa, Cliente } from '../../../lib/types';
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
import PagamentoMesaModal from '../../../components/PagamentoMesaModal';
import SelecionarMesaModal from '../../../components/SelecionarMesaModal';

interface PedidoCompleto extends Pedido {
  produtos: Produto;
  clientes: Cliente;
  mesas: Mesa;
}

export default function AdminPedidosPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    status: '',
    mesa: '',
    data: ''
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const pedidosPorPagina = 30;
  const [showFormPedido, setShowFormPedido] = useState(false);
  const [mesas, setMesas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [formPedido, setFormPedido] = useState({
    mesa_id: '',
    cliente_nome: '',
    cliente_telefone: '',
    produto_id: '',
    quantidade: 1,
    observacoes: ''
  });
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [mesaPagamento, setMesaPagamento] = useState<{id: string, numero: number} | null>(null);
  const [showSelecionarMesaModal, setShowSelecionarMesaModal] = useState(false);

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
    setPaginaAtual(1); // Reset para primeira página quando filtros mudam
    fetchPedidos();
  }, [adminUser, filtros]);

  useEffect(() => {
    if (!adminUser) return;
    fetchPedidos();
    fetchMesasEProdutos();
  }, [adminUser, paginaAtual]);

  const fetchMesasEProdutos = async () => {
    try {
      // Buscar mesas ativas
      const { data: mesasData, error: errMesas } = await supabase
        .from('mesas')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .eq('ativa', true)
        .order('numero');

      // Buscar produtos ativos
      const { data: produtosData, error: errProdutos } = await supabase
        .from('produtos')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .eq('ativo', true)
        .order('nome');

      if (errMesas || errProdutos) throw new Error('Erro ao buscar mesas ou produtos');
      
      setMesas(mesasData || []);
      setProdutos(produtosData || []);
    } catch (error: any) {
      console.error('Erro ao buscar mesas e produtos:', error);
    }
  };

  const fetchPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Primeiro buscar todas as mesas do bar
      const { data: mesas, error: errMesas } = await supabase
        .from('mesas')
        .select('id, numero')
        .eq('bar_id', adminUser.bar_id);
      
      if (errMesas) throw errMesas;
      
      if (!mesas || mesas.length === 0) {
        setPedidos([]);
        return;
      }

      const mesaIds = mesas.map(m => m.id);
      
      // 2. Buscar comandas das mesas do bar
      let queryComandas = supabase
        .from('comandas')
        .select('id, mesa_id')
        .in('mesa_id', mesaIds);
      
      // Filtrar por mesa se necessário
      if (filtros.mesa) {
        const mesaFiltrada = mesas.find(m => m.numero === parseInt(filtros.mesa));
        if (mesaFiltrada) {
          queryComandas = queryComandas.eq('mesa_id', mesaFiltrada.id);
        }
      }
      
      const { data: comandas, error: errComandas } = await queryComandas;
      if (errComandas) throw errComandas;
      
      if (!comandas || comandas.length === 0) {
        setPedidos([]);
        return;
      }

      const comandaIds = comandas.map(c => c.id);

      // Contar total de pedidos para paginação
      let countQuery = supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .in('comanda_id', comandaIds);

      // Aplicar filtros na contagem
      if (filtros.status) {
        countQuery = countQuery.eq('status', filtros.status);
      }
      if (filtros.data) {
        const dataInicio = new Date(filtros.data);
        const dataFim = new Date(filtros.data);
        dataFim.setDate(dataFim.getDate() + 1);
        countQuery = countQuery.gte('created_at', dataInicio.toISOString())
                               .lt('created_at', dataFim.toISOString());
      }

      const { count, error: errCount } = await countQuery;
      if (errCount) throw errCount;
      setTotalPedidos(count || 0);

      // Agora buscar pedidos com paginação
      const offset = (paginaAtual - 1) * pedidosPorPagina;
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
        .order('created_at', { ascending: false })
        .range(offset, offset + pedidosPorPagina - 1);

      // Aplicar filtros
      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }
      if (filtros.data) {
        const dataInicio = new Date(filtros.data);
        const dataFim = new Date(filtros.data);
        dataFim.setDate(dataFim.getDate() + 1);
        query = query.gte('created_at', dataInicio.toISOString())
                    .lt('created_at', dataFim.toISOString());
      }

      const { data: pedidos, error: errPedidos } = await query;
      if (errPedidos) throw errPedidos;
      
      // Transformar os dados para o formato esperado
      const pedidosFormatados = (pedidos || []).map(pedido => ({
        ...pedido,
        clientes: pedido.comandas?.clientes,
        mesas: pedido.comandas?.mesas
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

  const handleCancelarPedido = async (pedidoId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    
    setLoading(true);
    try {
      const { error: errUpdate } = await supabase
        .from('pedidos')
        .update({ status: 'cancelado' })
        .eq('id', pedidoId);
      
      if (errUpdate) throw errUpdate;
      
      // Atualizar lista local
      setPedidos(prev => prev.map(pedido => 
        pedido.id === pedidoId 
          ? { ...pedido, status: 'cancelado' as any }
          : pedido
      ));
    } catch (err: any) {
      setError(err.message || 'Erro ao cancelar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handlePagamentoMesa = (mesaId: string, mesaNumero: number) => {
    setMesaPagamento({ id: mesaId, numero: mesaNumero });
    setShowPagamentoModal(true);
  };

  const handlePagamentoSuccess = () => {
    fetchPedidos();
    // Fechar o modal de seleção de mesa se estiver aberto
    if (showSelecionarMesaModal) {
      setShowSelecionarMesaModal(false);
    }
  };

  const handleMesaSelecionada = (mesa: { id: string; numero: number }) => {
    setMesaPagamento(mesa);
    setShowPagamentoModal(true);
  };

  const handleCriarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Criar ou buscar cliente
      let clienteId: string;
      
      if (formPedido.cliente_telefone) {
        // Verificar se cliente já existe
        const { data: clienteExistente } = await supabase
          .from('clientes')
          .select('id')
          .eq('bar_id', adminUser.bar_id)
          .eq('telefone', formPedido.cliente_telefone)
          .limit(1);

        if (clienteExistente && clienteExistente.length > 0) {
          clienteId = clienteExistente[0].id;
        } else {
          // Criar novo cliente
          const { data: novoCliente, error: errCliente } = await supabase
            .from('clientes')
            .insert({
              bar_id: adminUser.bar_id,
              nome: formPedido.cliente_nome || null,
              telefone: formPedido.cliente_telefone
            })
            .select('id')
            .single();

          if (errCliente) throw errCliente;
          clienteId = novoCliente.id;
        }
      } else {
        throw new Error('Telefone do cliente é obrigatório');
      }

      // 2. Criar ou buscar comanda
      let comandaId: string;
      
      const { data: comandaExistente } = await supabase
        .from('comandas')
        .select('id')
        .eq('mesa_id', formPedido.mesa_id)
        .eq('cliente_id', clienteId)
        .eq('status', 'aberta')
        .limit(1);

      if (comandaExistente && comandaExistente.length > 0) {
        comandaId = comandaExistente[0].id;
      } else {
        // Criar nova comanda
        const { data: novaComanda, error: errComanda } = await supabase
          .from('comandas')
          .insert({
            mesa_id: formPedido.mesa_id,
            cliente_id: clienteId,
            status: 'aberta'
          })
          .select('id')
          .single();

        if (errComanda) throw errComanda;
        comandaId = novaComanda.id;
      }

      // 3. Buscar produto para obter preço
      const produto = produtos.find(p => p.id === formPedido.produto_id);
      if (!produto) throw new Error('Produto não encontrado');

      // 4. Criar pedido
      const { error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          comanda_id: comandaId,
          produto_id: formPedido.produto_id,
          quantidade: formPedido.quantidade,
          preco_unitario: produto.preco,
          subtotal: produto.preco * formPedido.quantidade,
          status: 'pendente',
          observacoes: formPedido.observacoes || null
        });

      if (errPedido) throw errPedido;

      // 5. Limpar formulário e atualizar lista
      setFormPedido({
        mesa_id: '',
        cliente_nome: '',
        cliente_telefone: '',
        produto_id: '',
        quantidade: 1,
        observacoes: ''
      });
      setShowFormPedido(false);
      fetchPedidos();
      
    } catch (err: any) {
      setError(err.message || 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePedido = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormPedido({
      ...formPedido,
      [name]: type === 'number' ? parseInt(value) : value
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'preparando': return 'bg-blue-100 text-blue-800';
      case 'entregue': return 'bg-green-100 text-green-800';
      case 'pago': return 'bg-purple-100 text-purple-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'preparando': return 'Preparando';
      case 'entregue': return 'Entregue';
      case 'pago': return 'Pago';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTotal = () => {
    return pedidos
      .filter(p => p.status === 'pago')
      .reduce((total, p) => total + p.subtotal, 0);
  };

  const calcularPendentes = () => {
    return pedidos.filter(p => p.status === 'pendente').length;
  };

  const totalPaginas = Math.ceil(totalPedidos / pedidosPorPagina);
  const inicioPagina = (paginaAtual - 1) * pedidosPorPagina + 1;
  const fimPagina = Math.min(paginaAtual * pedidosPorPagina, totalPedidos);

  const irParaPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaAtual(pagina);
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

  if (!adminUser) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <AdminLayout
      title="Gerenciar Pedidos"
      subtitle="Visualize e gerencie todos os pedidos do estabelecimento"
      onBack={() => router.push('/admin/dashboard')}
      actions={
        <div className="flex space-x-2">
          <AdminButton
            variant="success"
            onClick={() => setShowSelecionarMesaModal(true)}
            title="Escolher mesa para pagamento"
          >
            💰 Pagar Mesa
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={() => setShowFormPedido(true)}
            title="Criar um novo pedido manualmente"
          >
            Novo Pedido
          </AdminButton>
        </div>
      }
    >
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{pedidos.length}</div>
            <div className="text-sm text-gray-600">Total de Pedidos</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{calcularPendentes()}</div>
            <div className="text-sm text-gray-600">Pedidos Pendentes</div>
          </div>
        </AdminCard>
        
        <AdminCard>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              R$ {calcularTotal().toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Pago</div>
          </div>
        </AdminCard>
      </div>

      {/* Formulário de Novo Pedido */}
      {showFormPedido && (
        <AdminCard title="Criar Novo Pedido" className="mb-6">
          <form onSubmit={handleCriarPedido} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">
                  Mesa *
                  <span className="ml-1 text-gray-400" title="Selecione a mesa do cliente">ⓘ</span>
                </label>
                <select
                  name="mesa_id"
                  value={formPedido.mesa_id}
                  onChange={handleChangePedido}
                  className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-700 border-gray-600 text-white"
                  required
                  title="Selecione a mesa"
                >
                  <option value="">Selecione uma mesa</option>
                  {mesas.map((mesa) => (
                    <option key={mesa.id} value={mesa.id}>
                      Mesa {mesa.numero} - {mesa.descricao || 'Mesa padrão'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">
                  Produto *
                  <span className="ml-1 text-gray-400" title="Selecione o produto">ⓘ</span>
                </label>
                <select
                  name="produto_id"
                  value={formPedido.produto_id}
                  onChange={handleChangePedido}
                  className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-700 border-gray-600 text-white"
                  required
                  title="Selecione o produto"
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} - R$ {produto.preco.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AdminInput
                label="Nome do Cliente"
                tooltip="Nome do cliente (opcional)"
                name="cliente_nome"
                value={formPedido.cliente_nome}
                onChange={handleChangePedido}
                placeholder="Nome do cliente"
                title="Digite o nome do cliente"
              />

              <AdminInput
                label="Telefone do Cliente *"
                tooltip="Telefone do cliente (obrigatório)"
                name="cliente_telefone"
                value={formPedido.cliente_telefone}
                onChange={handleChangePedido}
                placeholder="(11) 99999-9999"
                required
                title="Digite o telefone do cliente"
              />

              <AdminInput
                label="Quantidade *"
                tooltip="Quantidade do produto"
                type="number"
                name="quantidade"
                value={formPedido.quantidade}
                onChange={handleChangePedido}
                min="1"
                required
                title="Digite a quantidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Observações
                <span className="ml-1 text-gray-400" title="Observações especiais do pedido">ⓘ</span>
              </label>
              <textarea
                name="observacoes"
                value={formPedido.observacoes}
                onChange={handleChangePedido}
                rows={3}
                className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-700 border-gray-600 text-white"
                placeholder="Ex: Sem gelo, bem passado, etc."
                title="Digite observações especiais"
              />
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex space-x-2">
              <AdminButton
                type="submit"
                variant="primary"
                disabled={loading}
                title="Criar o pedido"
              >
                {loading ? 'Criando...' : 'Criar Pedido'}
              </AdminButton>
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowFormPedido(false);
                  setFormPedido({
                    mesa_id: '',
                    cliente_nome: '',
                    cliente_telefone: '',
                    produto_id: '',
                    quantidade: 1,
                    observacoes: ''
                  });
                }}
                title="Cancelar e fechar o formulário"
              >
                Cancelar
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      )}

      {/* Filtros */}
      <AdminCard title="Filtros" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">
              Status
              <span className="ml-1 text-gray-400" title="Filtrar por status do pedido">ⓘ</span>
            </label>
            <select
              value={filtros.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltros({ ...filtros, status: e.target.value })}
              className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-700 border-gray-600 text-white"
              title="Selecione o status para filtrar"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="preparando">Preparando</option>
              <option value="entregue">Entregue</option>
              <option value="pago">Pago</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          
          <AdminInput
            label="Mesa"
            tooltip="Filtrar por número da mesa"
            type="number"
            value={filtros.mesa}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFiltros({ ...filtros, mesa: e.target.value })}
            placeholder="Número da mesa"
            title="Digite o número da mesa"
          />
          
          <AdminInput
            label="Data"
            tooltip="Filtrar por data do pedido"
            type="date"
            value={filtros.data}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFiltros({ ...filtros, data: e.target.value })}
            title="Selecione a data"
          />
        </div>
        
        <div className="mt-4">
          <AdminButton
            variant="secondary"
            onClick={() => setFiltros({ status: '', mesa: '', data: '' })}
            title="Limpar todos os filtros"
          >
            Limpar Filtros
          </AdminButton>
        </div>
      </AdminCard>

      {/* Lista de Pedidos */}
      <AdminCard title={`Pedidos (${totalPedidos} total - Página ${paginaAtual} de ${totalPaginas})`}>
        {loading ? (
          <div className="text-center">Carregando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center text-gray-600">Nenhum pedido encontrado</div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Mostrando {inicioPagina} a {fimPagina} de {totalPedidos} pedidos
            </div>
            <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell>Pedido</AdminTableHeaderCell>
              <AdminTableHeaderCell>Cliente</AdminTableHeaderCell>
              <AdminTableHeaderCell>Mesa</AdminTableHeaderCell>
              <AdminTableHeaderCell>Valor</AdminTableHeaderCell>
              <AdminTableHeaderCell>Status</AdminTableHeaderCell>
              <AdminTableHeaderCell>Data</AdminTableHeaderCell>
              <AdminTableHeaderCell>Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <AdminTableCell>
                    <div>
                      <div className="text-sm font-medium">{pedido.produtos?.nome}</div>
                      <div className="text-sm text-gray-500">
                        Qtd: {pedido.quantidade} x R$ {pedido.preco_unitario?.toFixed(2)}
                      </div>
                      {pedido.observacoes && (
                        <div className="text-sm text-gray-500">
                          Obs: {pedido.observacoes}
                        </div>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <div className="text-sm font-medium">
                        {pedido.clientes?.nome || 'Sem nome'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pedido.clientes?.telefone}
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm font-medium">
                      Mesa {pedido.mesas?.numero}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm font-bold">
                      R$ {pedido.subtotal?.toFixed(2)}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pedido.status)}`}>
                      {getStatusText(pedido.status)}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-500">
                      {formatarData(pedido.created_at)}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-y-2">
                      {pedido.status === 'pendente' && (
                        <>
                          <AdminButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(pedido.id, 'preparando')}
                            title="Marcar como preparando"
                          >
                            Preparar
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelarPedido(pedido.id)}
                            title="Cancelar este pedido"
                          >
                            Cancelar
                          </AdminButton>
                        </>
                      )}
                      
                      {pedido.status === 'preparando' && (
                        <AdminButton
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusChange(pedido.id, 'entregue')}
                          title="Marcar como entregue"
                        >
                          Entregar
                        </AdminButton>
                      )}
                      
                      {pedido.status === 'entregue' && (
                        <>
                          <AdminButton
                            variant="warning"
                            size="sm"
                            onClick={() => handleStatusChange(pedido.id, 'pago')}
                            title="Marcar como pago"
                          >
                            Pago
                          </AdminButton>
                          <AdminButton
                            variant="success"
                            size="sm"
                            onClick={() => handlePagamentoMesa(pedido.mesas.id, pedido.mesas.numero)}
                            title="Pagar mesa inteira"
                          >
                            💰 Pagar Mesa
                          </AdminButton>
                        </>
                      )}
                      
                      {pedido.status === 'cancelado' && (
                        <span className="text-sm text-red-600">Cancelado</span>
                      )}
                      
                      {pedido.status === 'pago' && (
                        <span className="text-sm text-green-600">Finalizado</span>
                      )}
                    </div>
                  </AdminTableCell>
                </tr>
              ))}
            </AdminTableBody>
          </AdminTable>
          
          {/* Controles de Paginação */}
          {totalPaginas > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Página {paginaAtual} de {totalPaginas}
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Botão Anterior */}
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => irParaPagina(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                  title="Página anterior"
                >
                  ← Anterior
                </AdminButton>
                
                {/* Botões de Página */}
                {gerarBotoesPagina().map((pagina) => (
                  <AdminButton
                    key={pagina}
                    variant={pagina === paginaAtual ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => irParaPagina(pagina)}
                    title={`Ir para página ${pagina}`}
                  >
                    {pagina}
                  </AdminButton>
                ))}
                
                {/* Botão Próximo */}
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => irParaPagina(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                  title="Próxima página"
                >
                  Próximo →
                </AdminButton>
              </div>
              
              <div className="text-sm text-gray-500">
                {pedidosPorPagina} por página
              </div>
            </div>
          )}
          </>
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