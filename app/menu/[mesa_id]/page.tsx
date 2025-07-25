'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Produto, Categoria, Sabor } from '../../../lib/types';

export default function MenuPage({ params }: { params: Promise<{ mesa_id: string }> }) {
  const { mesa_id } = use(params);
  const searchParams = useSearchParams();
  const comanda_id = searchParams.get('comanda_id');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroSabor, setFiltroSabor] = useState<string>('');
  const [barId, setBarId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
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
        
        setBarId(mesa.bar_id);

        // Buscar produtos com categoria e múltiplos sabores
        const { data: produtos, error: errProdutos } = await supabase
          .rpc('buscar_produtos_com_sabores', {
            p_bar_id: mesa.bar_id,
            p_ativo: true
          });
        if (errProdutos) throw errProdutos;
        setProdutos(produtos || []);

        // Buscar categorias
        const { data: categorias, error: errCategorias } = await supabase
          .from('categorias')
          .select('*')
          .eq('bar_id', mesa.bar_id)
          .eq('ativo', true)
          .order('nome');
        if (errCategorias) throw errCategorias;
        setCategorias(categorias || []);

        // Buscar sabores
        const { data: sabores, error: errSabores } = await supabase
          .from('sabores')
          .select('*')
          .eq('bar_id', mesa.bar_id)
          .eq('ativo', true)
          .order('nome');
        if (errSabores) throw errSabores;
        setSabores(sabores || []);

      } catch (err: any) {
        setError(err.message || 'Erro ao buscar produtos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    const matchCategoria = !filtroCategoria || produto.categoria_id === filtroCategoria;
    const matchSabor = !filtroSabor || produto.sabor_id === filtroSabor;
    return matchCategoria && matchSabor;
  });

  const limparFiltros = () => {
    setFiltroCategoria('');
    setFiltroSabor('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col items-center p-4">
        <div className="w-full max-w-4xl bg-white rounded shadow p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Menu Digital</h1>
          
          {/* Filtros */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Sabor</label>
                <select
                  value={filtroSabor}
                  onChange={(e) => setFiltroSabor(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os sabores</option>
                  {sabores.map((sabor) => (
                    <option key={sabor.id} value={sabor.id}>
                      {sabor.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={limparFiltros}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

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
            <>
              {produtosFiltrados.length === 0 ? (
                <div className="text-center text-gray-600">
                  {produtos.length === 0 ? 'Nenhum produto disponível' : 'Nenhum produto encontrado com os filtros selecionados'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtosFiltrados.map((produto) => (
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
                        
                        {/* Categoria e Sabor */}
                        <div className="mt-2 space-y-1">
                          {produto.categoria_nome && (
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mr-2">
                              {produto.categoria_nome}
                            </div>
                          )}
                          {produto.sabor_nome && (
                            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block">
                              {produto.sabor_nome}
                            </div>
                          )}
                        </div>
                        
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
            </>
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