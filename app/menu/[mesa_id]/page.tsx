'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Produto, Categoria, Sabor } from '../../../lib/types';
import { Plus, Search, ShoppingCart } from 'lucide-react';

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
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');
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
  const produtosFiltrados = categoriaAtiva === 'todos' 
    ? produtos 
    : produtos.filter(produto => produto.categoria_id === categoriaAtiva);

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
          <p className="mt-4 text-gray-600">Carregando menu...</p>
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
                <p className="text-sm text-gray-500">Menu Digital - Mesa {mesa_id}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = `/resumo/${mesa_id}?comanda_id=${comanda_id}`}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
              >
                <Search size={16} />
                Ver Resumo
              </button>
              
              {/* Botão Resumo */}
              <button
                onClick={() => window.location.href = `/resumo/${mesa_id}?comanda_id=${comanda_id}`}
                className="relative bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
              >
                <ShoppingCart size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categorias em Abas */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            <button
              onClick={() => setCategoriaAtiva('todos')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                categoriaAtiva === 'todos'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Todos
            </button>
            {categorias.map(categoria => (
              <button
                key={categoria.id}
                onClick={() => setCategoriaAtiva(categoria.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  categoriaAtiva === categoria.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {categoria.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produtosFiltrados.map(produto => (
            <div
              key={produto.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group"
            >
              {/* Imagem do Produto */}
              {produto.imagem_url ? (
                <div className="h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={processarUrlImagem(produto.imagem_url)}
                    alt={produto.nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback para placeholder se a imagem falhar
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  {/* Placeholder de fallback */}
                  <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center hidden">
                    <span className="text-4xl">🍦</span>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <span className="text-4xl">🍦</span>
                </div>
              )}
              
              <div className="p-4">
                {/* Nome e Preço */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">{produto.nome}</h3>
                  <span className="text-lg font-bold text-blue-600">
                    R$ {produto.preco.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                {/* Descrição */}
                {produto.descricao && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {produto.descricao}
                  </p>
                )}

                {/* Categoria */}
                {produto.categoria_nome && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {produto.categoria_nome}
                    </span>
                  </div>
                )}

                {/* Sabor */}
                {produto.sabor_nome && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {produto.sabor_nome}
                    </span>
                  </div>
                )}

                {/* Botão Adicionar */}
                <button
                  onClick={() => adicionarPedido(produto)}
                  disabled={adicionando === produto.id}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 group-hover:scale-105 transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adicionando === produto.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Adicionar ao Pedido
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem quando não há produtos */}
        {produtosFiltrados.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {produtos.length === 0 ? 'Nenhum produto disponível' : 'Nenhum produto encontrado nesta categoria'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 