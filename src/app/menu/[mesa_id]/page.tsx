'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import type { Produto } from '../../../../lib/types';

export default function MenuPage({ params }: { params: Promise<{ mesa_id: string }> }) {
  const { mesa_id } = use(params);
  const searchParams = useSearchParams();
  const comanda_id = searchParams.get('comanda_id');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState<string | null>(null);

  useEffect(() => {
    const fetchProdutos = async () => {
      setLoading(true);
      setError(null);
      try {
        // Buscar bar_id da mesa
        const { data: mesa, error: errMesa } = await supabase
          .from('mesas')
          .select('bar_id')
          .eq('id', mesa_id)
          .single();
        if (errMesa) throw errMesa;
        // Buscar produtos do bar
        const { data: produtos, error: errProdutos } = await supabase
          .from('produtos')
          .select('*')
          .eq('bar_id', mesa.bar_id)
          .eq('ativo', true);
        if (errProdutos) throw errProdutos;
        setProdutos(produtos || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar produtos');
      } finally {
        setLoading(false);
      }
    };
    fetchProdutos();
  }, [mesa_id]);

  const adicionarPedido = async (produto: Produto) => {
    if (!comanda_id) {
      setError('Comanda não encontrada. Volte e abra uma comanda.');
      return;
    }
    setAdicionando(produto.id);
    setError(null);
    try {
      const { error: errPedido } = await supabase.from('pedidos').insert({
        comanda_id,
        produto_id: produto.id,
        quantidade: 1,
        preco_unitario: produto.preco,
        subtotal: produto.preco,
        status: 'pendente',
      });
      if (errPedido) throw errPedido;
      alert('Item adicionado ao pedido!');
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar pedido');
    } finally {
      setAdicionando(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col items-center p-4">
        <div className="w-full max-w-2xl bg-white rounded shadow p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Menu Digital</h1>
          <div className="mb-6 text-center">
            <a
              href={`/resumo/${mesa_id}?comanda_id=${comanda_id}`}
              className="inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              Ver Resumo da Mesa
            </a>
          </div>
          {loading ? (
            <div className="text-center">Carregando produtos...</div>
          ) : error ? (
            <div className="text-red-600 text-center">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {produtos.map((produto) => (
                <div key={produto.id} className="border rounded p-4 flex flex-col justify-between">
                  {produto.imagem_url && (
                    <img
                      src={produto.imagem_url}
                      alt={produto.nome}
                      className="w-full h-40 object-cover rounded mb-2"
                    />
                  )}
                  <div>
                    <h2 className="font-semibold text-lg">{produto.nome}</h2>
                    <p className="text-sm text-gray-600">{produto.descricao}</p>
                    <p className="font-bold mt-2">R$ {produto.preco.toFixed(2)}</p>
                  </div>
                  <button
                    className="mt-4 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition"
                    onClick={() => adicionarPedido(produto)}
                    disabled={adicionando === produto.id}
                  >
                    {adicionando === produto.id ? 'Adicionando...' : 'Adicionar ao Pedido'}
                  </button>
                </div>
              ))}
            </div>
          )}
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