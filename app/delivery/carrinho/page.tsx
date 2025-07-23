'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, X, Trash2 } from 'lucide-react';

interface ItemCarrinho {
  produto: {
    id: string;
    nome: string;
    preco: number;
    descricao?: string;
  };
  quantidade: number;
  saboresEscolhidos?: string[];
  observacoes?: string;
}

export default function CarrinhoDelivery() {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Carregar carrinho do localStorage
    const carrinhoSalvo = localStorage.getItem('carrinhoDelivery');
    if (carrinhoSalvo) {
      setCarrinho(JSON.parse(carrinhoSalvo));
    }
  }, []);

  useEffect(() => {
    // Salvar carrinho no localStorage
    localStorage.setItem('carrinhoDelivery', JSON.stringify(carrinho));
  }, [carrinho]);

  const atualizarQuantidade = (index: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItem(index);
      return;
    }
    
    setCarrinho(prev => prev.map((item, i) => 
      i === index ? { ...item, quantidade: novaQuantidade } : item
    ));
  };

  const removerItem = (index: number) => {
    setCarrinho(prev => prev.filter((_, i) => i !== index));
  };

  const limparCarrinho = () => {
    setCarrinho([]);
  };

  const totalCarrinho = carrinho.reduce((total, item) => 
    total + (item.produto.preco * item.quantidade), 0
  );

  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);

  const prosseguirCheckout = () => {
    if (carrinho.length > 0) {
      router.push('/delivery/checkout');
    }
  };

  if (carrinho.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={32} className="text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Carrinho Vazio</h1>
              <p className="text-gray-600">Seu carrinho não possui itens</p>
            </div>
            
            <button
              onClick={() => router.push('/delivery/cardapio')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Voltar ao Cardápio
            </button>
          </div>
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/delivery/cardapio')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Seu Carrinho</h1>
                <p className="text-gray-600">{totalItens} itens selecionados</p>
              </div>
            </div>
            <button
              onClick={limparCarrinho}
              className="text-red-600 hover:text-red-700 flex items-center gap-2 text-sm"
            >
              <Trash2 size={16} />
              Limpar Carrinho
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Itens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Itens do Pedido</h2>
                
                <div className="space-y-4">
                  {carrinho.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-800 text-lg">{item.produto.nome}</h3>
                            <button
                              onClick={() => removerItem(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          
                          {item.observacoes && (
                            <p className="text-sm text-gray-600 mb-3">{item.observacoes}</p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">Quantidade:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => atualizarQuantidade(index, item.quantidade - 1)}
                                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center font-medium">{item.quantidade}</span>
                                <button
                                  onClick={() => atualizarQuantidade(index, item.quantidade + 1)}
                                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">
                                R$ {(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}
                              </p>
                              <p className="text-sm text-gray-500">
                                R$ {item.produto.preco.toFixed(2).replace('.', ',')} cada
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Resumo do Pedido</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({totalItens} itens)</span>
                  <span className="font-medium">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span className="text-gray-500">Será calculada</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total estimado</span>
                    <span className="text-blue-600">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">* Valor final será calculado no checkout</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={prosseguirCheckout}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Continuar para Checkout
                </button>
                
                <button
                  onClick={() => router.push('/delivery/cardapio')}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Adicionar Mais Itens
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">📋 Próximos Passos</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Escolher retirada ou entrega</li>
                  <li>• Informar endereço (se entrega)</li>
                  <li>• Escolher forma de pagamento</li>
                  <li>• Confirmar pedido</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 