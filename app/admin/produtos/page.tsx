'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Produto, Categoria, Sabor } from '../../../lib/types';
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

export default function AdminProdutosPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria_id: '',
    sabores_ids: [] as string[], // Array para múltiplos sabores
    max_sabores: 1, // Número máximo de sabores que o cliente pode escolher
    imagem_url: '',
    ativo: true
  });

  // Log para verificar re-renderização
  console.log('=== RENDERIZAÇÃO DO COMPONENTE ===');
  console.log('form.max_sabores:', form.max_sabores);
  console.log('showForm:', showForm);
  console.log('editingProduto:', editingProduto?.nome);
  console.log('editingProduto ID:', editingProduto?.id);
  
  // Log para verificar produto na lista
  if (editingProduto) {
    const produtoNaLista = produtos.find(p => p.id === editingProduto.id);
    console.log('Produto na lista:', produtoNaLista?.nome, 'max_sabores:', produtoNaLista?.max_sabores, 'ID:', produtoNaLista?.id);
    
    // Verificar se há produtos duplicados
    const produtosComMesmoNome = produtos.filter(p => p.nome === editingProduto.nome);
    if (produtosComMesmoNome.length > 1) {
      console.log('⚠️ PRODUTOS DUPLICADOS ENCONTRADOS:', produtosComMesmoNome);
    }
  }

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
    fetchData();
  }, [adminUser]);

  // Log quando modal abre/fecha
  useEffect(() => {
    console.log('Modal status mudou:', showForm ? 'ABERTO' : 'FECHADO');
    if (showForm && editingProduto) {
      console.log('Modal aberto para produto:', editingProduto.nome, 'ID:', editingProduto.id);
    }
  }, [showForm, editingProduto]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar produtos diretamente da tabela (teste)
      const { data: produtos, error: errProdutos } = await supabase
        .from('produtos')
        .select(`
          *,
          categorias(nome)
        `)
        .eq('bar_id', adminUser.bar_id)
        .eq('ativo', true)
        .order('nome');
      
      if (errProdutos) throw errProdutos;
      
      console.log('Resposta bruta do Supabase (produtos):', produtos);
      
      // Adicionar categoria_nome aos produtos
      const produtosComCategoria = produtos?.map(produto => ({
        ...produto,
        categoria_nome: produto.categorias?.nome
      })) || [];
      
      setProdutos(produtosComCategoria);
      console.log('Produtos carregados (tabela direta):', produtosComCategoria);
      
      // Verificar produto específico
      const produto12Bolas = produtosComCategoria.find(p => p.nome === '12 bolas');
      if (produto12Bolas) {
        console.log('Produto 12 bolas encontrado:', produto12Bolas);
        console.log('max_sabores do produto 12 bolas:', produto12Bolas.max_sabores);
        console.log('Tipo do max_sabores:', typeof produto12Bolas.max_sabores);
        console.log('Produto completo (JSON):', JSON.stringify(produto12Bolas, null, 2));
        
        // Verificar se há outros produtos com mesmo nome
        const todosProdutos12Bolas = produtosComCategoria.filter(p => p.nome === '12 bolas');
        console.log('Todos os produtos com nome "12 bolas":', todosProdutos12Bolas);
      }

      // Buscar categorias
      const { data: categorias, error: errCategorias } = await supabase
        .from('categorias')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .eq('ativo', true)
        .order('nome');
      
      if (errCategorias) throw errCategorias;
      setCategorias(categorias || []);

      // Buscar sabores
      const { data: sabores, error: errSabores } = await supabase
        .from('sabores')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .eq('ativo', true)
        .order('nome');
      
      if (errSabores) throw errSabores;
      setSabores(sabores || []);

    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados');
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
        nome: form.nome,
        descricao: form.descricao,
        preco: parseFloat(form.preco),
        categoria_id: form.categoria_id || null,
        max_sabores: form.max_sabores, // Adicionar o campo max_sabores
        imagem_url: form.imagem_url,
        ativo: form.ativo,
        bar_id: adminUser.bar_id
      };

      console.log('Dados do produto a serem salvos:', produtoData);
      console.log('max_sabores:', produtoData.max_sabores, 'tipo:', typeof produtoData.max_sabores);

      let produtoId: string;

      if (editingProduto) {
        // Atualizar produto
        console.log('Atualizando produto:', editingProduto.id);
        const { data, error: errUpdate } = await supabase
          .from('produtos')
          .update(produtoData)
          .eq('id', editingProduto.id)
          .select(); // Adicionar .select() para ver a resposta
        
        console.log('Resposta do Supabase (update):', { data, error: errUpdate });
        
        if (errUpdate) {
          console.error('Erro ao atualizar:', errUpdate);
          throw errUpdate;
        }
        
        // Verificar se os dados foram realmente atualizados
        console.log('=== VERIFICAÇÃO DO UPDATE ===');
        console.log('Dados enviados para update:', produtoData);
        console.log('Dados retornados do update:', data);
        console.log('max_sabores enviado:', produtoData.max_sabores);
        console.log('max_sabores retornado:', data?.[0]?.max_sabores);
        
        produtoId = editingProduto.id;
      } else {
        // Criar novo produto
        console.log('Criando novo produto');
        const { data: newProduto, error: errInsert } = await supabase
          .from('produtos')
          .insert(produtoData)
          .select('id')
          .single();
        if (errInsert) {
          console.error('Erro ao inserir:', errInsert);
          throw errInsert;
        }
        produtoId = newProduto.id;
      }

      // Adicionar sabores ao produto usando a função RPC
      if (form.sabores_ids.length > 0) {
        const { error: errSabores } = await supabase
          .rpc('adicionar_sabores_ao_produto', {
            p_produto_id: produtoId,
            p_sabores_ids: form.sabores_ids
          });
        if (errSabores) throw errSabores;
      }

      // Forçar atualização imediata do estado
      if (editingProduto) {
        console.log('Atualizando estado local para produto:', editingProduto.id);
        console.log('Novos dados:', produtoData);
        
        // Atualizar o produto na lista local
        setProdutos(prevProdutos => {
          const novosProdutos = prevProdutos.map(produto => 
            produto.id === editingProduto.id 
              ? { 
                  ...produto, 
                  nome: produtoData.nome,
                  descricao: produtoData.descricao,
                  preco: produtoData.preco,
                  categoria_id: produtoData.categoria_id || undefined,
                  max_sabores: produtoData.max_sabores,
                  imagem_url: produtoData.imagem_url,
                  ativo: produtoData.ativo
                }
              : produto
          );
          
          console.log('Estado atualizado:', novosProdutos.find(p => p.id === editingProduto.id));
          return novosProdutos;
        });
      }

      // Recarregar dados para garantir sincronização
      // await fetchData(); // COMENTADO TEMPORARIAMENTE
      
      // Recarregar dados após um pequeno delay para garantir sincronização
      setTimeout(async () => {
        console.log('=== RECARREGANDO DADOS APÓS UPDATE ===');
        await fetchData();
      }, 500);
      
      console.log('=== UPDATE BEM-SUCEDIDO ===');
      console.log('Fechando formulário após sucesso...');
      
      // Fechar formulário apenas após sucesso
      setShowForm(false);
      setEditingProduto(null);
      // NÃO resetar form aqui - deixar para o próximo carregamento
      
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar produto');
      // NÃO fechar formulário em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (produto: Produto) => {
    try {
      console.log('=== INÍCIO handleEdit ===');
      console.log('Editando produto:', produto);
      console.log('max_sabores do produto:', produto.max_sabores);
      console.log('Tipo do max_sabores:', typeof produto.max_sabores);
      console.log('Produto completo (JSON):', JSON.stringify(produto, null, 2));
      
      // Buscar sabores do produto
      const { data: saboresProduto, error: errSabores } = await supabase
        .rpc('buscar_sabores_do_produto', {
          p_produto_id: produto.id
        });
      
      if (errSabores) throw errSabores;

      const saboresIds = saboresProduto?.map((s: any) => s.sabor_id) || [];

      const formData = {
        nome: produto.nome,
        descricao: produto.descricao || '',
        preco: produto.preco.toString(),
        categoria_id: produto.categoria_id || '',
        sabores_ids: saboresIds,
        max_sabores: produto.max_sabores || 1, // Carregar o max_sabores do produto
        imagem_url: produto.imagem_url || '',
        ativo: produto.ativo
      };

      console.log('Form data preparado:', formData);
      console.log('max_sabores no form data:', formData.max_sabores);
      console.log('Tipo do max_sabores no form data:', typeof formData.max_sabores);

      setEditingProduto(produto);
      setForm(formData);
      
      console.log('Form carregado com max_sabores:', produto.max_sabores || 1);
      console.log('=== FIM handleEdit ===');
      
      console.log('Abrindo modal...');
      setShowForm(true);
      console.log('Modal aberto, showForm deve ser true');
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar sabores do produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
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
      categoria_id: '',
      sabores_ids: [], // Resetar o array de sabores
      max_sabores: 1, // Resetar o max_sabores
      imagem_url: '',
      ativo: true
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    console.log('handleChange:', { name, value, type });
    
    // Log específico para max_sabores
    if (name === 'max_sabores') {
      console.log('=== ALTERAÇÃO MAX_SABORES ===');
      console.log('Valor anterior:', form.max_sabores);
      console.log('Novo valor:', value);
      console.log('Tipo do novo valor:', typeof value);
    }
    
    // Tratar campos numéricos
    if (type === 'number') {
      const numValue = value === '' ? 0 : parseFloat(value);
      console.log('Campo numérico:', { name, numValue });
      setForm({
        ...form,
        [name]: numValue
      });
    } else if (type === 'checkbox') {
      setForm({
        ...form,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setForm({
        ...form,
        [name]: value
      });
    }
    
    console.log('Form atualizado:', form);
  };

  const handleSaboresChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    
    // Validar limite máximo de sabores
    // if (selectedOptions.length > form.max_sabores) { // This line is removed
    //   alert(`Você pode selecionar no máximo ${form.max_sabores} sabor${form.max_sabores > 1 ? 'es' : ''} para este produto.`); // This line is removed
    //   return; // This line is removed
    // } // This line is removed
    
    setForm(prev => ({ ...prev, sabores_ids: selectedOptions }));
  };

  const handleVoltar = () => {
    router.push('/admin/dashboard');
  };

  if (!adminUser) {
    return <div>Carregando...</div>;
  }

  return (
    <AdminLayout 
      title="Produtos" 
      subtitle="Gerencie os produtos do seu estabelecimento"
      onBack={handleVoltar}
      actions={
        <AdminButton onClick={() => setShowForm(true)} variant="primary">
          Novo Produto
        </AdminButton>
      }
    >
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <AdminCard>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-300">Carregando produtos...</p>
          </div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell className="text-white font-bold">Produto</AdminTableHeaderCell>
              <AdminTableHeaderCell className="text-white font-bold">Preço</AdminTableHeaderCell>
              <AdminTableHeaderCell className="text-white font-bold">Categoria</AdminTableHeaderCell>
              <AdminTableHeaderCell className="text-white font-bold">Limite Sabores</AdminTableHeaderCell>
              <AdminTableHeaderCell className="text-white font-bold">Status</AdminTableHeaderCell>
              <AdminTableHeaderCell className="text-white font-bold">Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <AdminTableCell>
                    <div>
                      <div className="font-semibold text-white text-base">{produto.nome}</div>
                      {produto.descricao && (
                        <div className="text-sm text-gray-300 mt-1">
                          {produto.descricao.length > 50 
                            ? `${produto.descricao.substring(0, 50)}...` 
                            : produto.descricao}
                        </div>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="font-semibold text-green-600">
                      R$ {produto.preco.toFixed(2).replace('.', ',')}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-200 font-medium">
                      {produto.categoria_nome || '-'}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="text-sm text-gray-200 font-medium">
                      {produto.max_sabores || '-'}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      produto.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {produto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex space-x-2">
                      <AdminButton
                        onClick={() => {
                          console.log('=== CLICOU EM EDITAR ===');
                          console.log('Produto clicado:', produto);
                          handleEdit(produto);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Editar
                      </AdminButton>
                      <AdminButton
                        onClick={() => handleDelete(produto.id)}
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

        {produtos.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-300">Nenhum produto encontrado.</p>
            <AdminButton onClick={() => setShowForm(true)} variant="primary" className="mt-4">
              Criar primeiro produto
            </AdminButton>
          </div>
        )}
      </AdminCard>

      {/* Modal de Produto */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingProduto ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <AdminInput
                label="Nome"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                placeholder="Nome do produto"
              />
              
              <AdminTextarea
                label="Descrição"
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Descrição do produto (opcional)"
                rows={3}
              />
              
              <AdminInput
                label="Preço"
                name="preco"
                type="number"
                step="0.01"
                min="0"
                value={form.preco}
                onChange={handleChange}
                required
                placeholder="0.00"
              />

              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  name="categoria_id"
                  value={form.categoria_id}
                  onChange={handleChange}
                  className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white border-gray-300 text-gray-900"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Máximo de Sabores</label>
                <input
                  type="number"
                  name="max_sabores"
                  min="1"
                  max="20"
                  value={form.max_sabores}
                  onChange={handleChange}
                  required
                  placeholder="1"
                  className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white border-gray-300 text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Sabores (selecione múltiplos)</label>
                <select
                  name="sabores_ids"
                  multiple
                  value={form.sabores_ids}
                  onChange={handleSaboresChange}
                  className="block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white border-gray-300 text-gray-900 min-h-[120px]"
                >
                  {sabores.map((sabor) => (
                    <option key={sabor.id} value={sabor.id}>
                      {sabor.nome}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Pressione Ctrl (ou Cmd no Mac) para selecionar múltiplos sabores. Cliente pode escolher até {form.max_sabores} sabor{form.max_sabores > 1 ? 'es' : ''}
                </p>
              </div>
              
              <AdminInput
                label="URL da Imagem"
                name="imagem_url"
                value={form.imagem_url}
                onChange={handleChange}
                placeholder="https://exemplo.com/imagem.jpg"
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
                  Produto ativo
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <AdminButton
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : (editingProduto ? 'Atualizar' : 'Criar')}
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    console.log('=== BOTÃO CANCELAR CLICADO ===');
                    console.log('Isso NÃO deveria acontecer automaticamente!');
                    setShowForm(false);
                    setEditingProduto(null);
                    resetForm();
                  }}
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