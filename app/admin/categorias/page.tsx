'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Categoria, FormCategoria } from '../../../lib/types';
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

export default function CategoriasPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [form, setForm] = useState<FormCategoria>({
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
    carregarCategorias();
  }, [adminUser]);

  const carregarCategorias = async () => {
    if (!adminUser) return;
    
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategoria) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('categorias')
          .update({
            nome: form.nome,
            descricao: form.descricao,
            ativo: form.ativo
          })
          .eq('id', editingCategoria.id);

        if (error) throw error;
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from('categorias')
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
      setEditingCategoria(null);
      setShowModal(false);
      carregarCategorias();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      alert('Erro ao salvar categoria: ' + error.message);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setForm({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      ativo: categoria.ativo
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarCategorias();
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      alert('Erro ao excluir categoria: ' + error.message);
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
    setEditingCategoria(null);
    setForm({ nome: '', descricao: '', ativo: true });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategoria(null);
    setForm({ nome: '', descricao: '', ativo: true });
  };

  const handleVoltar = () => {
    router.push('/admin/dashboard');
  };

  return (
    <AdminLayout 
      title="Categorias" 
      subtitle="Gerencie as categorias de produtos"
      onBack={handleVoltar}
      actions={
        <AdminButton onClick={openNewModal} variant="primary">
          Nova Categoria
        </AdminButton>
      }
    >
      <AdminCard>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando categorias...</p>
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
              {categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <AdminTableCell>
                    <div className="font-medium">{categoria.nome}</div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-600">
                      {categoria.descricao || '-'}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      categoria.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {categoria.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex space-x-2">
                      <AdminButton
                        onClick={() => handleEdit(categoria)}
                        variant="secondary"
                        size="sm"
                      >
                        Editar
                      </AdminButton>
                      <AdminButton
                        onClick={() => handleDelete(categoria.id)}
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

        {categorias.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Nenhuma categoria encontrada.</p>
            <AdminButton onClick={openNewModal} variant="primary" className="mt-4">
              Criar primeira categoria
            </AdminButton>
          </div>
        )}
      </AdminCard>

      {/* Modal de Categoria */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <AdminInput
                label="Nome"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                placeholder="Ex: Bebidas"
              />
              
              <AdminTextarea
                label="Descrição"
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Descrição da categoria (opcional)"
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
                  Categoria ativa
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <AdminButton
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  {editingCategoria ? 'Atualizar' : 'Criar'}
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