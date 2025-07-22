'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { FormAberturaComanda } from '../../../lib/types';

export default function AbrirComandaPage({ params }: { params: Promise<{ mesa_id: string }> }) {
  const { mesa_id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<FormAberturaComanda>({ nome: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!form.telefone) {
      setError('Telefone é obrigatório');
      setLoading(false);
      return;
    }
    try {
      // 1. Cria cliente (ou busca existente)
      let { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefone', form.telefone)
        .eq('bar_id',
          // Buscar bar_id da mesa
          (await supabase.from('mesas').select('bar_id').eq('id', mesa_id).single()).data?.bar_id
        )
        .maybeSingle();
      if (!cliente) {
        const { data: novoCliente, error: errNovo } = await supabase
          .from('clientes')
          .insert({
            nome: form.nome,
            telefone: form.telefone,
            bar_id: (await supabase.from('mesas').select('bar_id').eq('id', mesa_id).single()).data?.bar_id
          })
          .select()
          .single();
        if (errNovo) throw errNovo;
        cliente = novoCliente;
      }
      // 2. Cria comanda
      const { data: comanda, error: errComanda } = await supabase
        .from('comandas')
        .insert({
          mesa_id: mesa_id,
          cliente_id: cliente.id,
          status: 'aberta'
        })
        .select()
        .single();
      if (errComanda) throw errComanda;
      // Redireciona para o menu da mesa/comanda
      router.push(`/menu/${mesa_id}?comanda_id=${comanda.id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao abrir comanda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded shadow p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Abrir Comanda</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Nome (opcional)</label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                className="mt-1 block w-full border rounded px-3 py-2"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Telefone *</label>
              <input
                type="tel"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                className="mt-1 block w-full border rounded px-3 py-2"
                placeholder="(99) 99999-9999"
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition"
              disabled={loading}
            >
              {loading ? 'Abrindo...' : 'Abrir Comanda'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 py-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Talos</span> | 2025 Automações e Sistemas Inteligentes
          </p>
        </div>
      </div>
    </div>
  );
} 