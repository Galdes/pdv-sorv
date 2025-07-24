'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { Produto, Sabor } from '../../../lib/types';
import { ShoppingCart, Plus, Minus, X, Check, Search } from 'lucide-react';

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  saboresEscolhidos?: string[];
  observacoes?: string;
}

export default function CardapioDelivery() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaboresModal, setShowSaboresModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [saboresEscolhidos, setSaboresEscolhidos] = useState<string[]>([]);
  const [quantidadeModal, setQuantidadeModal] = useState(1);
  const router = useRouter();

  useEffect(() => {
    carregarDados();
    carregarCarrinho();
  }, []);

  useEffect(() => {
    // Salvar carrinho no localStorage
    localStorage.setItem('carrinhoDelivery', JSON.stringify(carrinho));
  }, [carrinho]);

  const carregarCarrinho = () => {
    const carrinhoSalvo = localStorage.getItem('carrinhoDelivery');
    if (carrinhoSalvo) {
      setCarrinho(JSON.parse(carrinhoSalvo));
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Buscar categorias
      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (categoriasData) {
        setCategorias(categoriasData);
      }

      // Buscar produtos
      const { data: produtosData } = await supabase
        .from('produtos')
        .select(`
          *,
          categorias(nome)
        `)
        .eq('ativo', true)
        .order('nome');

      // Buscar sabores reais do banco
      const { data: saboresData } = await supabase
        .from('sabores')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (produtosData) {
        const produtosComSabores = produtosData.map((produto) => {
          return {
            ...produto,
            categoria_nome: produto.categorias?.nome,
            sabores: saboresData || [] // Usar sabores reais do banco
          };
        });

        setProdutos(produtosComSabores);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = categoriaAtiva === 'todos' 
    ? produtos 
    : produtos.filter(produto => produto.categoria_id === categoriaAtiva);

  const adicionarAoCarrinho = (produto: Produto) => {
    if (produto.max_sabores && produto.max_sabores > 0) {
      setProdutoSelecionado(produto);
      setSaboresEscolhidos([]);
      setQuantidadeModal(1);
      setShowSaboresModal(true);
    } else {
      adicionarProdutoAoCarrinho(produto, 1, []);
    }
  };

  const adicionarProdutoAoCarrinho = (produto: Produto, quantidade: number, sabores: string[]) => {
    setCarrinho(prev => {
      // Converter IDs dos sabores para nomes
      const nomesSabores = sabores.map(saborId => {
        const sabor = produto.sabores?.find(s => s.id === saborId);
        return sabor ? sabor.nome : saborId;
      });

      // Verificar se já existe um item igual no carrinho
      const itemExistente = prev.find(item => 
        item.produto.id === produto.id && 
        JSON.stringify(item.saboresEscolhidos) === JSON.stringify(sabores)
      );

      if (itemExistente) {
        return prev.map(item => 
          item.produto.id === produto.id && 
          JSON.stringify(item.saboresEscolhidos) === JSON.stringify(sabores)
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      } else {
        return [...prev, {
          produto,
          quantidade,
          saboresEscolhidos: sabores,
          observacoes: sabores.length > 0 ? `Sabores: ${nomesSabores.join(', ')}` : undefined
        }];
      }
    });
  };

  const handleSaboresChange = (saborId: string) => {
    setSaboresEscolhidos(prev => {
      if (prev.includes(saborId)) {
        return prev.filter(id => id !== saborId);
      } else {
        if (produtoSelecionado && prev.length < produtoSelecionado.max_sabores!) {
          return [...prev, saborId];
        }
        return prev;
      }
    });
  };

  const confirmarSabores = () => {
    if (produtoSelecionado) {
      adicionarProdutoAoCarrinho(produtoSelecionado, quantidadeModal, saboresEscolhidos);
      setShowSaboresModal(false);
      setProdutoSelecionado(null);
      setSaboresEscolhidos([]);
      setQuantidadeModal(1);
    }
  };

  const removerDoCarrinho = (index: number) => {
    setCarrinho(prev => prev.filter((_, i) => i !== index));
  };

  const atualizarQuantidade = (index: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(index);
      return;
    }
    
    setCarrinho(prev => prev.map((item, i) => 
      i === index ? { ...item, quantidade: novaQuantidade } : item
    ));
  };

  const totalCarrinho = carrinho.reduce((total, item) => 
    total + (item.produto.preco * item.quantidade), 0
  );

  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);

  // Função para converter URL do Google Drive automaticamente
  const processarUrlImagem = (url: string): string => {
    if (!url) return '';
    
    // Detectar se é URL do Google Drive
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (driveMatch) {
      const fileId = driveMatch[1];
      // Converter para formato de thumbnail do Google Drive
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }
    
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando cardápio...</p>
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
                <p className="text-sm text-gray-500">Delivery & Retirada</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/delivery/rastrear')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
              >
                <Search size={16} />
                Rastrear
              </button>
              
              {/* Carrinho Flutuante - Versão Compacta */}
              <button
                onClick={() => window.location.href = '/delivery/carrinho'}
                className="relative bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
              >
                <ShoppingCart size={20} />
                {totalItens > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {totalItens}
                  </span>
                )}
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

                {/* Indicador de Sabores */}
                {produto.max_sabores && produto.max_sabores > 1 && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Escolha até {produto.max_sabores} sabores
                    </span>
                  </div>
                )}

                {/* Botão Adicionar */}
                <button
                  onClick={() => adicionarAoCarrinho(produto)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 group-hover:scale-105 transform duration-200"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Estado Vazio */}
        {produtosFiltrados.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🍦</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-600">Tente selecionar outra categoria</p>
          </div>
        )}
      </div>

      {/* Carrinho Flutuante - Versão Expandida (Mobile) */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 lg:hidden z-50">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{totalItens} itens</p>
                  <p className="text-sm text-gray-500">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/delivery/carrinho'}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Ver Carrinho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sabores - Mantido como está */}
      {showSaboresModal && produtoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header do Modal */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">{produtoSelecionado.nome}</h3>
                <button
                  onClick={() => setShowSaboresModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Preço */}
              <div className="mb-4">
                <p className="text-2xl font-bold text-blue-600">
                  R$ {produtoSelecionado.preco.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Seleção de Sabores */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Escolha até <span className="font-semibold">{produtoSelecionado.max_sabores}</span> sabores:
                </p>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {Array.isArray(produtoSelecionado.sabores) && produtoSelecionado.sabores.length > 0 ? (
                    produtoSelecionado.sabores.map((sabor: Sabor) => (
                      <button
                        key={sabor.id}
                        onClick={() => handleSaboresChange(sabor.id)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          saboresEscolhidos.includes(sabor.id)
                            ? 'border-blue-600 bg-blue-50 text-blue-800'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{sabor.nome}</span>
                          {saboresEscolhidos.includes(sabor.id) && (
                            <Check size={20} className="text-blue-600" />
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Carregando sabores...</p>
                    </div>
                  )}
                </div>

                {saboresEscolhidos.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    {saboresEscolhidos.length} de {produtoSelecionado.max_sabores} sabores selecionados
                  </p>
                )}
              </div>

              {/* Quantidade */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Quantidade:</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setQuantidadeModal(Math.max(1, quantidadeModal - 1))}
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-2xl font-bold w-16 text-center">{quantidadeModal}</span>
                  <button
                    onClick={() => setQuantidadeModal(quantidadeModal + 1)}
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaboresModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarSabores}
                  disabled={Boolean(produtoSelecionado.max_sabores && produtoSelecionado.max_sabores > 0 && saboresEscolhidos.length === 0)}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Adicionar ({quantidadeModal})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 