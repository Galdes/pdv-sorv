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
        console.log('Produtos carregados:', produtosComSabores);
        console.log('Sabores carregados:', saboresData);
        
        // Verificar produtos com max_sabores
        const produtosComMaxSabores = produtosComSabores.filter(p => p.max_sabores && p.max_sabores > 1);
        console.log('Produtos com max_sabores > 1:', produtosComMaxSabores);
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
    console.log('Clicou em adicionar produto:', produto);
    console.log('Produto tem max_sabores:', produto.max_sabores);
    console.log('Produto tem sabores:', produto.sabores);
    
    if (produto.max_sabores && produto.max_sabores > 0) {
      console.log('Abrindo modal de sabores...');
      setProdutoSelecionado(produto);
      setSaboresEscolhidos([]);
      setQuantidadeModal(1);
      setShowSaboresModal(true);
    } else {
      console.log('Adicionando produto sem sabores...');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🍦 Sorveteria Conteiner</h1>
              <p className="text-gray-600">Delivery & Retirada</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/delivery/rastrear')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                <Search size={16} />
                Rastrear Pedido
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Pedido via</p>
                <p className="text-lg font-semibold text-blue-600">Cardápio Digital</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categorias e Produtos */}
          <div className="lg:col-span-2">
            {/* Categorias */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoriaAtiva('todos')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    categoriaAtiva === 'todos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Todos
                </button>
                {categorias.map(categoria => (
                  <button
                    key={categoria.id}
                    onClick={() => setCategoriaAtiva(categoria.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      categoriaAtiva === categoria.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {categoria.nome}
                  </button>
                ))}
              </div>
            </div>

            {/* Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {produtosFiltrados.map(produto => (
                <div
                  key={produto.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">{produto.nome}</h3>
                      <span className="text-lg font-bold text-blue-600">
                        R$ {produto.preco.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    
                    {produto.descricao && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {produto.descricao}
                      </p>
                    )}

                    {produto.max_sabores && produto.max_sabores > 1 && (
                      <p className="text-xs text-blue-600 mb-3">
                        Escolha até {produto.max_sabores} sabores
                      </p>
                    )}

                    <button
                      onClick={() => adicionarAoCarrinho(produto)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carrinho */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Seu Pedido</h2>
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} className="text-blue-600" />
                  <span className="text-sm text-gray-600">{totalItens} itens</span>
                </div>
              </div>

              {carrinho.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Seu carrinho está vazio</p>
                  <p className="text-sm text-gray-400">Adicione produtos para continuar</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {carrinho.map((item, index) => (
                      <div key={index} className="border-b border-gray-100 pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{item.produto.nome}</h4>
                            {item.observacoes && (
                              <p className="text-xs text-gray-500 mt-1">{item.observacoes}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => atualizarQuantidade(index, item.quantidade - 1)}
                                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-sm font-medium">{item.quantidade}</span>
                              <button
                                onClick={() => atualizarQuantidade(index, item.quantidade + 1)}
                                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-800">
                              R$ {(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}
                            </p>
                            <button
                              onClick={() => removerDoCarrinho(index)}
                              className="text-red-500 hover:text-red-700 mt-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-800">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        R$ {totalCarrinho.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <button
                      onClick={() => window.location.href = '/delivery/carrinho'}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Continuar para Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Sabores - Otimizado para Mobile */}
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