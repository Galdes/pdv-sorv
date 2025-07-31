'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Pedido, Produto } from '../../../lib/types';
import { ArrowLeft, ShoppingCart, Phone, CreditCard } from 'lucide-react';

export default function ResumoMesaPage({ params }: { params: Promise<{ mesa_id: string }> }) {
  const { mesa_id } = use(params);
  const searchParams = useSearchParams();
  const comanda_id = searchParams.get('comanda_id');
  const [pedidos, setPedidos] = useState<(Pedido & { produto: Produto })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarApenasMeus, setMostrarApenasMeus] = useState(false);

  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true);
      setError(null);
      try {
        // Buscar todas as comandas da mesa
        const { data: comandas, error: errComandas } = await supabase
          .from('comandas')
          .select('id')
          .eq('mesa_id', mesa_id);
        if (errComandas) throw errComandas;
        const comandaIds = comandas?.map((c) => c.id) || [];
        if (comandaIds.length === 0) {
          setPedidos([]);
          setLoading(false);
          return;
        }
        // Buscar todos os pedidos dessas comandas
        const { data: pedidos, error: errPedidos } = await supabase
          .from('pedidos')
          .select('*, produto:produto_id(*)')
          .in('comanda_id', comandaIds);
        if (errPedidos) throw errPedidos;
        setPedidos(pedidos || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar pedidos');
      } finally {
        setLoading(false);
      }
    };
    fetchPedidos();
  }, [mesa_id]);

  const pedidosFiltrados = mostrarApenasMeus && comanda_id
    ? pedidos.filter((p) => p.comanda_id === comanda_id)
    : pedidos;

  const totalPedidos = pedidosFiltrados.reduce((total, pedido) => total + pedido.subtotal, 0);
  const pedidosPendentes = pedidosFiltrados.filter(p => p.status === 'pendente').length;

  const processarUrlImagem = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://wsjllcziqgbugzvgcunw.supabase.co/storage/v1/object/public/produtos/${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando resumo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Fixo */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🍦</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sorveteria Conteiner</h1>
                <p className="text-sm text-gray-500">Resumo da Mesa {mesa_id}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = `/menu/${mesa_id}?comanda_id=${comanda_id}`}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
              >
                <ArrowLeft size={16} />
                Voltar ao Menu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Card Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header do Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Resumo da Mesa</h2>
              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  mostrarApenasMeus 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
                onClick={() => setMostrarApenasMeus((v) => !v)}
              >
                {mostrarApenasMeus ? 'Ver todos os pedidos' : 'Ver apenas meus pedidos'}
              </button>
            </div>
          </div>

          {/* Conteúdo do Card */}
          <div className="p-6">
            {pedidosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg">
                  Nenhum pedido encontrado para esta mesa.
                </div>
              </div>
            ) : (
              <>
                {/* Resumo Estatístico */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{pedidosFiltrados.length}</div>
                    <div className="text-sm text-gray-600">Total de Pedidos</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{pedidosPendentes}</div>
                    <div className="text-sm text-gray-600">Pedidos Pendentes</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      R$ {totalPedidos.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-sm text-gray-600">Valor Total</div>
                  </div>
                </div>

                {/* Lista de Pedidos */}
                <div className="space-y-4">
                  {pedidosFiltrados.map((pedido) => (
                    <div
                      key={pedido.id}
                      className={`border rounded-lg p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md ${
                        pedido.comanda_id === comanda_id 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {/* Imagem do Produto */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {pedido.produto?.imagem_url ? (
                          <img 
                            src={processarUrlImagem(pedido.produto.imagem_url)} 
                            alt={pedido.produto.nome} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl">🍦</span>
                          </div>
                        )}
                      </div>

                      {/* Informações do Pedido */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">{pedido.produto?.nome}</h3>
                          <span className="text-lg font-bold text-blue-600">
                            R$ {pedido.subtotal.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Quantidade: {pedido.quantidade}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pedido.status === 'pendente' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : pedido.status === 'pago'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {pedido.status === 'pendente' ? '⏳ Pendente' : 
                             pedido.status === 'pago' ? '✅ Pago' : 
                             pedido.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card de Informações de Pagamento */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard size={20} />
              Informações de Pagamento
            </h3>
          </div>
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Phone className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Para pagar sua conta:</h4>
                  <ul className="text-blue-800 space-y-1 text-sm">
                    <li>• Chame um atendente ou</li>
                    <li>• Se dirija ao caixa</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShoppingCart className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Dica:</h4>
                  <p className="text-green-800 text-sm">
                    Você pode continuar fazendo pedidos enquanto aguarda o atendimento. 
                    Todos os pedidos serão adicionados à sua comanda.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Voltar */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = `/menu/${mesa_id}?comanda_id=${comanda_id}`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft size={16} />
            Voltar ao Menu
          </button>
        </div>
      </div>
    </div>
  );
} 