'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, CreditCard, DollarSign, QrCode, Truck, Store } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

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

interface Endereco {
  nome_destinatario: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  referencia: string;
}

export default function CheckoutDelivery() {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [tipoServico, setTipoServico] = useState<'retirada' | 'entrega'>('retirada');
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [valorTroco, setValorTroco] = useState('');
  const [endereco, setEndereco] = useState<Endereco>({
    nome_destinatario: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    referencia: ''
  });
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [taxaEntrega, setTaxaEntrega] = useState(0);
  const [barId, setBarId] = useState<string>('550e8400-e29b-41d4-a716-446655440000'); // ID fixo para teste
  const router = useRouter();

  useEffect(() => {
    // Carregar carrinho do localStorage
    const carrinhoSalvo = localStorage.getItem('carrinhoDelivery');
    if (carrinhoSalvo) {
      setCarrinho(JSON.parse(carrinhoSalvo));
    } else {
      router.push('/delivery/cardapio');
    }
  }, [router]);

  const totalCarrinho = carrinho.reduce((total, item) => 
    total + (item.produto.preco * item.quantidade), 0
  );

  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);

  const handleEnderecoChange = (field: keyof Endereco, value: string) => {
    setEndereco(prev => ({ ...prev, [field]: value }));
  };

  const calcularTroco = () => {
    if (formaPagamento === 'dinheiro' && valorTroco) {
      const troco = parseFloat(valorTroco) - totalCarrinho;
      return troco > 0 ? troco : 0;
    }
    return 0;
  };

  const validarFormulario = () => {
    if (tipoServico === 'entrega') {
      const camposObrigatorios = ['nome_destinatario', 'telefone', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
      return camposObrigatorios.every(campo => endereco[campo as keyof Endereco].trim() !== '');
    }
    if (tipoServico === 'retirada') {
      const camposObrigatorios = ['nome_destinatario', 'telefone'];
      return camposObrigatorios.every(campo => endereco[campo as keyof Endereco].trim() !== '');
    }
    return true;
  };

  const finalizarPedido = async () => {
    if (!validarFormulario()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    
    try {
      // Calcular totais
      const subtotal = carrinho.reduce((total, item) => 
        total + (item.produto.preco * item.quantidade), 0
      );
      const total = subtotal + taxaEntrega;

      // 1. Salvar dados do cliente (entrega ou retirada)
      let enderecoId = null;
      if (tipoServico === 'entrega') {
        const { data: enderecoData, error: enderecoError } = await supabase
          .from('enderecos_entrega')
          .insert({
            nome_destinatario: endereco.nome_destinatario,
            telefone: endereco.telefone,
            cep: endereco.cep,
            logradouro: endereco.logradouro,
            numero: endereco.numero,
            complemento: endereco.complemento,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            referencia: endereco.referencia
          })
          .select('id')
          .single();

        if (enderecoError) throw enderecoError;
        enderecoId = enderecoData.id;
      } else if (tipoServico === 'retirada') {
        // Para retirada, salvar apenas nome e telefone
        const { data: enderecoData, error: enderecoError } = await supabase
          .from('enderecos_entrega')
          .insert({
            nome_destinatario: endereco.nome_destinatario,
            telefone: endereco.telefone,
            logradouro: 'Retirada no local',
            numero: 'N/A',
            bairro: 'N/A',
            cidade: 'N/A',
            estado: 'N/A'
          })
          .select('id')
          .single();

        if (enderecoError) throw enderecoError;
        enderecoId = enderecoData.id;
      }

      // 2. Criar pedido externo
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos_externos')
        .insert({
          bar_id: barId,
          endereco_id: enderecoId,
          tipo_pedido: 'ecommerce',
          tipo_servico: tipoServico,
          status: 'pendente',
          forma_pagamento: formaPagamento,
          valor_subtotal: subtotal,
          valor_taxa_entrega: taxaEntrega,
          valor_total: total,
          valor_troco: calcularTroco(),
          observacoes: observacoes
        })
        .select('id')
        .single();

      if (pedidoError) throw pedidoError;

      // 3. Salvar itens do pedido
      const itensPedido = carrinho.map(item => ({
        pedido_externo_id: pedidoData.id,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco,
        subtotal: item.produto.preco * item.quantidade,
        observacoes: item.observacoes || ''
      }));

      const { error: itensError } = await supabase
        .from('itens_pedido_externo')
        .insert(itensPedido);

      if (itensError) throw itensError;

      // 4. Limpar carrinho
      localStorage.removeItem('carrinhoDelivery');

      // 5. Redirecionar para página de sucesso
      router.push(`/delivery/sucesso?pedido_id=${pedidoData.id}`);

    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao processar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tipo de Serviço</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setTipoServico('retirada')}
            className={`p-6 border-2 rounded-lg text-left transition-colors ${
              tipoServico === 'retirada'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Store size={24} className={tipoServico === 'retirada' ? 'text-blue-600' : 'text-gray-400'} />
              <span className="font-semibold text-gray-800">Retirada</span>
            </div>
            <p className="text-sm text-gray-600">Retire seu pedido no local</p>
          </button>
          
          <button
            onClick={() => setTipoServico('entrega')}
            className={`p-6 border-2 rounded-lg text-left transition-colors ${
              tipoServico === 'entrega'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Truck size={24} className={tipoServico === 'entrega' ? 'text-blue-600' : 'text-gray-400'} />
              <span className="font-semibold text-gray-800">Entrega</span>
            </div>
            <p className="text-sm text-gray-600">Entregamos no seu endereço</p>
          </button>
        </div>
      </div>

      {tipoServico === 'retirada' && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Dados para Retirada</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                value={endereco.nome_destinatario}
                onChange={(e) => handleEnderecoChange('nome_destinatario', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Seu nome completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
              <input
                type="tel"
                value={endereco.telefone}
                onChange={(e) => handleEnderecoChange('telefone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            💡 Esses dados ajudam nossos atendentes a identificar seu pedido quando você chegar na sorveteria.
          </p>
        </div>
      )}

      {tipoServico === 'entrega' && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Endereço de Entrega</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Destinatário *</label>
              <input
                type="text"
                value={endereco.nome_destinatario}
                onChange={(e) => handleEnderecoChange('nome_destinatario', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Seu nome completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
              <input
                type="tel"
                value={endereco.telefone}
                onChange={(e) => handleEnderecoChange('telefone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                type="text"
                value={endereco.cep}
                onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="00000-000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro *</label>
              <input
                type="text"
                value={endereco.logradouro}
                onChange={(e) => handleEnderecoChange('logradouro', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Rua, Avenida, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
              <input
                type="text"
                value={endereco.numero}
                onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <input
                type="text"
                value={endereco.complemento}
                onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Apto, Casa, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
              <input
                type="text"
                value={endereco.bairro}
                onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Centro"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
              <input
                type="text"
                value={endereco.cidade}
                onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="São Paulo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <input
                type="text"
                value={endereco.estado}
                onChange={(e) => handleEnderecoChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SP"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Referência</label>
              <input
                type="text"
                value={endereco.referencia}
                onChange={(e) => handleEnderecoChange('referencia', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Perto do mercado, prédio azul, etc."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Forma de Pagamento</h2>
        <div className="space-y-3">
          <button
            onClick={() => setFormaPagamento('pix')}
            className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
              formaPagamento === 'pix'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <QrCode size={24} className={formaPagamento === 'pix' ? 'text-blue-600' : 'text-gray-400'} />
              <div>
                <span className="font-semibold text-gray-800">PIX</span>
                <p className="text-sm text-gray-600">Pagamento instantâneo</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setFormaPagamento('cartao')}
            className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
              formaPagamento === 'cartao'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard size={24} className={formaPagamento === 'cartao' ? 'text-blue-600' : 'text-gray-400'} />
              <div>
                <span className="font-semibold text-gray-800">Cartão</span>
                <p className="text-sm text-gray-600">Crédito ou débito</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setFormaPagamento('dinheiro')}
            className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
              formaPagamento === 'dinheiro'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <DollarSign size={24} className={formaPagamento === 'dinheiro' ? 'text-blue-600' : 'text-gray-400'} />
              <div>
                <span className="font-semibold text-gray-800">Dinheiro</span>
                <p className="text-sm text-gray-600">Na entrega/retirada</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {formaPagamento === 'dinheiro' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor para troco</label>
          <input
            type="number"
            value={valorTroco}
            onChange={(e) => setValorTroco(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0,00"
            step="0.01"
            min={totalCarrinho}
          />
          {valorTroco && parseFloat(valorTroco) > totalCarrinho && (
            <p className="text-sm text-green-600 mt-1">
              Troco: R$ {calcularTroco().toFixed(2).replace('.', ',')}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Alguma observação especial para seu pedido..."
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Confirmação do Pedido</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Resumo do Pedido</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo de serviço:</span>
              <span className="font-medium">
                {tipoServico === 'retirada' ? 'Retirada' : 'Entrega'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Forma de pagamento:</span>
              <span className="font-medium">
                {formaPagamento === 'pix' ? 'PIX' : 
                 formaPagamento === 'cartao' ? 'Cartão' : 'Dinheiro'}
              </span>
            </div>
            {formaPagamento === 'dinheiro' && valorTroco && (
              <div className="flex justify-between">
                <span className="text-gray-600">Troco:</span>
                <span className="font-medium">
                  R$ {calcularTroco().toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-lg text-blue-600">
                R$ {totalCarrinho.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {tipoServico === 'entrega' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Endereço de Entrega</h3>
            <div className="text-sm text-gray-600">
              <p><strong>{endereco.nome_destinatario}</strong></p>
              <p>{endereco.logradouro}, {endereco.numero}</p>
              {endereco.complemento && <p>{endereco.complemento}</p>}
              <p>{endereco.bairro} - {endereco.cidade}/{endereco.estado}</p>
              {endereco.cep && <p>CEP: {endereco.cep}</p>}
              <p>Tel: {endereco.telefone}</p>
              {endereco.referencia && <p>Ref: {endereco.referencia}</p>}
            </div>
          </div>
        )}

        {tipoServico === 'retirada' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Dados para Retirada</h3>
            <div className="text-sm text-gray-600">
              <p><strong>Nome:</strong> {endereco.nome_destinatario}</p>
              <p><strong>Telefone:</strong> {endereco.telefone}</p>
              <p className="text-blue-600 mt-2">📍 Retirada no local da sorveteria</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Itens do Pedido</h3>
          <div className="space-y-2">
            {carrinho.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantidade}x {item.produto.nome}
                  {item.observacoes && <span className="text-gray-500"> ({item.observacoes})</span>}
                </span>
                <span className="font-medium">
                  R$ {(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/delivery/carrinho')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
              <p className="text-gray-600">Finalize seu pedido</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Steps */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    1
                  </div>
                  <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    2
                  </div>
                  <div className={`w-16 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    3
                  </div>
                </div>
              </div>

              {/* Conteúdo do Step */}
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              {/* Navegação */}
              <div className="flex justify-between mt-8">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Voltar
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    onClick={() => {
                      // Validar antes de avançar
                      if (step === 1 && tipoServico === 'entrega') {
                        const camposObrigatorios = ['nome_destinatario', 'telefone', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
                        const camposVazios = camposObrigatorios.filter(campo => 
                          endereco[campo as keyof Endereco].trim() === ''
                        );
                        
                        if (camposVazios.length > 0) {
                          alert(`Por favor, preencha os seguintes campos obrigatórios: ${camposVazios.join(', ')}`);
                          return;
                        }
                      }
                      
                      if (step === 1 && tipoServico === 'retirada') {
                        const camposObrigatorios = ['nome_destinatario', 'telefone'];
                        const camposVazios = camposObrigatorios.filter(campo => 
                          endereco[campo as keyof Endereco].trim() === ''
                        );
                        
                        if (camposVazios.length > 0) {
                          alert(`Por favor, preencha os seguintes campos obrigatórios: ${camposVazios.join(', ')}`);
                          return;
                        }
                      }
                      setStep(step + 1);
                    }}
                    className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    onClick={finalizarPedido}
                    disabled={loading || !validarFormulario()}
                    className="ml-auto px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processando...' : 'Finalizar Pedido'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Resumo</h2>
              
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
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Informações</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Pedido será confirmado pelo atendente</li>
                  <li>• Pagamento será verificado antes da produção</li>
                  <li>• Você receberá atualizações do status</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 