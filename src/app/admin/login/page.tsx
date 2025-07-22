'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../../lib/supabaseClient';
import type { FormLogin } from '../../../../lib/types';
import AdminLayout, { AdminCard, AdminButton, AdminInput } from '../../../../components/AdminLayout';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormLogin>({
    email: '',
    senha: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Buscar usuário pelo email
      const { data: usuarios, error: errBusca } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', form.email)
        .limit(1);

      if (errBusca) throw errBusca;
      if (!usuarios || usuarios.length === 0) {
        setError('Email ou senha incorretos');
        setLoading(false);
        return;
      }

      const usuario = usuarios[0];

      // Verificar senha usando bcrypt
      const senhaValida = await bcrypt.compare(form.senha, usuario.senha_hash);
      if (!senhaValida) {
        setError('Email ou senha incorretos');
        setLoading(false);
        return;
      }

      // Salvar dados do usuário no localStorage
      localStorage.setItem('adminUser', JSON.stringify(usuario));
      
      // Redirecionar baseado no tipo de usuário
      if (usuario.tipo === 'sistema_admin') {
        router.push('/admin/sistema');
      } else if (usuario.tipo === 'cozinheiro') {
        router.push('/admin/cozinha');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
        {/* Header Centralizado */}
        <div className="text-center mb-8 mt-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">T</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Login Administrativo
          </h1>
          <p className="text-gray-300 text-lg">
            Acesse o painel de gerenciamento
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Entrar no Sistema
            </h2>
            <p className="text-gray-600">
              Digite suas credenciais para acessar o painel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AdminInput
              label="Email"
              tooltip="Email cadastrado no sistema"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@bar.com"
              required
              title="Digite seu email de administrador"
            />
            
            <AdminInput
              label="Senha"
              tooltip="Senha de acesso ao painel"
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
              placeholder="••••••••"
              required
              title="Digite sua senha"
            />
            
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            
            <AdminButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
              title="Fazer login no sistema"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </AdminButton>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="font-medium mb-3">Dados de teste:</p>
            <div className="space-y-3">
              <div className="border-l-4 border-purple-500 pl-3 py-2 bg-purple-50 rounded-r">
                <p className="font-medium text-purple-800">Dono do Bar:</p>
                <p className="text-purple-700">Email: dono@bar.com</p>
                <p className="text-purple-700">Senha: dono123</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded-r">
                <p className="font-medium text-blue-800">Garçom:</p>
                <p className="text-blue-700">Email: garcon@bar.com</p>
                <p className="text-blue-700">Senha: garcon123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="w-full py-6 flex-shrink-0">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            <span className="font-semibold">Talos</span> | 2025 Automações e Sistemas Inteligentes
          </p>
        </div>
      </footer>
    </div>
  );
} 