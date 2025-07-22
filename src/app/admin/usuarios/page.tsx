'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../../lib/supabaseClient';
import type { Usuario } from '../../../../lib/types';
import AdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminInput, 
  AdminTable, 
  AdminTableHeader, 
  AdminTableHeaderCell, 
  AdminTableBody, 
  AdminTableCell 
} from '../../../../components/AdminLayout';

interface FormUsuario {
  nome: string;
  email: string;
  senha: string;
  tipo: 'sistema_admin' | 'dono_bar' | 'garcom' | 'cozinheiro';
  ativo: boolean;
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormUsuario>({
    nome: '',
    email: '',
    senha: '',
    tipo: 'garcom',
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
    
    // Verificar se é sistema_admin ou dono_bar
    if (user.tipo !== 'sistema_admin' && user.tipo !== 'dono_bar') {
      router.push('/admin/dashboard');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!adminUser || (adminUser.tipo !== 'sistema_admin' && adminUser.tipo !== 'dono_bar')) return;
    fetchUsuarios();
  }, [adminUser]);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('usuarios')
        .select('*')
        .order('nome');

      // Se for dono_bar, filtrar apenas usuários do seu bar
      if (adminUser.tipo === 'dono_bar') {
        query = query.eq('bar_id', adminUser.bar_id);
      }
      // Se for sistema_admin, mostrar todos os usuários

      const { data: usuarios, error: errUsuarios } = await query;

