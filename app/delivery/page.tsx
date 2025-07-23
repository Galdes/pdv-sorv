'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu, Clock, Truck, Store, Phone, MapPin, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ConfigDelivery {
  ativo: boolean;
  horario_inicio: string;
  horario_fim: string;
  dias_funcionamento: string[];
}

export default function DeliveryHome() {
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [config, setConfig] = useState<ConfigDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusDelivery, setStatusDelivery] = useState({
    ativo: true,
    dentroHorario: true,
    mensagem: ''
  });
  const router = useRouter();

  useEffect(() => {
    carregarConfiguracoes();
    // Carregar carrinho do localStorage
    const carrinhoSalvo = localStorage.getItem('carrinhoDelivery');
    if (carrinhoSalvo) {
      setCarrinho(JSON.parse(carrinhoSalvo));
    }
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from('config_delivery')
        .select('ativo, horario_inicio, horario_fim, dias_funcionamento')
        .eq('bar_id', '550e8400-e29b-41d4-a716-446655440000')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setConfig(data);
        verificarStatusDelivery(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const verificarStatusDelivery = (configData: ConfigDelivery) => {
    const agora = new Date();
    const diaSemana = agora.getDay(); // 0 = domingo, 1 = segunda, etc.
    const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diaAtual = diasSemana[diaSemana];

    // Verificar se delivery está ativo
    if (!configData.ativo) {
      setStatusDelivery({
        ativo: false,
        dentroHorario: false,
        mensagem: 'Delivery temporariamente indisponível'
      });
      return;
    }

    // Verificar se está no dia de funcionamento
    if (!configData.dias_funcionamento.includes(diaAtual)) {
      setStatusDelivery({
        ativo: true,
        dentroHorario: false,
        mensagem: 'Não atendemos neste dia da semana'
      });
      return;
    }

    // Verificar horário
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    const [horaInicio, minInicio] = configData.horario_inicio.split(':').map(Number);
    const [horaFim, minFim] = configData.horario_fim.split(':').map(Number);
    const inicioMinutos = horaInicio * 60 + minInicio;
    const fimMinutos = horaFim * 60 + minFim;

    if (horaAtual < inicioMinutos || horaAtual > fimMinutos) {
      setStatusDelivery({
        ativo: true,
        dentroHorario: false,
        mensagem: `Horário de funcionamento: ${configData.horario_inicio} às ${configData.horario_fim}`
      });
      return;
    }

    setStatusDelivery({
      ativo: true,
      dentroHorario: true,
      mensagem: ''
    });
  };

  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);

  const irParaCardapio = () => {
    if (!statusDelivery.ativo || !statusDelivery.dentroHorario) {
      alert('Delivery não disponível no momento. ' + statusDelivery.mensagem);
      return;
    }
    router.push('/delivery/cardapio');
  };

  const irParaCarrinho = () => {
    router.push('/delivery/carrinho');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🍦 Sorveteria Conteiner</h1>
            <p className="text-xl text-gray-600 mb-4">Delivery & Retirada</p>
            <p className="text-gray-500">Peça online e receba em casa ou retire no local</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Aviso de Status */}
        {(!statusDelivery.ativo || !statusDelivery.dentroHorario) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <XCircle size={24} className="text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Delivery Indisponível</h3>
                <p className="text-red-600 text-sm">{statusDelivery.mensagem}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botões Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={irParaCardapio}
            disabled={!statusDelivery.ativo || !statusDelivery.dentroHorario}
            className={`p-8 rounded-lg text-left transition-colors group ${
              !statusDelivery.ativo || !statusDelivery.dentroHorario
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <Menu size={32} className={`group-hover:scale-110 transition-transform ${
                !statusDelivery.ativo || !statusDelivery.dentroHorario ? 'text-gray-400' : ''
              }`} />
              <div>
                <h2 className="text-2xl font-bold">Ver Cardápio</h2>
                <p className={!statusDelivery.ativo || !statusDelivery.dentroHorario ? 'text-gray-400' : 'text-blue-100'}>
                  Explore nossos produtos
                </p>
              </div>
            </div>
            <p className={`text-sm ${!statusDelivery.ativo || !statusDelivery.dentroHorario ? 'text-gray-400' : 'text-blue-100'}`}>
              Sorvetes, milkshakes, açaí e muito mais!
            </p>
          </button>

          <button
            onClick={irParaCarrinho}
            disabled={carrinho.length === 0}
            className={`p-8 rounded-lg text-left transition-colors group ${
              carrinho.length === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <ShoppingCart size={32} className="group-hover:scale-110 transition-transform" />
              <div>
                <h2 className="text-2xl font-bold">Carrinho</h2>
                <p className={carrinho.length === 0 ? 'text-gray-400' : 'text-green-100'}>
                  {carrinho.length === 0 ? 'Vazio' : `${totalItens} itens`}
                </p>
              </div>
            </div>
            <p className={`text-sm ${carrinho.length === 0 ? 'text-gray-400' : 'text-green-100'}`}>
              {carrinho.length === 0 
                ? 'Adicione produtos ao carrinho' 
                : 'Finalize seu pedido'
              }
            </p>
          </button>
        </div>

        {/* Informações do Estabelecimento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={24} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Horário de Funcionamento</h3>
            <p className="text-gray-600 text-sm">
              {config ? (
                <>
                  {config.dias_funcionamento.length === 7 ? 'Todos os dias' : 
                   config.dias_funcionamento.length === 5 ? 'Segunda a Sexta' :
                   config.dias_funcionamento.join(', ')}
                  <br />
                  {config.horario_inicio} às {config.horario_fim}
                </>
              ) : (
                <>
                  Segunda a Domingo<br />
                  10:00 às 22:00
                </>
              )}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck size={24} className="text-green-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Delivery</h3>
            <p className="text-gray-600 text-sm">
              Entregamos em até<br />
              30 minutos
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store size={24} className="text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Retirada</h3>
            <p className="text-gray-600 text-sm">
              Retire no local<br />
              Sem taxa adicional
            </p>
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Informações de Contato</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium text-gray-800">Telefone</p>
                  <p className="text-gray-600">(11) 99999-9999</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium text-gray-800">Endereço</p>
                  <p className="text-gray-600">
                    Rua das Flores, 123<br />
                    Centro - São Paulo/SP
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Formas de Pagamento</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• PIX</li>
                  <li>• Cartão de crédito/débito</li>
                  <li>• Dinheiro</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Taxa de Entrega</h3>
                <p className="text-sm text-gray-600">
                  A partir de R$ 5,00<br />
                  Gratuita para pedidos acima de R$ 30,00
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center mt-8">
          <button
            onClick={irParaCardapio}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🍦 Começar a Pedir Agora
          </button>
        </div>
      </div>
    </div>
  );
} 