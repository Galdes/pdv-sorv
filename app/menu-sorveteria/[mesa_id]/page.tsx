'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import type { Produto, Categoria, Sabor } from '../../../lib/types';

export default function MenuSorveteriaPage({ params }: { params: Promise<{ mesa_id: string }> }) {
  const [mesaId, setMesaId] = useState<string>('');
  const [barId, setBarId] = useState<string>('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todas');
  const [saborSelecionado, setSaborSelecionado] = useState<string>('todos');
  
  // Estados para o modal de seleção de sabores
  const [showSaboresModal, setShowSaboresModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [saboresEscolhidos, setSaboresEscolhidos] = useState<string[]>([]);

  useEffect(() => {
    params.then(({ mesa_id }) => {
      setMesaId(mesa_id);
    });
  }, [params]);

  useEffect(() => {
    const fetchData = async () => {
      if (!mesaId) return;
      
      setLoading(true);
      setError(null);
      try {
        // Buscar bar_id da mesa
        const { data: mesa, error: errMesa } = await supabase
          .from('mesas')
          .select('bar_id')
          .eq('id', mesaId)
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
  }, [mesaId]);

  const produtosFiltrados = produtos.filter(produto => {
    const categoriaMatch = categoriaSelecionada === 'todas' || 
                          produto.categoria_id === categoriaSelecionada;
    return categoriaMatch;
  });

  const adicionarAoCarrinho = async (produto: Produto) => {
    // Se o produto permite múltiplos sabores, abrir modal de seleção
    if (produto.max_sabores && produto.max_sabores > 1) {
      setProdutoSelecionado(produto);
      setSaboresEscolhidos([]);
      setShowSaboresModal(true);
      return;
    }
    
    // Se não permite múltiplos sabores, adicionar diretamente
    await adicionarProdutoAoCarrinho(produto, []);
  };

  const adicionarProdutoAoCarrinho = async (produto: Produto, saboresIds: string[]) => {
    try {
      // Buscar comanda ativa da mesa
      const { data: comandas, error: errComandas } = await supabase
        .from('comandas')
        .select('id')
        .eq('mesa_id', mesaId)
        .eq('status', 'aberta')
        .limit(1);

      if (errComandas) throw errComandas;
      
      let comandaId: string;
      
      if (!comandas || comandas.length === 0) {
        // Criar nova comanda
        const { data: novaComanda, error: errNovaComanda } = await supabase
          .from('comandas')
          .insert({
            mesa_id: mesaId,
            status: 'aberta',
            bar_id: barId
          })
          .select('id')
          .single();
        
        if (errNovaComanda) throw errNovaComanda;
        comandaId = novaComanda.id;
      } else {
        comandaId = comandas[0].id;
      }

      // Adicionar pedido
      const { error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          comanda_id: comandaId,
          produto_id: produto.id,
          quantidade: 1,
          status: 'pendente',
          observacoes: saboresIds.length > 0 ? `Sabores: ${saboresIds.join(', ')}` : ''
        });

      if (errPedido) throw errPedido;

      alert('Produto adicionado ao carrinho!');
      setShowSaboresModal(false);
      setProdutoSelecionado(null);
      setSaboresEscolhidos([]);
    } catch (err: any) {
      alert('Erro ao adicionar ao carrinho: ' + err.message);
    }
  };

  const handleSaboresChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    
    if (produtoSelecionado && produtoSelecionado.max_sabores && selectedOptions.length > produtoSelecionado.max_sabores) {
      alert(`Você pode selecionar no máximo ${produtoSelecionado.max_sabores} sabor${produtoSelecionado.max_sabores > 1 ? 'es' : ''} para este produto.`);
      return;
    }
    
    setSaboresEscolhidos(selectedOptions);
  };

  const confirmarSabores = () => {
    if (produtoSelecionado) {
      adicionarProdutoAoCarrinho(produtoSelecionado, saboresEscolhidos);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🍦 Sorveteria Conteiner
            </h1>
            <p className="text-gray-600 text-lg">
              Os melhores sabores artesanais
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Mesa {mesaId} • Pedido mínimo para entrega: 4 bolas
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={categoriaSelecionada}
                onChange={(e) => setCategoriaSelecionada(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas as Categorias</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Sabores */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🍦 Nossos Sabores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sabores.map((sabor) => (
              <div key={sabor.id} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2">{sabor.nome}</h3>
                {sabor.descricao && (
                  <p className="text-sm text-gray-600 mb-3">{sabor.descricao}</p>
                )}
                <div className="text-lg font-bold text-blue-600">
                  R$ 6,00
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Produtos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📦 Nossos Produtos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtosFiltrados.map((produto) => (
              <div key={produto.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{produto.nome}</h3>
                {produto.descricao && (
                  <p className="text-gray-600 mb-2">{produto.descricao}</p>
                )}
                {produto.max_sabores && produto.max_sabores > 1 && (
                  <p className="text-sm text-blue-600 font-medium mb-3">
                    ✨ Escolha até {produto.max_sabores} sabores
                  </p>
                )}
                <div className="text-2xl font-bold text-purple-600 mb-4">
                  R$ {produto.preco.toFixed(2).replace('.', ',')}
                </div>
                <button
                  onClick={() => adicionarAoCarrinho(produto)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Informações Importantes</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Pedido mínimo para entrega: 4 bolas</li>
            <li>• Taxa de entrega: R$ 3,00</li>
            <li>• Adicionais para milk shakes: R$ 3,00 cada</li>
            <li>• Sabores marcados com 🍫 contêm massa de chocolate</li>
          </ul>
        </div>
      </div>

      {/* Modal de Seleção de Sabores */}
      {showSaboresModal && produtoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Escolha os Sabores - {produtoSelecionado.nome}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Selecione até {produtoSelecionado.max_sabores} sabor{produtoSelecionado.max_sabores > 1 ? 'es' : ''}:
              </p>
              <select
                multiple
                value={saboresEscolhidos}
                onChange={handleSaboresChange}
                className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white border-gray-300 text-gray-900 min-h-[200px]"
              >
                {sabores.map((sabor) => (
                  <option key={sabor.id} value={sabor.id}>
                    {sabor.nome}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Pressione Ctrl (ou Cmd no Mac) para selecionar múltiplos sabores
              </p>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={confirmarSabores}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirmar ({saboresEscolhidos.length} sabor{saboresEscolhidos.length !== 1 ? 'es' : ''})
              </button>
              <button
                onClick={() => {
                  setShowSaboresModal(false);
                  setProdutoSelecionado(null);
                  setSaboresEscolhidos([]);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 