      if (errUsuarios) throw errUsuarios;
      setUsuarios(usuarios || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar email único
      if (!editingUsuario) {
        const { data: existingUser } = await supabase
          .from('usuarios')
          .select('id')
          .eq('email', form.email)
          .limit(1);

        if (existingUser && existingUser.length > 0) {
          setError('Este email já está cadastrado');
          setLoading(false);
          return;
        }
      }

      const userData = {
        nome: form.nome,
        email: form.email,
        tipo: form.tipo,
        ativo: form.ativo,
        bar_id: adminUser.tipo === 'dono_bar' ? adminUser.bar_id : null
      };

      if (editingUsuario) {
        // Atualizar usuário existente
        const updateData: any = { ...userData };
        if (form.senha) {
          updateData.senha_hash = await bcrypt.hash(form.senha, 10);
        }

        const { error: errUpdate } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('id', editingUsuario.id);

        if (errUpdate) throw errUpdate;
      } else {
        // Criar novo usuário
        if (!form.senha) {
          setError('Senha é obrigatória para novos usuários');
          setLoading(false);
          return;
        }

        const { error: errInsert } = await supabase
          .from('usuarios')
          .insert({
            ...userData,
            senha_hash: await bcrypt.hash(form.senha, 10)
          });

        if (errInsert) throw errInsert;
      }

      setShowForm(false);
      setEditingUsuario(null);
      resetForm();
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: '', // Não preencher senha na edição
      tipo: usuario.tipo,
      ativo: usuario.ativo
    });
    setShowForm(true);
  };

  const handleDelete = async (usuarioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    // Não permitir excluir o próprio usuário
    if (usuarioId === adminUser.id) {
      setError('Você não pode excluir seu próprio usuário');
      return;
    }

    setLoading(true);
    try {
      const { error: errDelete } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuarioId);

      if (errDelete) throw errDelete;
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (usuarioId: string, ativo: boolean) => {
    // Não permitir desativar o próprio usuário
    if (usuarioId === adminUser.id) {
      setError('Você não pode desativar seu próprio usuário');
      return;
    }

    setLoading(true);
    try {
      const { error: errUpdate } = await supabase
        .from('usuarios')
        .update({ ativo: !ativo })
        .eq('id', usuarioId);

      if (errUpdate) throw errUpdate;
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar status do usuário');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      nome: '',
      email: '',
      senha: '',
      tipo: 'garcom',
      ativo: true
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  if (!adminUser || (adminUser.tipo !== 'sistema_admin' && adminUser.tipo !== 'dono_bar')) {
    return <div className="text-center p-4">Acesso negado. Apenas administradores e donos de bar podem acessar esta página.</div>;
  }

  return (
    <AdminLayout
      title="Gerenciar Usuários"
      subtitle="Adicione, edite ou remova garçons e administradores"
      onBack={() => router.push('/admin/dashboard')}
      actions={
        <AdminButton
          variant="success"
          onClick={() => {
            setShowForm(true);
            setEditingUsuario(null);
            resetForm();
          }}
          title="Adicionar um novo usuário ao sistema"
        >
          Novo Usuário
        </AdminButton>
      }
    >
      {/* Formulário */}
      {showForm && (
        <AdminCard title={editingUsuario ? 'Editar Usuário' : 'Novo Usuário'} className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Nome *"
                tooltip="Nome completo do usuário"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex: João Silva"
                required
                title="Digite o nome completo do usuário"
              />
              
              <AdminInput
                label="Email *"
                tooltip="Email único para login no sistema"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="joao@bar.com"
                required
                title="Digite o email do usuário"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label={editingUsuario ? "Nova Senha (opcional)" : "Senha *"}
                tooltip={editingUsuario ? "Deixe em branco para manter a senha atual" : "Senha para acesso ao sistema"}
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                placeholder={editingUsuario ? "•••••••• (opcional)" : "••••••••"}
                required={!editingUsuario}
                title={editingUsuario ? "Digite uma nova senha (opcional)" : "Digite a senha do usuário"}
              />
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">
                  Tipo de Usuário
                  <span className="ml-1 text-gray-400" title="Define as permissões do usuário">ⓘ</span>
                </label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-700 border-gray-600 text-white"
                  title="Selecione o tipo de usuário"
                >
                  <option value="garcom">Garçom</option>
                  <option value="cozinheiro">Cozinheiro</option>
                  <option value="dono_bar">Dono do Bar</option>
                  <option value="sistema_admin">Administrador do Sistema</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={form.ativo}
                  onChange={handleChange}
                  className="mr-2"
                  title="Usuários ativos podem fazer login no sistema"
                />
                <span className="text-sm font-medium">
                  Usuário ativo
                  <span className="ml-1 text-gray-400" title="Usuários ativos podem fazer login no sistema">ⓘ</span>
                </span>
              </label>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex space-x-2">
              <AdminButton
                type="submit"
                variant="primary"
                disabled={loading}
                title={editingUsuario ? "Salvar as alterações do usuário" : "Criar o novo usuário"}
              >
                {loading ? 'Salvando...' : (editingUsuario ? 'Atualizar' : 'Criar')}
              </AdminButton>
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingUsuario(null);
                  resetForm();
                }}
                title="Cancelar e fechar o formulário"
              >
                Cancelar
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      )}

      {/* Lista de Usuários */}
      <AdminCard title={`Usuários (${usuarios.length})`}>
        {loading ? (
          <div className="text-center">Carregando usuários...</div>
        ) : usuarios.length === 0 ? (
          <div className="text-center text-gray-600">Nenhum usuário cadastrado</div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell>Usuário</AdminTableHeaderCell>
              <AdminTableHeaderCell>Tipo</AdminTableHeaderCell>
              <AdminTableHeaderCell>Status</AdminTableHeaderCell>
              <AdminTableHeaderCell>Data Criação</AdminTableHeaderCell>
              <AdminTableHeaderCell>Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <AdminTableCell>
                    <div>
                      <div className="text-sm font-medium">{usuario.nome}</div>
                      <div className="text-sm text-gray-500">{usuario.email}</div>
                      {usuario.id === adminUser.id && (
                        <div className="text-xs text-blue-600 font-medium">(Você)</div>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      usuario.tipo === 'sistema_admin'
                        ? 'bg-red-100 text-red-800'
                        : usuario.tipo === 'dono_bar'
                        ? 'bg-purple-100 text-purple-800'
                        : usuario.tipo === 'cozinheiro'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`} title={
                      usuario.tipo === 'sistema_admin' ? "Acesso total ao sistema" :
                      usuario.tipo === 'dono_bar' ? "Gerencia seu estabelecimento" :
                      usuario.tipo === 'cozinheiro' ? "Visualiza pedidos da cozinha" :
                      "Manipula pedidos"
                    }>
                      {usuario.tipo === 'sistema_admin' ? 'Sistema Admin' :
                       usuario.tipo === 'dono_bar' ? 'Dono do Bar' :
                       usuario.tipo === 'cozinheiro' ? 'Cozinheiro' :
                       'Garçom'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      usuario.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`} title={usuario.ativo ? "Usuário pode fazer login" : "Usuário bloqueado"}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-x-2">
                      <AdminButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleEdit(usuario)}
                        title="Editar este usuário"
                      >
                        Editar
                      </AdminButton>
                      
                      <AdminButton
                        variant={usuario.ativo ? "warning" : "success"}
                        size="sm"
                        onClick={() => handleToggleStatus(usuario.id, usuario.ativo)}
                        disabled={usuario.id === adminUser.id}
                        title={usuario.ativo ? "Desativar este usuário" : "Ativar este usuário"}
                      >
                        {usuario.ativo ? 'Desativar' : 'Ativar'}
                      </AdminButton>
                      
                      <AdminButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(usuario.id)}
                        disabled={usuario.id === adminUser.id}
                        title="Excluir este usuário permanentemente"
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