'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Bar, FormBar, ConfigZAPI, FormZAPI } from '../../../lib/types';
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
  
  // Estados para Z-API
  const [zapiConfig, setZapiConfig] = useState<ConfigZAPI | null>(null);
  const [zapiForm, setZapiForm] = useState<FormZAPI>({
    instancia_id: '',
    token: '',
    ativo: false
  });
  const [zapiLoading, setZapiLoading] = useState(false);
  const [zapiStatus, setZapiStatus] = useState<'conectado' | 'desconectado' | 'reconectando'>('desconectado');
  const [testandoConexao, setTestandoConexao] = useState(false);
  const [reconectando, setReconectando] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

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

      // Buscar configurações da Z-API
      const { data: zapiData, error: errZapi } = await supabase
        .from('config_zapi')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .single();

      if (errZapi && errZapi.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações Z-API:', errZapi);
      }

      if (zapiData) {
        setZapiConfig(zapiData);
        setZapiForm({
          instancia_id: zapiData.instancia_id || '',
          token: zapiData.token || '',
          ativo: zapiData.ativo || false
        });
        setZapiStatus(zapiData.status_conexao || 'desconectado');
      } else {
        // Configuração padrão se não existir
        setZapiForm({
          instancia_id: '3E29A3AF9423B0EA10A44AAAADA6D328',
          token: '7D1DE18113C654C07EA765C7',
          ativo: true
        });
      }
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

  // Funções para Z-API
  const testarConexaoZAPI = async () => {
    setTestandoConexao(true);
    setDebugInfo(null);
    try {
      const response = await fetch('/api/zapi/testar-conexao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instancia_id: zapiForm.instancia_id,
          token: zapiForm.token
        })
      });

      if (response.ok) {
        const result = await response.json();
        setZapiStatus(result.status || 'desconectado');
        setDebugInfo(result.debug || null);
        
        if (result.status === 'conectado') {
          setSuccess('Conexão Z-API testada com sucesso! ✅');
        } else {
          setError(`Z-API está desconectada. Verifique as configurações.`);
        }
      } else {
        setZapiStatus('desconectado');
        setError('Falha na conexão com Z-API');
      }
    } catch (error) {
      setZapiStatus('desconectado');
      setError('Erro ao testar conexão Z-API');
    } finally {
      setTestandoConexao(false);
    }
  };

  const reconectarZAPI = async () => {
    setReconectando(true);
    try {
      const response = await fetch('/api/zapi/reconectar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instancia_id: zapiForm.instancia_id,
          token: zapiForm.token
        })
      });

      if (response.ok) {
        const result = await response.json();
        setZapiStatus(result.status || 'conectado');
        setSuccess('Z-API reconectada com sucesso!');
      } else {
        setZapiStatus('desconectado');
        setError('Falha ao reconectar Z-API');
      }
    } catch (error) {
      setZapiStatus('desconectado');
      setError('Erro ao reconectar Z-API');
    } finally {
      setReconectando(false);
    }
  };

  const salvarConfigZAPI = async () => {
    setZapiLoading(true);
    try {
      const { data, error } = await supabase
        .from('config_zapi')
        .upsert({
          bar_id: adminUser.bar_id,
          instancia_id: zapiForm.instancia_id,
          token: zapiForm.token,
          ativo: zapiForm.ativo,
          status_conexao: zapiStatus,
          ultima_verificacao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'bar_id'
        });

      if (error) throw error;
      
      setSuccess('Configurações Z-API salvas com sucesso!');
      fetchBarData(); // Recarregar dados
    } catch (error: any) {
      setError('Erro ao salvar configurações Z-API: ' + error.message);
    } finally {
      setZapiLoading(false);
    }
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

      <AdminCard title="Configurações Z-API (WhatsApp)">
        <div className="space-y-4">
          {/* Status da Conexão */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Status da Conexão:</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                zapiStatus === 'conectado' ? 'bg-green-100 text-green-800' :
                zapiStatus === 'reconectando' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {zapiStatus === 'conectado' ? '🟢 Conectado' :
                 zapiStatus === 'reconectando' ? '🟡 Reconectando' :
                 '🔴 Desconectado'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Última verificação: {zapiConfig?.ultima_verificacao ? 
                new Date(zapiConfig.ultima_verificacao).toLocaleString('pt-BR') : 
                'Nunca'}
            </div>
          </div>

          {/* Campos de Configuração */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              label="ID da Instância"
              tooltip="ID da instância Z-API"
              type="text"
              value={zapiForm.instancia_id}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZapiForm({...zapiForm, instancia_id: e.target.value})}
              placeholder="Ex: 3E29A3AF9423B0EA10A44AAAADA6D328"
              title="Digite o ID da instância Z-API"
            />
            
            <AdminInput
              label="Token"
              tooltip="Token de autenticação Z-API"
              type="password"
              value={zapiForm.token}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZapiForm({...zapiForm, token: e.target.value})}
              placeholder="Ex: 7D1DE18113C654C07EA765C7"
              title="Digite o token Z-API"
            />
          </div>

          {/* Checkbox Ativo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="zapi_ativo"
              checked={zapiForm.ativo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZapiForm({...zapiForm, ativo: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="zapi_ativo" className="ml-2 text-sm text-gray-700">
              Z-API ativa
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3 pt-4">
            <AdminButton
              type="button"
              variant="primary"
              onClick={testarConexaoZAPI}
              disabled={testandoConexao}
              title="Testar conexão com Z-API"
            >
              {testandoConexao ? 'Testando...' : '🧪 Testar Conexão'}
            </AdminButton>
            
            <AdminButton
              type="button"
              variant="warning"
              onClick={reconectarZAPI}
              disabled={reconectando || zapiStatus === 'conectado'}
              title="Forçar reconexão da Z-API"
            >
              {reconectando ? 'Reconectando...' : '🔄 Reconectar'}
            </AdminButton>
            
            <AdminButton
              type="button"
              variant="success"
              onClick={salvarConfigZAPI}
              disabled={zapiLoading}
              title="Salvar configurações Z-API"
            >
              {zapiLoading ? 'Salvando...' : '💾 Salvar Configurações'}
            </AdminButton>
          </div>

          {/* Informações de Debug */}
          {debugInfo && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">🔍 Informações de Debug:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Status Detectado:</strong> {debugInfo.isConnected ? 'Conectado' : 'Desconectado'}</div>
                {debugInfo.errorInfo && (
                  <div><strong>Erro:</strong> {debugInfo.errorInfo}</div>
                )}
                {debugInfo.hasStatusData && (
                  <div><strong>Dados de Status:</strong> Disponível</div>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    Ver dados completos
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Informações:</strong> A Z-API é usada para envio e recebimento de mensagens WhatsApp. 
              Em caso de problemas de conexão, use o botão "Reconectar" para restabelecer a comunicação.
            </p>
          </div>
        </div>
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