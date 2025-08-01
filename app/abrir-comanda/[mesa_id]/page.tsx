'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { FormAberturaComanda } from '../../../lib/types';

export default function AbrirComandaPage({ params }: { params: Promise<{ mesa_id: string }> }) {
  const { mesa_id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<FormAberturaComanda>({ nome: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mesaDisponivel, setMesaDisponivel] = useState<boolean | null>(null);
  const [verificandoMesa, setVerificandoMesa] = useState(true);

  useEffect(() => {
    verificarDisponibilidadeMesa();
  }, [mesa_id]);

  const verificarDisponibilidadeMesa = async () => {
    try {
      // Usar a função SQL mesa_disponivel_melhorada para verificar status
      const { data: disponivel, error: errDisponivel } = await supabase
        .rpc('mesa_disponivel_melhorada', { p_mesa_id: mesa_id });

      if (errDisponivel) throw errDisponivel;

      setMesaDisponivel(disponivel);
    } catch (err: any) {
      console.error('Erro ao verificar disponibilidade da mesa:', err);
      setMesaDisponivel(false);
    } finally {
      setVerificandoMesa(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verificar se telefone foi informado
      if (!form.telefone) {
        setError('Telefone é obrigatório');
        setLoading(false);
        return;
      }

      // 1. Buscar capacidade da mesa
      const { data: mesa, error: errMesa } = await supabase
        .from('mesas')
        .select('capacidade')
        .eq('id', mesa_id)
        .single();

      if (errMesa) throw errMesa;

      // 2. Buscar comandas ativas da mesa
      const { data: comandasAtivas, error: errComandas } = await supabase
        .from('comandas')
        .select('cliente_id')
        .eq('mesa_id', mesa_id)
        .eq('status', 'aberta');

      if (errComandas) throw errComandas;

      // 3. Buscar telefones únicos das comandas ativas
      const telefonesUnicos = [];
      for (const comanda of comandasAtivas || []) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('telefone')
          .eq('id', comanda.cliente_id)
          .single();
        
        if (cliente?.telefone) {
          telefonesUnicos.push(cliente.telefone);
        }
      }

      // 4. Verificar se telefone já existe (reutilizar comanda)
      const telefoneJaExiste = telefonesUnicos.includes(form.telefone);
      
      if (telefoneJaExiste) {
        // Buscar comanda existente do telefone
        const { data: clienteExistente } = await supabase
          .from('clientes')
          .select('id')
          .eq('telefone', form.telefone)
          .single();

        if (clienteExistente) {
          const { data: comandaExistente } = await supabase
            .from('comandas')
            .select('id')
            .eq('cliente_id', clienteExistente.id)
            .eq('mesa_id', mesa_id)
            .eq('status', 'aberta')
            .single();

          if (comandaExistente) {
            // Redirecionar para menu com comanda existente
            router.push(`/menu/${mesa_id}?comanda_id=${comandaExistente.id}`);
            return;
          }
        }
      }

      // 5. Verificar capacidade (telefones únicos)
      const telefonesUnicosCount = new Set(telefonesUnicos).size;
      const podeReceber = telefonesUnicosCount < mesa.capacidade;

      if (!podeReceber) {
        setError('Capacidade de comandas atingiu seu limite. Para abrir uma nova comanda, solicite ao atendente que aumente a capacidade da mesa.');
        setLoading(false);
        return;
      }

      // 6. Buscar ou criar cliente
      let clienteId = null;
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefone', form.telefone)
        .single();

      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        // Buscar bar_id da mesa
        const { data: mesaInfo } = await supabase
          .from('mesas')
          .select('bar_id')
          .eq('id', mesa_id)
          .single();

        const { data: novoCliente, error: errCliente } = await supabase
          .from('clientes')
          .insert({
            nome: form.nome || null,
            telefone: form.telefone,
            bar_id: mesaInfo?.bar_id
          })
          .select('id')
          .single();

        if (errCliente) throw errCliente;
        clienteId = novoCliente.id;
      }

      // 7. Criar comanda
      const { data: comanda, error: errComanda } = await supabase
        .from('comandas')
        .insert({
          mesa_id: mesa_id,
          cliente_id: clienteId,
          status: 'aberta'
        })
        .select('id')
        .single();

      if (errComanda) throw errComanda;

      // 8. Redirecionar para o menu
      router.push(`/menu/${mesa_id}?comanda_id=${comanda.id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao abrir comanda');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica a mesa
  if (verificandoMesa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando disponibilidade da mesa...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar erro se mesa não está disponível
  if (!mesaDisponivel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        {/* Header com logo */}
        <div className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  🍦 Sorveteria Conteiner
                </h1>
                <p className="text-gray-600 text-sm">
                  Sistema Digital de Pedidos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 text-center">
                <div className="text-4xl mb-3">🚫</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Mesa Ocupada
                </h2>
                <p className="text-red-100 text-sm">
                  Esta mesa não está disponível no momento
                </p>
              </div>
              
              <div className="px-6 py-8 text-center">
                <p className="text-gray-600 mb-6">
                  Esta mesa possui uma comanda aberta e não pode receber novos clientes no momento.
                </p>
                
                <button
                  onClick={() => router.push('/abrir-comanda')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  🪑 Escolher Outra Mesa
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-white border-t border-gray-100 py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Talos</span> | 2025 Automações e Sistemas Inteligentes
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Sistema PDV Digital para Sorveterias
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header com logo */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🍦 Sorveteria Conteiner
              </h1>
              <p className="text-gray-600 text-sm">
                Sistema Digital de Pedidos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card principal */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header do card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Abrir Comanda
              </h2>
              <p className="text-blue-100 text-sm">
                Preencha seus dados para começar
              </p>
            </div>

            {/* Formulário */}
            <div className="px-6 py-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Campo Nome */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome (opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">👤</span>
                    </div>
                    <input
                      type="text"
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                {/* Campo Telefone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">📱</span>
                    </div>
                    <input
                      type="tel"
                      name="telefone"
                      value={form.telefone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="(99) 99999-9999"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Seu telefone será usado para identificar sua comanda
                  </p>
                </div>

                {/* Mensagem de erro */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2">⚠️</span>
                      <span className="text-red-700 text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* Botão de submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Abrindo comanda...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🚀</span>
                      Abrir Comanda
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Card de informações */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <span className="text-blue-500 mr-3 mt-0.5">💡</span>
              <div>
                <h3 className="text-sm font-semibold text-blue-800 mb-1">
                  Como funciona?
                </h3>
                <p className="text-xs text-blue-700">
                  Após abrir sua comanda, você será direcionado para o menu digital onde poderá fazer seus pedidos de forma rápida e fácil.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Talos</span> | 2025 Automações e Sistemas Inteligentes
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sistema PDV Digital para Sorveterias
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 