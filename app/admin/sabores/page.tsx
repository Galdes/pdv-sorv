'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Sabor, FormSabor } from '../../../lib/types';
import AdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminInput, 
  AdminTextarea,
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableCell
} from '../../../components/AdminLayout';

export default function SaboresPage() {
  const router = useRouter();
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSabor, setEditingSabor] = useState<Sabor | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [form, setForm] = useState<FormSabor>({
    nome: '',
    descricao: '',
    ativo: true
  });

  useEffect(() => {
    // Carregar dados do usuário logado
    const userData = localStorage.getItem('adminUser');
    if (userData) {
      setAdminUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    carregarSabores();
  }, [adminUser]);

  const carregarSabores = async () => {
    if (!adminUser) return;
    
    try {
      const { data, error } = await supabase
        .from('sabores')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .order('nome');

      if (error) throw error;
      setSabores(data || []);
    } catch (error) {
      console.error('Erro ao carregar sabores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSabor) {
        // Atualizar sabor existente
        const { error } = await supabase
          .from('sabores')
          .update({
            nome: form.nome,
            descricao: form.descricao,
            ativo: form.ativo
          })
          .eq('id', editingSabor.id);

        if (error) throw error;
      } else {
        // Criar novo sabor
        const { error } = await supabase
          .from('sabores')
          .insert([{
            nome: form.nome,
            descricao: form.descricao,
            ativo: form.ativo,
            bar_id: adminUser.bar_id
          }]);

        if (error) throw error;
      }

      // Limpar formulário e recarregar
      setForm({ nome: '', descricao: '', ativo: true });
      setEditingSabor(null);
      setShowModal(false);
      carregarSabores();
    } catch (error: any) {
      console.error('Erro ao salvar sabor:', error);
      alert('Erro ao salvar sabor: ' + error.message);
    }
  };

  const handleEdit = (sabor: Sabor) => {
    setEditingSabor(sabor);
    setForm({
      nome: sabor.nome,
      descricao: sabor.descricao || '',
      ativo: sabor.ativo
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este sabor?')) return;

    try {
      const { error } = await supabase
        .from('sabores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarSabores();
    } catch (error: any) {
      console.error('Erro ao excluir sabor:', error);
      alert('Erro ao excluir sabor: ' + error.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const openNewModal = () => {
    setEditingSabor(null);
    setForm({ nome: '', descricao: '', ativo: true });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSabor(null);
    setForm({ nome: '', descricao: '', ativo: true });
  };

  const handleVoltar = () => {
    router.push('/admin/dashboard');
  };

  return (
    <AdminLayout 
      title="Sabores" 
      subtitle="Gerencie os sabores disponíveis para produtos"
      onBack={handleVoltar}
      actions={
        <AdminButton onClick={openNewModal} variant="primary">
          Novo Sabor
        </AdminButton>
      }
    >
      <AdminCard>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando sabores...</p>
          </div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell>Nome</AdminTableHeaderCell>
              <AdminTableHeaderCell>Descrição</AdminTableHeaderCell>
              <AdminTableHeaderCell>Status</AdminTableHeaderCell>
              <AdminTableHeaderCell>Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {sabores.map((sabor) => (
                <tr key={sabor.id}>
                  <AdminTableCell>
                    <div className="font-medium">{sabor.nome}</div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-600">
                      {sabor.descricao || '-'}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      sabor.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sabor.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex space-x-2">
                      <AdminButton
                        onClick={() => handleEdit(sabor)}
                        variant="secondary"
                        size="sm"
                      >
                        Editar
                      </AdminButton>
                      <AdminButton
                        onClick={() => handleDelete(sabor.id)}
                        variant="danger"
                        size="sm"
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

        {sabores.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Nenhum sabor encontrado.</p>
            <AdminButton onClick={openNewModal} variant="primary" className="mt-4">
              Criar primeiro sabor
            </AdminButton>
          </div>
        )}
      </AdminCard>

      {/* Modal de Sabor */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingSabor ? 'Editar Sabor' : 'Novo Sabor'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <AdminInput
                label="Nome"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                placeholder="Ex: Tradicional"
              />
              
              <AdminTextarea
                label="Descrição"
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Descrição do sabor (opcional)"
                rows={3}
              />
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={form.ativo}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Sabor ativo
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <AdminButton
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  {editingSabor ? 'Atualizar' : 'Criar'}
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancelar
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 