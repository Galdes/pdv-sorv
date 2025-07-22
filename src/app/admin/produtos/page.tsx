'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import type { Produto } from '../../../../lib/types';
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
} from '../../../../components/AdminLayout';

export default function AdminProdutosPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: '',
    imagem_url: '',
    ativo: true
  });

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (!userData) {
      router.push('/admin/login');
      return;
    }
    setAdminUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => {
    if (!adminUser) return;
    fetchProdutos();
  }, [adminUser]);

  const fetchProdutos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: produtos, error: errProdutos } = await supabase
        .from('produtos')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .order('nome');
      if (errProdutos) throw errProdutos;
      setProdutos(produtos || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const produtoData = {
        ...form,
        preco: parseFloat(form.preco),
        bar_id: adminUser.bar_id
      };

      if (editingProduto) {
        // Atualizar produto
        const { error: errUpdate } = await supabase
          .from('produtos')
          .update(produtoData)
          .eq('id', editingProduto.id);
        if (errUpdate) throw errUpdate;
      } else {
        // Criar novo produto
        const { error: errInsert } = await supabase
          .from('produtos')
          .insert(produtoData);
        if (errInsert) throw errInsert;
      }

      setShowForm(false);
      setEditingProduto(null);
      resetForm();
      fetchProdutos();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setForm({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: produto.preco.toString(),
      categoria: produto.categoria || '',
      imagem_url: produto.imagem_url || '',
      ativo: produto.ativo
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    setLoading(true);
    try {
      const { error: errDelete } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);
      if (errDelete) throw errDelete;
      fetchProdutos();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir produto');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      nome: '',
      descricao: '',
      preco: '',
      categoria: '',
      imagem_url: '',
      ativo: true
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  if (!adminUser) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <AdminLayout
      title="Gerenciar Produtos"
      subtitle="Adicione, edite ou remova produtos do menu"
      onBack={() => router.push('/admin/dashboard')}
      actions={
        <AdminButton
          variant="success"
          onClick={() => {
            setShowForm(true);
            setEditingProduto(null);
            resetForm();
          }}
          title="Adicionar um novo produto ao menu"
        >
          Novo Produto
        </AdminButton>
      }
    >
      {/* Formulário */}
      {showForm && (
        <AdminCard title={editingProduto ? 'Editar Produto' : 'Novo Produto'} className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Nome *"
                tooltip="Nome do produto que aparecerá no menu"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex: Cerveja Heineken"
                required
                title="Digite o nome do produto"
              />
              <AdminInput
                label="Preço *"
                tooltip="Preço em reais (use vírgula para centavos)"
                type="number"
                name="preco"
                value={form.preco}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                title="Digite o preço do produto (ex: 8.50)"
              />
            </div>
                          <AdminTextarea
                label="Descrição"
                tooltip="Descrição detalhada do produto (opcional)"
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                rows={3}
                placeholder="Ex: Cerveja puro malte 350ml"
                title="Descreva o produto para os clientes"
              />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Categoria"
                tooltip="Categoria para organizar os produtos (ex: Bebidas, Petiscos)"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                placeholder="Ex: Bebidas"
                title="Digite a categoria do produto"
              />
              <AdminInput
                label="URL da Imagem"
                tooltip="Link da imagem do produto (deve ser uma URL pública)"
                type="url"
                name="imagem_url"
                value={form.imagem_url}
                onChange={handleChange}
                placeholder="https://exemplo.com/imagem.jpg"
                title="Cole aqui o link da imagem do produto"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={form.ativo}
                  onChange={handleChange}
                  className="mr-2"
                  title="Produtos inativos não aparecem no menu para os clientes"
                />
                <span className="text-sm font-medium">
                  Produto ativo
                  <span className="ml-1 text-gray-400" title="Produtos ativos aparecem no menu, inativos ficam ocultos">ⓘ</span>
                </span>
              </label>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex space-x-2">
              <AdminButton
                type="submit"
                variant="primary"
                disabled={loading}
                title={editingProduto ? "Salvar as alterações do produto" : "Criar o novo produto"}
              >
                {loading ? 'Salvando...' : (editingProduto ? 'Atualizar' : 'Criar')}
              </AdminButton>
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduto(null);
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

      {/* Lista de Produtos */}
      <AdminCard title={`Produtos (${produtos.length})`}>
        {loading ? (
          <div className="text-center">Carregando produtos...</div>
        ) : produtos.length === 0 ? (
          <div className="text-center text-gray-600">Nenhum produto cadastrado</div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell>Produto</AdminTableHeaderCell>
              <AdminTableHeaderCell>Preço</AdminTableHeaderCell>
              <AdminTableHeaderCell>Categoria</AdminTableHeaderCell>
              <AdminTableHeaderCell>Status</AdminTableHeaderCell>
              <AdminTableHeaderCell>Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <AdminTableCell>
                    <div className="flex items-center">
                      {produto.imagem_url && (
                        <img
                          src={produto.imagem_url}
                          alt={produto.nome}
                          className="w-10 h-10 object-cover rounded mr-3"
                          title={`Imagem do ${produto.nome}`}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium">{produto.nome}</div>
                        {produto.descricao && (
                          <div className="text-sm text-gray-500">{produto.descricao}</div>
                        )}
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    R$ {produto.preco.toFixed(2)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {produto.categoria || '-'}
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      produto.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`} title={produto.ativo ? "Produto visível no menu" : "Produto oculto do menu"}>
                      {produto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-x-2">
                      <AdminButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleEdit(produto)}
                        title="Editar este produto"
                      >
                        Editar
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(produto.id)}
                        title="Excluir este produto permanentemente"
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