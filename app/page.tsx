'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Talos</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sistema Inteligente</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#como-funciona" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Como Funciona
              </a>
              <a href="#contato" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-20">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-16">
          <div className={`text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Logo e Título */}
            <div className="mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl mb-6">
                <span className="text-white text-4xl font-bold">T</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Talos
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4">
                Sistema de Comandas Inteligente
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                Em desenvolvimento - Pronto para testes
              </div>
            </div>

            {/* Cards de Acesso */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
              {/* Card Cliente */}
              <div className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
                <div className="p-8">
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">📱</div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Área do Cliente
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    Acesse o menu digital, faça seus pedidos e acompanhe o status em tempo real
                  </p>
                  <div className="space-y-3">
                    <Link 
                      href="/abrir-comanda"
                      className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Abrir Comanda
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Escaneie o QR Code da sua mesa
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Garçom */}
              <div className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>
                <div className="p-8">
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">👨‍💼</div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Área do Garçom
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    Gerencie pedidos, mesas e acompanhe o fluxo de atendimento
                  </p>
                  <Link 
                    href="/admin/login"
                    className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Acessar Sistema
                  </Link>
                </div>
              </div>

              {/* Card Administrador */}
              <div className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '600ms' }}>
                <div className="p-8">
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">⚙️</div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Área Administrativa
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    Gerencie produtos, usuários, relatórios e configurações do sistema
                  </p>
                  <Link 
                    href="/admin/login"
                    className="block w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Painel Admin
                  </Link>
                </div>
              </div>
            </div>

            {/* Status de Desenvolvimento */}
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-4xl mx-auto mb-16 border border-gray-100 dark:border-gray-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '800ms' }}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mb-4">
                  <span className="text-white text-2xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Sistema em Desenvolvimento
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Estamos nas últimas etapas de desenvolvimento
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Funcionalidades Prontas
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
                    <li>• Sistema de comandas completo</li>
                    <li>• Menu digital interativo</li>
                    <li>• Painel administrativo</li>
                    <li>• Sistema de pagamentos</li>
                    <li>• QR Codes dinâmicos</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    Pronto para Testes
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    <li>• Sistema totalmente funcional</li>
                    <li>• Interface responsiva</li>
                    <li>• Banco de dados configurado</li>
                    <li>• Deploy em produção</li>
                    <li>• Teste todas as funcionalidades</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Como Funciona */}
            <div id="como-funciona" className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-4xl mx-auto mb-16 border border-gray-100 dark:border-gray-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1000ms' }}>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Como usar o sistema:
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                    Para Clientes:
                  </h4>
                  <ul className="text-gray-600 dark:text-gray-300 space-y-3">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Escaneie o QR Code da mesa
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Preencha seus dados pessoais
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Navegue pelo menu digital
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Faça seus pedidos
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Acompanhe o status em tempo real
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                    Para Funcionários:
                  </h4>
                  <ul className="text-gray-600 dark:text-gray-300 space-y-3">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Faça login no sistema
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Visualize pedidos pendentes
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Atualize status dos pedidos
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Processe pagamentos
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Acesse relatórios e métricas
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer id="contato" className="bg-gray-100 dark:bg-gray-900 py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Talos</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              2025 Automações e Sistemas Inteligentes
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <span>📧 contato@talos.com.br</span>
              <span>📱 (11) 99999-9999</span>
              <span>🌐 www.talos.com.br</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
