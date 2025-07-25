'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Bar, FormBar } from '../../../lib/types';
import AdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminInput 
} from '../../../components/AdminLayout';

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormBar>({
    nome: '',
    endereco: '',
    telefone: '',
    email: '',
    descricao: '',
    ativo: true
  });

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (!userData) {
      router.push('/admin/login');
      return;
    }
    const user = JSON.parse(userData);
    setAdminUser(user);
    
    // Redirecionar sistema_admin para dashboard do sistema
    if (user.tipo === 'sistema_admin') {
      router.push('/admin/sistema');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!adminUser || adminUser.tipo === 'sistema_admin') return;
    fetchBarData();
  }, [adminUser]);

  const fetchBarData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: barData, error: errBar } = await supabase
        .from('bares')
        .select('*')
        .eq('id', adminUser.bar_id)
        .single();

      if (errBar) throw errBar;
      
      setBar(barData);
      setForm({
        nome: barData.nome,
        endereco: barData.endereco || '',
        telefone: barData.telefone || '',
        email: barData.email || '',
        descricao: barData.descricao || '',
        ativo: barData.ativo
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados do estabelecimento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Verificar se o usuário tem permissão para editar
      if (adminUser.tipo !== 'dono_bar') {
        setError('Apenas o dono do estabelecimento pode editar essas informações');
        return;
      }

      const updateData = {
        nome: form.nome,
        endereco: form.endereco,
        telefone: form.telefone,
        email: form.email,
        descricao: form.descricao,
        ativo: form.ativo,
        updated_at: new Date().toISOString()
      };

      // Usar RPC para contornar as políticas RLS
      const { data, error: errUpdate } = await supabase
        .rpc('atualizar_estabelecimento', {
          p_bar_id: adminUser.bar_id,
          p_nome: form.nome,
          p_endereco: form.endereco,
          p_telefone: form.telefone,
          p_email: form.email,
          p_descricao: form.descricao,
          p_ativo: form.ativo
        });

      if (errUpdate) throw errUpdate;
      
      // Verificar se a função RPC retornou sucesso
      if (data && data.success) {
        setSuccess('Dados do estabelecimento atualizados com sucesso!');
      } else {
        throw new Error(data?.message || 'Erro ao atualizar estabelecimento');
      }
      
      // Atualizar dados locais
      fetchBarData();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar dados do estabelecimento');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/admin/dashboard');
  };

  if (loading) {
    return (
      <AdminLayout title="Configurações do Estabelecimento">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando dados do estabelecimento...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações do Estabelecimento">
      <div className="mb-6">
        <AdminButton
          variant="secondary"
          onClick={handleBack}
          title="Voltar ao dashboard"
        >
          ← Voltar
        </AdminButton>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <AdminCard title="Dados do Estabelecimento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <AdminInput
            label="Nome do Estabelecimento"
            tooltip="Nome do estabelecimento que aparece para os clientes"
            type="text"
            name="nome"
            value={form.nome}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, nome: e.target.value})}
            placeholder="Ex: Sorveteria Conteiner"
            required
            title="Digite o nome do estabelecimento"
          />
          
          <AdminInput
            label="Endereço"
            tooltip="Endereço completo do estabelecimento"
            type="text"
            name="endereco"
            value={form.endereco}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, endereco: e.target.value})}
            placeholder="Ex: Rua das Flores, 123 - Centro"
            title="Digite o endereço do estabelecimento"
          />
          
          <AdminInput
            label="Telefone"
            tooltip="Telefone para contato"
            type="tel"
            name="telefone"
            value={form.telefone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, telefone: e.target.value})}
            placeholder="Ex: (11) 99999-9999"
            title="Digite o telefone do estabelecimento"
          />
          
          <AdminInput
            label="Email"
            tooltip="Email para contato"
            type="email"
            name="email"
            value={form.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, email: e.target.value})}
            placeholder="Ex: contato@sorveteria.com"
            title="Digite o email do estabelecimento"
          />
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Descrição
            </label>
                         <textarea
               name="descricao"
               value={form.descricao}
               onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, descricao: e.target.value})}
               placeholder="Descrição do estabelecimento..."
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
               rows={3}
               title="Digite uma descrição do estabelecimento"
             />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={form.ativo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, ativo: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
              Estabelecimento ativo
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <AdminButton
              type="submit"
              variant="success"
              disabled={saving || adminUser.tipo !== 'dono_bar'}
              title={adminUser.tipo !== 'dono_bar' ? 'Apenas o dono pode editar' : 'Salvar alterações'}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </AdminButton>
            
            <AdminButton
              type="button"
              variant="secondary"
              onClick={handleBack}
              title="Cancelar e voltar"
            >
              Cancelar
            </AdminButton>
          </div>
        </form>
      </AdminCard>

      {adminUser.tipo !== 'dono_bar' && (
        <AdminCard title="Permissões">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">
              <strong>Atenção:</strong> Apenas o dono do estabelecimento pode editar essas informações.
            </p>
          </div>
        </AdminCard>
      )}
    </AdminLayout>
  );
} 