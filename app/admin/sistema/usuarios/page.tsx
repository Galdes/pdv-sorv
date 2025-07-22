'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import type { Usuario, Bar } from '../../../../lib/types';
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
  tipo: string;
  bar_id: string;
  ativo: boolean;
}

export default function UsuariosSistemaPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [bares, setBares] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormUsuario>({
    nome: '',
    email: '',
    senha: '',
    tipo: 'garcom',
    bar_id: '',
    ativo: true
  });
  const [filtroEstabelecimento, setFiltroEstabelecimento] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');

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
    fetchData();
  }, [adminUser]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar usuários e bares em paralelo
      const [usuariosResult, baresResult] = await Promise.all([
        supabase.from('usuarios').select('*, bares(nome)').order('nome'),
        supabase.from('bares').select('*').order('nome')
      ]);

      if (usuariosResult.error) throw usuariosResult.error;
      if (baresResult.error) throw baresResult.error;

      setUsuarios(usuariosResult.data || []);
      setBares(baresResult.data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuários por estabelecimento e tipo
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchEstabelecimento = !filtroEstabelecimento || usuario.bar_id === filtroEstabelecimento;
    const matchTipo = !filtroTipo || usuario.tipo === filtroTipo;
    return matchEstabelecimento && matchTipo;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const userData: any = {
        nome: form.nome,
        email: form.email,
        tipo: form.tipo,
        bar_id: form.bar_id,
        ativo: form.ativo
      };

      // Se é uma edição e não há nova senha, não incluir senha_hash
      if (!editingUsuario || form.senha) {
        const bcrypt = (await import('bcryptjs')).default;
        userData.senha_hash = await bcrypt.hash(form.senha, 10);
      }

      if (editingUsuario) {
        // Atualizar usuário
        const { error: errUpdate } = await supabase
          .from('usuarios')
          .update(userData)
          .eq('id', editingUsuario.id);
        if (errUpdate) throw errUpdate;
      } else {
        // Criar novo usuário
        const { error: errInsert } = await supabase
          .from('usuarios')
          .insert(userData);
        if (errInsert) throw errInsert;
      }

      setShowForm(false);
      setEditingUsuario(null);
      resetForm();
      fetchData();
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
      senha: '', // Não mostrar senha atual
      tipo: usuario.tipo,
      bar_id: usuario.bar_id,
      ativo: usuario.ativo
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    setLoading(true);
    try {
      const { error: errDelete } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);
      if (errDelete) throw errDelete;
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir usuário');
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
      bar_id: '',
      ativo: true
    });
  };

  const handleBack = () => {
    router.push('/admin/sistema');
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'sistema_admin': return 'Administrador do Sistema';
      case 'dono_bar': return 'Dono do Bar';
      case 'garcom': return 'Garçom';
      case 'cozinheiro': return 'Cozinheiro';
      default: return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'sistema_admin': return 'bg-red-100 text-red-800';
      case 'dono_bar': return 'bg-purple-100 text-purple-800';
      case 'garcom': return 'bg-blue-100 text-blue-800';
      case 'cozinheiro': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!adminUser || adminUser.tipo !== 'sistema_admin') {
    return <div className="text-center p-4">Acesso negado. Apenas administradores do sistema podem acessar esta página.</div>;
  }

  return (
    <AdminLayout
      title="Usuários do Sistema"
      subtitle="Gerenciar todos os usuários"
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
            title="Adicionar novo usuário"
          >
            Novo Usuário
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
        <AdminCard title={editingUsuario ? "Editar Usuário" : "Novo Usuário"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <AdminInput
              label="Nome"
              tooltip="Nome completo do usuário"
              type="text"
              name="nome"
              value={form.nome}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, nome: e.target.value})}
              placeholder="Ex: João Silva"
              required
              title="Digite o nome do usuário"
            />
            
            <AdminInput
              label="Email"
              tooltip="Email único do usuário"
              type="email"
              name="email"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, email: e.target.value})}
              placeholder="Ex: joao@bar.com"
              required
              title="Digite o email do usuário"
            />
            
            <AdminInput
              label={editingUsuario ? "Nova Senha (opcional)" : "Senha"}
              tooltip={editingUsuario ? "Deixe em branco para manter a senha atual" : "Senha de acesso"}
              type="password"
              name="senha"
              value={form.senha}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, senha: e.target.value})}
              placeholder="••••••••"
              required={!editingUsuario}
              title="Digite a senha do usuário"
            />
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de Usuário
              </label>
              <select
                value={form.tipo}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, tipo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="dono_bar">Dono do Bar</option>
                <option value="garcom">Garçom</option>
                <option value="cozinheiro">Cozinheiro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Estabelecimento
              </label>
              <select
                value={form.bar_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, bar_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione um estabelecimento</option>
                {bares.map((bar) => (
                  <option key={bar.id} value={bar.id}>
                    {bar.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                checked={form.ativo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, ativo: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="ativo" className="text-sm">
                Usuário ativo
              </label>
            </div>
            
            <div className="flex gap-2">
              <AdminButton
                type="submit"
                variant="primary"
                disabled={loading}
                title="Salvar usuário"
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
                title="Cancelar operação"
              >
                Cancelar
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminCard title="Usuários Cadastrados">
        {/* Filtros */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Filtrar por Estabelecimento
              </label>
              <select
                value={filtroEstabelecimento}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroEstabelecimento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os estabelecimentos</option>
                {bares.map((bar) => (
                  <option key={bar.id} value={bar.id}>
                    {bar.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Filtrar por Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os tipos</option>
                <option value="sistema_admin">Administrador do Sistema</option>
                <option value="dono_bar">Dono do Bar</option>
                <option value="garcom">Garçom</option>
                <option value="cozinheiro">Cozinheiro</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <AdminButton
                variant="secondary"
                onClick={() => {
                  setFiltroEstabelecimento('');
                  setFiltroTipo('');
                }}
                disabled={!filtroEstabelecimento && !filtroTipo}
                title="Limpar todos os filtros"
              >
                Limpar Filtros
              </AdminButton>
            </div>
          </div>
          
          {(filtroEstabelecimento || filtroTipo) && (
            <div className="mt-2 text-sm text-gray-600">
              Mostrando {usuariosFiltrados.length} usuário(s) com os filtros aplicados
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {(filtroEstabelecimento || filtroTipo) ? 'Nenhum usuário encontrado com os filtros aplicados' : 'Nenhum usuário cadastrado'}
          </div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell>Nome</AdminTableHeaderCell>
              <AdminTableHeaderCell>Email</AdminTableHeaderCell>
              <AdminTableHeaderCell>Tipo</AdminTableHeaderCell>
              <AdminTableHeaderCell>Estabelecimento</AdminTableHeaderCell>
              <AdminTableHeaderCell>Status</AdminTableHeaderCell>
              <AdminTableHeaderCell>Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id}>
                  <AdminTableCell>
                    <div className="font-medium">{usuario.nome}</div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm">{usuario.email}</div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(usuario.tipo)}`}>
                      {getTipoLabel(usuario.tipo)}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-600">
                      {(usuario as any).bares?.nome || '-'}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      usuario.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex gap-1">
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(usuario)}
                        title="Editar usuário"
                      >
                        Editar
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(usuario.id)}
                        title="Excluir usuário"
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