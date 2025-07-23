'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { supabase } from '../../../lib/supabaseClient';
import type { Mesa } from '../../../lib/types';
import AdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminInput, 
  AdminTable, 
  AdminTableHeader, 
  AdminTableHeaderCell, 
  AdminTableBody, 
  AdminTableCell 
} from '../../../components/AdminLayout';

export default function AdminMesasPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [form, setForm] = useState({
    numero: '',
    capacidade: '',
    descricao: '',
    ativa: true
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
    fetchMesas();
  }, [adminUser]);

  const fetchMesas = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: mesas, error: errMesas } = await supabase
        .from('mesas')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .order('numero');
      if (errMesas) throw errMesas;
      setMesas(mesas || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar mesas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const mesaData = {
        ...form,
        numero: parseInt(form.numero),
        capacidade: parseInt(form.capacidade),
        bar_id: adminUser.bar_id
      };

      if (editingMesa) {
        // Atualizar mesa
        const { error: errUpdate } = await supabase
          .from('mesas')
          .update(mesaData)
          .eq('id', editingMesa.id);
        if (errUpdate) throw errUpdate;
      } else {
        // Criar nova mesa
        const { error: errInsert } = await supabase
          .from('mesas')
          .insert(mesaData);
        if (errInsert) throw errInsert;
      }

      setShowForm(false);
      setEditingMesa(null);
      resetForm();
      fetchMesas();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar mesa');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mesa: Mesa) => {
    setEditingMesa(mesa);
    setForm({
      numero: mesa.numero.toString(),
      capacidade: mesa.capacidade.toString(),
      descricao: mesa.descricao || '',
      ativa: mesa.ativa
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mesa? Isso também excluirá todas as comandas associadas.')) return;
    
    setLoading(true);
    try {
      const { error: errDelete } = await supabase
        .from('mesas')
        .delete()
        .eq('id', id);
      if (errDelete) throw errDelete;
      fetchMesas();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir mesa');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      numero: '',
      capacidade: '',
      descricao: '',
      ativa: true
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const generateQRCode = (mesaId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/abrir-comanda/${mesaId}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  if (!adminUser) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <AdminLayout
      title="Gerenciar Mesas"
      subtitle="Configure mesas e gere QR Codes para abertura de comandas"
      onBack={() => router.push('/admin/dashboard')}
      actions={
        <div className="flex space-x-2">
          <AdminButton
            variant="primary"
            onClick={() => router.push('/admin/mesas/qr-codes')}
            title="Visualizar e imprimir QR Codes"
          >
            QR Codes
          </AdminButton>
          <AdminButton
            variant="success"
            onClick={() => {
              setShowForm(true);
              setEditingMesa(null);
              resetForm();
            }}
            title="Adicionar uma nova mesa ao estabelecimento"
          >
            Nova Mesa
          </AdminButton>
        </div>
      }
    >
      {/* Formulário */}
      {showForm && (
        <AdminCard title={editingMesa ? 'Editar Mesa' : 'Nova Mesa'} className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Número da Mesa *"
                tooltip="Número identificador da mesa"
                type="number"
                name="numero"
                value={form.numero}
                onChange={handleChange}
                placeholder="1"
                min="1"
                required
                title="Digite o número da mesa"
              />
              <AdminInput
                label="Capacidade *"
                tooltip="Número máximo de pessoas que cabem na mesa"
                type="number"
                name="capacidade"
                value={form.capacidade}
                onChange={handleChange}
                placeholder="4"
                min="1"
                required
                title="Digite a capacidade da mesa"
              />
            </div>
            <AdminInput
              label="Descrição"
              tooltip="Descrição adicional da mesa (ex: 'Mesa na varanda')"
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Ex: Mesa na varanda"
              title="Digite uma descrição para a mesa"
            />
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="ativa"
                  checked={form.ativa}
                  onChange={handleChange}
                  className="mr-2"
                  title="Mesas ativas podem receber comandas, inativas ficam desabilitadas"
                />
                <span className="text-sm font-medium">
                  Mesa ativa
                  <span className="ml-1 text-gray-400" title="Mesas ativas podem receber comandas, inativas ficam desabilitadas">ⓘ</span>
                </span>
              </label>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex space-x-2">
              <AdminButton
                type="submit"
                variant="primary"
                disabled={loading}
                title={editingMesa ? "Salvar as alterações da mesa" : "Criar a nova mesa"}
              >
                {loading ? 'Salvando...' : (editingMesa ? 'Atualizar' : 'Criar')}
              </AdminButton>
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingMesa(null);
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

      {/* Lista de Mesas */}
      <AdminCard title={`Mesas (${mesas.length})`}>
        {loading ? (
          <div className="text-center">Carregando mesas...</div>
        ) : mesas.length === 0 ? (
          <div className="text-center text-gray-600">Nenhuma mesa cadastrada</div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableHeaderCell>Mesa</AdminTableHeaderCell>
              <AdminTableHeaderCell>Capacidade</AdminTableHeaderCell>
              <AdminTableHeaderCell>Status</AdminTableHeaderCell>
              <AdminTableHeaderCell>QR Code</AdminTableHeaderCell>
              <AdminTableHeaderCell>Ações</AdminTableHeaderCell>
            </AdminTableHeader>
            <AdminTableBody>
              {mesas.map((mesa) => (
                <tr key={mesa.id}>
                  <AdminTableCell>
                    <div>
                      <div className="text-sm font-medium">Mesa {mesa.numero}</div>
                      {mesa.descricao && (
                        <div className="text-sm text-gray-500">{mesa.descricao}</div>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    {mesa.capacidade} pessoas
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      mesa.ativa 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`} title={mesa.ativa ? "Mesa disponível para comandas" : "Mesa desabilitada"}>
                      {mesa.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-white p-1 rounded border">
                          <QRCode
                            value={generateQRCode(mesa.id)}
                            size={40}
                            level="M"
                            title={`QR Code da Mesa ${mesa.numero}`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => copyToClipboard(generateQRCode(mesa.id))}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                          title="Copiar link do QR Code"
                        >
                          Copiar Link
                        </button>
                        <button
                          onClick={() => {
                            const link = generateQRCode(mesa.id);
                            window.open(link, '_blank');
                          }}
                          className="text-green-600 hover:text-green-900 text-xs"
                          title="Testar link do QR Code"
                        >
                          Testar Link
                        </button>
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="space-x-2">
                      <AdminButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleEdit(mesa)}
                        title="Editar esta mesa"
                      >
                        Editar
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(mesa.id)}
                        title="Excluir esta mesa permanentemente"
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

      {/* QR Codes para Impressão */}
      <AdminCard title="QR Codes para Impressão" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mesas.map((mesa) => (
            <div key={mesa.id} className="text-center p-4 border rounded-lg">
              <div className="mb-2">
                <h3 className="font-semibold">Mesa {mesa.numero}</h3>
                {mesa.descricao && (
                  <p className="text-sm text-gray-600">{mesa.descricao}</p>
                )}
              </div>
              <div className="flex justify-center mb-3">
                <div className="bg-white p-3 rounded border">
                  <QRCode
                    value={generateQRCode(mesa.id)}
                    size={120}
                    level="M"
                    title={`QR Code da Mesa ${mesa.numero}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <AdminButton
                  variant="primary"
                  size="sm"
                  onClick={() => copyToClipboard(generateQRCode(mesa.id))}
                  title="Copiar link da mesa"
                >
                  Copiar Link
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const link = generateQRCode(mesa.id);
                    window.open(link, '_blank');
                  }}
                  title="Testar link da mesa"
                >
                  Testar Link
                </AdminButton>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Informações sobre QR Codes */}
      <AdminCard title="Como usar os QR Codes" className="mt-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">📱 Para os Clientes:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Cliente escaneia o QR Code da mesa</li>
              <li>• Preenche nome (opcional) e telefone (obrigatório)</li>
              <li>• Acessa o menu digital da mesa</li>
              <li>• Faz pedidos individualmente</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">🖨️ Para Imprimir:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use a seção "QR Codes para Impressão" acima</li>
              <li>• Imprima cada QR Code individualmente</li>
              <li>• Cole na mesa correspondente</li>
              <li>• Ou use a função "Testar Link" para verificar</li>
            </ul>
          </div>
        </div>
      </AdminCard>
    </AdminLayout>
  );
} 