'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Mesa } from '../lib/types';
import { AdminCard, AdminButton, AdminInput } from './AdminLayout';

interface SelecionarMesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMesaSelecionada: (mesa: { id: string; numero: number }) => void;
  adminUserId: string;
  barId: string;
}

interface MesaComPedidos extends Mesa {
  total_pendente: number;
  pedidos_count: number;
}

export default function SelecionarMesaModal({
  isOpen,
  onClose,
  onMesaSelecionada,
  adminUserId,
  barId
}: SelecionarMesaModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mesas, setMesas] = useState<MesaComPedidos[]>([]);
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas'); // 'todas', 'com_pedidos', 'sem_pedidos'

  useEffect(() => {
    if (isOpen) {
      fetchMesasComPedidos();
    }
  }, [isOpen, barId]);

  const fetchMesasComPedidos = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar todas as mesas do bar
      const { data: mesasData, error: errMesas } = await supabase
        .from('mesas')
        .select('*')
        .eq('bar_id', barId)
        .eq('ativa', true)
        .order('numero');

      if (errMesas) throw errMesas;

      if (!mesasData || mesasData.length === 0) {
        setMesas([]);
        return;
      }

      // Para cada mesa, calcular total pendente e quantidade de pedidos
      const mesasComPedidos = await Promise.all(
        mesasData.map(async (mesa) => {
          // Buscar comandas da mesa
          const { data: comandas } = await supabase
            .from('comandas')
            .select('id, status')
            .eq('mesa_id', mesa.id);

          if (!comandas || comandas.length === 0) {
            return {
              ...mesa,
              total_pendente: 0,
              pedidos_count: 0
            };
          }

          // Verificar se há comandas abertas
          const comandasAbertas = comandas.filter(c => c.status === 'aberta');
          const temComandaAberta = comandasAbertas.length > 0;

          const comandaIds = comandas.map(c => c.id);

          // Buscar pedidos pendentes das comandas
          const { data: pedidos } = await supabase
            .from('pedidos')
            .select('valor_restante, subtotal, status')
            .in('comanda_id', comandaIds)
            .neq('status', 'cancelado');

          const totalPendente = pedidos?.reduce((total, pedido) => {
            // Só incluir no total se o pedido não estiver pago
            if (pedido.status !== 'pago') {
              return total + (pedido.valor_restante || pedido.subtotal);
            }
            return total;
          }, 0) || 0;

          // Contar apenas pedidos não pagos
          const pedidosNaoPagos = pedidos?.filter(pedido => pedido.status !== 'pago') || [];
          
          return {
            ...mesa,
            total_pendente: totalPendente,
            pedidos_count: pedidosNaoPagos.length // Remover a lógica que força 1 se tem comanda aberta
          };
        })
      );

      setMesas(mesasComPedidos);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar mesas');
    } finally {
      setLoading(false);
    }
  };

  const mesasFiltradas = mesas.filter(mesa => {
    // Filtro por número
    if (filtroNumero && !mesa.numero.toString().includes(filtroNumero)) {
      return false;
    }

    // Filtro por status
    switch (filtroStatus) {
      case 'com_pedidos':
        return mesa.pedidos_count > 0;
      case 'sem_pedidos':
        return mesa.pedidos_count === 0;
      default:
        return true; // 'todas'
    }
  });

  const handleMesaSelecionada = (mesa: MesaComPedidos) => {
    onMesaSelecionada({ id: mesa.id, numero: mesa.numero });
    onClose();
  };

  const limparFiltros = () => {
    setFiltroNumero('');
    setFiltroStatus('todas');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Selecionar Mesa para Pagamento</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              title="Fechar modal"
            >
              ×
            </button>
          </div>

          {/* Filtros */}
          <AdminCard title="Filtros" className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da Mesa
                </label>
                <AdminInput
                  type="text"
                  value={filtroNumero}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFiltroNumero(e.target.value)}
                  placeholder="Digite o número..."
                  title="Filtrar por número da mesa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="todas">Todas as Mesas</option>
                  <option value="com_pedidos">Com Pedidos</option>
                  <option value="sem_pedidos">Sem Pedidos</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <AdminButton
                  variant="secondary"
                  onClick={limparFiltros}
                  title="Limpar todos os filtros"
                >
                  🗑️ Limpar Filtros
                </AdminButton>
              </div>
            </div>
          </AdminCard>

          {/* Lista de Mesas */}
          <AdminCard title={`Mesas Disponíveis (${mesasFiltradas.length})`}>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Carregando mesas...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600">{error}</div>
              </div>
            ) : mesasFiltradas.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Nenhuma mesa encontrada</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mesasFiltradas.map((mesa) => (
                  <div
                    key={mesa.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      mesa.pedidos_count > 0 
                        ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleMesaSelecionada(mesa)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-blue-600">
                        Mesa {mesa.numero}
                      </div>
                      <div className={`text-sm px-2 py-1 rounded-full ${
                        mesa.pedidos_count > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {mesa.pedidos_count > 0 ? '📋 Ativa' : '🆓 Livre'}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pedidos:</span>
                        <span className="font-medium">{mesa.pedidos_count}</span>
                      </div>
                      
                      {mesa.pedidos_count > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Pendente:</span>
                          <span className="font-bold text-green-600">
                            R$ {mesa.total_pendente.toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {mesa.capacidade && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacidade:</span>
                          <span className="font-medium">{mesa.capacidade} pessoas</span>
                        </div>
                      )}
                      
                      {mesa.descricao && (
                        <div className="text-xs text-gray-500 mt-2">
                          💬 {mesa.descricao}
                        </div>
                      )}
                    </div>
                    
                    {mesa.pedidos_count > 0 && (
                      <div className="mt-3">
                        <AdminButton
                          variant="success"
                          size="sm"
                          className="w-full"
                          title={`Pagar mesa ${mesa.numero}`}
                        >
                          💰 Pagar Mesa {mesa.numero}
                        </AdminButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </AdminCard>

          {/* Botões */}
          <div className="flex justify-end mt-6">
            <AdminButton
              variant="secondary"
              onClick={onClose}
              title="Cancelar seleção"
            >
              Cancelar
            </AdminButton>
          </div>
        </div>
      </div>
    </div>
  );
} 