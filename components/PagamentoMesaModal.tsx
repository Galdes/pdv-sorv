'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Pedido, Produto, Cliente, Mesa } from '../lib/types';
import { AdminCard, AdminButton, AdminInput } from './AdminLayout';

interface PagamentoMesaModalProps {
  mesaId: string;
  mesaNumero: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminUserId: string;
}

interface PedidoCompleto extends Pedido {
  produtos: Produto;
  comandas: {
    clientes: Cliente;
    mesas: Mesa;
  };
}

type TipoPagamento = 'parcial' | 'seletivo' | 'total';

export default function PagamentoMesaModal({
  mesaId,
  mesaNumero,
  isOpen,
  onClose,
  onSuccess,
  adminUserId
}: PagamentoMesaModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento>('total');
  const [valorParcial, setValorParcial] = useState('');
  const [pedidosSelecionados, setPedidosSelecionados] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPedidosMesa();
    }
  }, [isOpen, mesaId]);

  const fetchPedidosMesa = async () => {
    try {
      // Buscar comandas da mesa
      const { data: comandas, error: errComandas } = await supabase
        .from('comandas')
        .select('id')
        .eq('mesa_id', mesaId);
      
      if (errComandas) throw errComandas;
      
      if (!comandas || comandas.length === 0) {
        setPedidos([]);
        return;
      }

      const comandaIds = comandas.map(c => c.id);
      
      // Buscar pedidos das comandas
      const { data: pedidos, error: errPedidos } = await supabase
        .from('pedidos')
        .select(`
          *,
          produtos:produto_id(nome, preco),
          comandas:comanda_id(
            clientes:cliente_id(nome, telefone),
            mesas:mesa_id(numero)
          )
        `)
        .in('comanda_id', comandaIds)
        .neq('status', 'cancelado')
        .order('created_at', { ascending: true });

      if (errPedidos) throw errPedidos;
      setPedidos(pedidos || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar pedidos da mesa');
    }
  };

  const calcularValorTotal = () => {
    return pedidos.reduce((total, pedido) => total + (pedido.valor_restante || pedido.subtotal), 0);
  };

  const calcularValorSelecionados = () => {
    return pedidos
      .filter(pedido => pedidosSelecionados.includes(pedido.id))
      .reduce((total, pedido) => total + (pedido.valor_restante || pedido.subtotal), 0);
  };

  const handlePagamentoParcial = async () => {
    if (!valorParcial || parseFloat(valorParcial) <= 0) {
      setError('Digite um valor válido');
      return;
    }

    const valor = parseFloat(valorParcial);
    const total = calcularValorTotal();
    
    if (valor > total) {
      setError(`Valor maior que o total da mesa (R$ ${total.toFixed(2)})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('processar_pagamento_parcial', {
        p_mesa_id: mesaId,
        p_valor_pago: valor,
        p_usuario_id: adminUserId,
        p_observacoes: observacoes || null
      });

      if (error) throw error;
      
      alert(`Pagamento parcial de R$ ${valor.toFixed(2)} realizado com sucesso!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento parcial');
    } finally {
      setLoading(false);
    }
  };

  const handlePagamentoSeletivo = async () => {
    if (pedidosSelecionados.length === 0) {
      setError('Selecione pelo menos um pedido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('processar_pagamento_seletivo', {
        p_mesa_id: mesaId,
        p_pedidos_ids: pedidosSelecionados,
        p_usuario_id: adminUserId,
        p_observacoes: observacoes || null
      });

      if (error) throw error;
      
      const valor = calcularValorSelecionados();
      alert(`Pagamento de R$ ${valor.toFixed(2)} realizado com sucesso!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento seletivo');
    } finally {
      setLoading(false);
    }
  };

  const handlePagamentoTotal = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('processar_pagamento_total', {
        p_mesa_id: mesaId,
        p_usuario_id: adminUserId,
        p_observacoes: observacoes || null
      });

      if (error) throw error;
      
      const total = calcularValorTotal();
      alert(`Pagamento total de R$ ${total.toFixed(2)} realizado com sucesso!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento total');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    switch (tipoPagamento) {
      case 'parcial':
        await handlePagamentoParcial();
        break;
      case 'seletivo':
        await handlePagamentoSeletivo();
        break;
      case 'total':
        await handlePagamentoTotal();
        break;
    }
  };

  const togglePedidoSelecionado = (pedidoId: string) => {
    setPedidosSelecionados(prev => 
      prev.includes(pedidoId)
        ? prev.filter(id => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  const selecionarTodos = () => {
    setPedidosSelecionados(pedidos.map(p => p.id));
  };

  const desmarcarTodos = () => {
    setPedidosSelecionados([]);
  };

  if (!isOpen) return null;

  const valorTotal = calcularValorTotal();
  const valorSelecionados = calcularValorSelecionados();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Pagamento da Mesa {mesaNumero}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              title="Fechar modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Resumo da Mesa */}
            <AdminCard title={`Resumo - Total: R$ ${valorTotal.toFixed(2)}`} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Pedidos:</span> {pedidos.length}
                </div>
                <div>
                  <span className="font-semibold">Valor Total:</span> R$ {valorTotal.toFixed(2)}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> {pedidos.some(p => p.status !== 'pago') ? 'Pendente' : 'Pago'}
                </div>
              </div>
            </AdminCard>

            {/* Tipo de Pagamento */}
            <AdminCard title="Tipo de Pagamento" className="mb-6">
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value="total"
                    checked={tipoPagamento === 'total'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTipoPagamento(e.target.value as TipoPagamento)}
                    className="text-blue-600"
                  />
                  <span className="font-medium">Pagar Mesa Inteira (R$ {valorTotal.toFixed(2)})</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value="parcial"
                    checked={tipoPagamento === 'parcial'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTipoPagamento(e.target.value as TipoPagamento)}
                    className="text-blue-600"
                  />
                  <span className="font-medium">Pagar Valor Específico</span>
                </label>

                {tipoPagamento === 'parcial' && (
                  <div className="ml-6">
                    <AdminInput
                      label="Valor a Pagar"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={valorTotal}
                      value={valorParcial}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValorParcial(e.target.value)}
                      placeholder={`Máximo: R$ ${valorTotal.toFixed(2)}`}
                      required
                    />
                  </div>
                )}

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value="seletivo"
                    checked={tipoPagamento === 'seletivo'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTipoPagamento(e.target.value as TipoPagamento)}
                    className="text-blue-600"
                  />
                  <span className="font-medium">Selecionar Pedidos Específicos</span>
                </label>

                {tipoPagamento === 'seletivo' && (
                  <div className="ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-blue-800">
                        Controles de Seleção
                      </div>
                      <div className="text-sm font-bold text-blue-900">
                        Total Selecionado: R$ {valorSelecionados.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mb-3">
                      <AdminButton
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={selecionarTodos}
                        title="Selecionar todos os pedidos"
                        className="text-xs"
                      >
                        ☑️ Selecionar Todos
                      </AdminButton>
                      <AdminButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={desmarcarTodos}
                        title="Desmarcar todos os pedidos"
                        className="text-xs"
                      >
                        ☐ Desmarcar Todos
                      </AdminButton>
                    </div>
                    
                    <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                      💡 <strong>Dica:</strong> Marque os checkboxes dos pedidos que deseja pagar. 
                      O valor total será calculado automaticamente.
                    </div>
                  </div>
                )}
              </div>
            </AdminCard>

            {/* Lista de Pedidos */}
            <AdminCard title="Pedidos da Mesa" className="mb-6">
              {pedidos.length === 0 ? (
                <div className="text-center text-gray-600">Nenhum pedido encontrado</div>
              ) : (
                <div className="space-y-3">
                  {pedidos.map((pedido) => {
                    const valorPedido = pedido.valor_restante || pedido.subtotal;
                    const isSelecionado = pedidosSelecionados.includes(pedido.id);
                    
                    return (
                      <div
                        key={pedido.id}
                        className={`p-4 border rounded-lg transition-all duration-200 ${
                          tipoPagamento === 'seletivo' ? 'cursor-pointer hover:bg-gray-50' : ''
                        } ${
                          isSelecionado 
                            ? 'bg-blue-50 border-blue-400 shadow-md' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => tipoPagamento === 'seletivo' && togglePedidoSelecionado(pedido.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              {tipoPagamento === 'seletivo' && (
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelecionado}
                                    onChange={() => togglePedidoSelecionado(pedido.id)}
                                    className={`w-5 h-5 rounded border-2 transition-colors ${
                                      isSelecionado 
                                        ? 'bg-blue-600 border-blue-600 text-white' 
                                        : 'border-gray-300 hover:border-blue-400'
                                    }`}
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                  />
                                  {isSelecionado && (
                                    <div className="ml-2 text-blue-600 text-sm font-medium">
                                      ✓ Selecionado
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-lg">{pedido.produtos?.nome}</div>
                                <div className="text-sm text-gray-600">
                                  👤 {pedido.comandas?.clientes?.nome || pedido.comandas?.clientes?.telefone}
                                </div>
                                <div className="text-sm text-gray-500">
                                  📦 Qtd: {pedido.quantidade} x R$ {pedido.preco_unitario?.toFixed(2)}
                                </div>
                                {pedido.observacoes && (
                                  <div className="text-sm text-gray-500">
                                    💬 Obs: {pedido.observacoes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${
                              isSelecionado ? 'text-blue-700' : 'text-gray-900'
                            }`}>
                              R$ {valorPedido.toFixed(2)}
                            </div>
                            <div className={`text-sm px-3 py-1 rounded-full inline-block font-medium ${
                              pedido.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                              pedido.status === 'preparando' ? 'bg-blue-100 text-blue-800' :
                              pedido.status === 'entregue' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {pedido.status}
                            </div>
                            {isSelecionado && (
                              <div className="mt-1 text-xs text-blue-600 font-medium">
                                ✅ Será pago
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </AdminCard>

            {/* Observações */}
            <AdminCard title="Observações (Opcional)" className="mb-6">
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="Observações sobre o pagamento..."
              />
            </AdminCard>

            {/* Erro */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end space-x-4">
              <AdminButton
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                title="Cancelar pagamento"
              >
                Cancelar
              </AdminButton>
              <AdminButton
                type="submit"
                variant="success"
                disabled={loading}
                title="Confirmar pagamento"
              >
                {loading ? 'Processando...' : 'Confirmar Pagamento'}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 