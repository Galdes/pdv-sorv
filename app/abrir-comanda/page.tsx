'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function AbrirComanda() {
  const [mesas, setMesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    carregarMesas();
    setIsLoaded(true);
  }, []);

  const carregarMesas = async () => {
    try {
      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .eq('ativo', true)
        .order('numero');

      if (error) throw error;
      
      // Calcular status real das mesas usando a função SQL
      const mesasComStatus = await Promise.all(
        (data || []).map(async (mesa) => {
          // Usar a função SQL mesa_disponivel para verificar status
          const { data: disponivel, error: errDisponivel } = await supabase
            .rpc('mesa_disponivel', { p_mesa_id: mesa.id });

          if (errDisponivel) {
            console.error('Erro ao verificar disponibilidade da mesa:', errDisponivel);
            return {
              ...mesa,
              status: 'livre' // Fallback para livre em caso de erro
            };
          }

          return {
            ...mesa,
            status: disponivel ? 'livre' : 'ocupada'
          };
        })
      );

      setMesas(mesasComStatus || []);
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl mb-6">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Carregando mesas disponíveis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Talos</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sistema Inteligente</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {mesas.length} mesa{mesas.length !== 1 ? 's' : ''} disponível{mesas.length !== 1 ? 'eis' : ''}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          {/* Header da Página */}
          <div className={`text-center mb-12 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link 
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 group"
            >
              <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
              Voltar ao início
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              🍺 Abrir Comanda
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              Selecione sua mesa para começar
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Sistema pronto para uso
            </div>
          </div>

          {/* Grid de Mesas */}
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-6xl mx-auto mb-12 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
            {mesas.map((mesa, index) => (
              <Link
                key={mesa.id}
                href={`/abrir-comanda/${mesa.id}`}
                className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${400 + index * 100}ms` }}
              >
                <div className="p-6 text-center">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {mesa.status === 'ocupada' ? '🪑' : '🪑'}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Mesa {mesa.numero}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Capacidade: {mesa.capacidade} pessoa{mesa.capacidade !== 1 ? 's' : ''}
                  </p>
                  
                  {mesa.status === 'ocupada' && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Ocupada
                      </span>
                    </div>
                  )}
                  
                  {mesa.status === 'livre' && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Livre
                      </span>
                    </div>
                  )}
                  
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium text-sm group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300">
                    Selecionar Mesa
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Mensagem se não há mesas */}
          {mesas.length === 0 && (
            <div className={`text-center py-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '500ms' }}>
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
                <span className="text-4xl">😔</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Nenhuma mesa disponível
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                No momento, todas as mesas estão ocupadas ou indisponíveis. 
                Entre em contato com o estabelecimento para mais informações.
              </p>
              <Link 
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              >
                Voltar ao início
              </Link>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-4xl mx-auto border border-gray-100 dark:border-gray-700 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '800ms' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Como funciona:
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 dark:text-blue-400 text-xl">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Selecione a Mesa</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Escolha sua mesa na lista acima
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 dark:text-green-400 text-xl">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Preencha os Dados</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Informe seu nome e telefone
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 dark:text-purple-400 text-xl">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Faça seus Pedidos</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Acesse o menu e escolha seus itens
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Talos</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              2025 Automações e Sistemas Inteligentes
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 