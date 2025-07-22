'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import type { Pedido, Produto } from '../../../../lib/types';

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col items-center p-4">
        <div className="w-full max-w-2xl bg-white rounded shadow p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Resumo da Mesa</h1>
          <div className="flex justify-end mb-4">
            <button
              className={`px-4 py-2 rounded font-semibold border ${mostrarApenasMeus ? 'bg-green-600 text-white' : 'bg-white text-green-600 border-green-600'}`}
              onClick={() => setMostrarApenasMeus((v) => !v)}
            >
              {mostrarApenasMeus ? 'Ver todos os pedidos' : 'Ver apenas meus pedidos'}
            </button>
          </div>
          {loading ? (
            <div className="text-center">Carregando pedidos...</div>
          ) : error ? (
            <div className="text-red-600 text-center">{error}</div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="text-center">Nenhum pedido encontrado para esta mesa.</div>
          ) : (
            <div className="space-y-4">
              {pedidosFiltrados.map((pedido) => (
                <div
                  key={pedido.id}
                  className={`border rounded p-4 flex flex-col md:flex-row md:items-center justify-between ${pedido.comanda_id === comanda_id ? 'bg-green-50 border-green-400' : ''}`}
                >
                  <div className="flex-1">
                    <div className="font-semibold">{pedido.produto?.nome}</div>
                    <div className="text-sm text-gray-600">Qtd: {pedido.quantidade} | R$ {pedido.subtotal.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Status: {pedido.status}</div>
                  </div>
                  {pedido.produto?.imagem_url && (
                    <img src={pedido.produto.imagem_url} alt={pedido.produto.nome} className="w-16 h-16 object-cover rounded ml-4" />
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 text-center">
            <a
              href={`/menu/${mesa_id}?comanda_id=${comanda_id}`}
              className="inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              Voltar ao Menu
            </a>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 py-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Talos</span> | 2025 Automações e Sistemas Inteligentes
          </p>
        </div>
      </div>
    </div>
  );
} 