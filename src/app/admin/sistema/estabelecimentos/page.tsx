'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabaseClient';
import type { Bar } from '../../../../../lib/types';
import AdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminInput, 
  AdminTable, 
  AdminTableHeader, 
  AdminTableHeaderCell, 
  AdminTableBody, 
  AdminTableCell 
} from '../../../../../components/AdminLayout';

interface FormBar {
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
}

export default function EstabelecimentosPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [bares, setBares] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);
  const [form, setForm] = useState<FormBar>({
    nome: '',
    endereco: '',
    telefone: '',
    email: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (!userData) {
      router.push('/admin/login');
      return;
    }
    const user = JSON.parse(userData);
    setAdminUser(user);
    
    // Verificar se é sistema_admin
    if (user.tipo !== 'sistema_admin') {
      router.push('/admin/dashboard');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!adminUser || adminUser.tipo !== 'sistema_admin') return;
    fetchBares();
  }, [adminUser]);

  const fetchBares = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: bares, error: errBares } = await supabase
        .from('bares')
        .select('*')
        .order('nome');

      if (errBares) throw errBares;
      setBares(bares || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar estabelecimentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (editingBar) {
        // Atualizar bar
        const { error: errUpdate } = await supabase
          .from('bares')
          .update(form)
          .eq('id', editingBar.id);
        if (errUpdate) throw errUpdate;
      } else {
        // Criar novo bar
        const { error: errInsert } = await supabase
          .from('bares')
          .insert(form);
        if (errInsert) throw errInsert;
      }

      setShowForm(false);
      setEditingBar(null);
      resetForm();
      fetchBares();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar estabelecimento');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bar: Bar) => {
    setEditingBar(bar);
    setForm({
      nome: bar.nome,
      endereco: bar.endereco || '',
      telefone: bar.telefone || '',
      email: bar.email || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este estabelecimento? Isso também excluirá todas as mesas, produtos, usuários e pedidos associados.')) return;
    
    setLoading(true);
    try {
      const { error: errDelete } = await supabase
        .from('bares')
        .delete()
        .eq('id', id);
      if (errDelete) throw errDelete;
      fetchBares();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir estabelecimento');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      nome: '',
      endereco: '',
      telefone: '',
      email: ''
    });
  };

  const handleBack = () => {
    router.push('/admin/sistema');
  };

  if (!adminUser || adminUser.tipo !== 'sistema_admin') {
    return <div className="text-center p-4">Acesso negado. Apenas administradores do sistema podem acessar esta página.</div>;
  }

  return (
    <AdminLayout
      title="Gerenciar Estabelecimentos"
      subtitle="Visualizar e gerenciar todos os bares do sistema"
      actions={
        <div className="flex gap-2">
          <AdminButton
            variant="secondary"
            onClick={handleBack}
            title="Voltar ao dashboard do sistema"
          >
            Voltar
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={() => setShowForm(true)}
            title="Adicionar novo estabelecimento"
          >
            Novo Estabelecimento
          </AdminButton>
        </div>
      }
    >
      {error && (
        <AdminCard>
          <div className="text-red-600 text-center">{error}</div>
        </AdminCard>
      )}

      {showForm && (
        <AdminCard title={editingBar ? "Editar Estabelecimento" : "Novo Estabelecimento"}>
          <form onSubmit={handleSubmit} className="space-y-4">
                         <AdminInput
               label="Nome do Estabelecimento"
               tooltip="Nome do bar ou restaurante"
               type="text"
               name="nome"
               value={form.nome}
               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, nome: e.target.value})}
               placeholder="Ex: Bar do João"
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
               placeholder="Ex: contato@bar.com"
               title="Digite o email do estabelecimento"
             />
            
            <div className="flex gap-2">
              <AdminButton
                type="submit"
                variant="primary"
                disabled={loading}
                title="Salvar estabelecimento"
              >
                {loading ? 'Salvando...' : (editingBar ? 'Atualizar' : 'Criar')}
              </AdminButton>
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingBar(null);
                  resetForm();
                }}
                title="Cancelar operação"
              >
                Cancelar
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminCard title="Estabelecimentos Cadastrados">
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : bares.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum estabelecimento cadastrado
          </div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell>Nome</AdminTableHeaderCell>
              <AdminTableHeaderCell>Endereço</AdminTableHeaderCell>
              <AdminTableHeaderCell>Telefone</AdminTableHeaderCell>
              <AdminTableHeaderCell>Email</AdminTableHeaderCell>
              <AdminTableHeaderCell>Status</AdminTableHeaderCell>
              <AdminTableHeaderCell>Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {bares.map((bar) => (
                <tr key={bar.id}>
                  <AdminTableCell>
                    <div className="font-medium">{bar.nome}</div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-600">{bar.endereco || '-'}</div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm">{bar.telefone || '-'}</div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm">{bar.email || '-'}</div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      bar.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {bar.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex gap-1">
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(bar)}
                        title="Editar estabelecimento"
                      >
                        Editar
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(bar.id)}
                        title="Excluir estabelecimento"
                      >
                        Excluir
                      </AdminButton>
                    </div>
                  </AdminTableCell>
                </tr>
              ))}
            </AdminTableBody>
          </AdminTable>
        )}
      </AdminCard>
    </AdminLayout>
  );
} 