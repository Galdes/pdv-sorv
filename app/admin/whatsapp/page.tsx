'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, RefreshCw, MessageCircle, User, Phone, Clock, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import AdminLayout, { AdminCard, AdminButton } from '../../../components/AdminLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Conversa {
  id: string;
  numero_cliente: string;
  nome_cliente: string;
  status: string;
  ultima_interacao: string;
  mensagens_nao_lidas?: number;
}

export default function WhatsAppPage() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalConversas, setTotalConversas] = useState(0);
  const [conversasAtivas, setConversasAtivas] = useState(0);
  const [aguardando, setAguardando] = useState(0);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversaParaExcluir, setConversaParaExcluir] = useState<Conversa | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    carregarConversas();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarConversas, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarConversas = async () => {
    try {
      // Buscar todas as conversas primeiro
      const { data: todasConversas, error: errorTodas } = await supabase
        .from('conversas_whatsapp')
        .select('*')
        .order('ultima_interacao', { ascending: false });

      if (errorTodas) throw errorTodas;

      // Para cada conversa, buscar contagem de mensagens não lidas
      const conversasProcessadas = await Promise.all(
        todasConversas?.map(async (conversa) => {
          const { count: mensagensNaoLidas } = await supabase
            .from('mensagens_whatsapp')
            .select('*', { count: 'exact', head: true })
            .eq('conversa_id', conversa.id)
            .eq('tipo', 'recebida')
            .eq('lida', false);

          return {
            ...conversa,
            mensagens_nao_lidas: mensagensNaoLidas || 0
          };
        }) || []
      );

      // Ordenar: primeiro conversas com mensagens não lidas, depois por última interação
      const conversasOrdenadas = conversasProcessadas.sort((a, b) => {
        // Se uma tem mensagens não lidas e a outra não, priorizar a que tem
        if (a.mensagens_nao_lidas > 0 && b.mensagens_nao_lidas === 0) return -1;
        if (a.mensagens_nao_lidas === 0 && b.mensagens_nao_lidas > 0) return 1;
        
        // Se ambas têm ou não têm mensagens não lidas, ordenar por última interação
        return new Date(b.ultima_interacao).getTime() - new Date(a.ultima_interacao).getTime();
      });

      setConversas(conversasOrdenadas);
      
      // Calcular estatísticas
      setTotalConversas(conversasOrdenadas.length);
      setConversasAtivas(conversasOrdenadas.filter(c => c.status === 'ativa').length);
      setAguardando(conversasOrdenadas.filter(c => c.status === 'aguardando').length);
      setTotalNaoLidas(conversasOrdenadas.reduce((total, c) => total + (c.mensagens_nao_lidas || 0), 0));
      
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const excluirConversa = async () => {
    if (!conversaParaExcluir) return;

    setExcluindo(true);
    try {
      const response = await fetch(`/api/whatsapp/excluir-conversa?id=${conversaParaExcluir.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir conversa');
      }

      const result = await response.json();
      console.log('Conversa excluída:', result);

      // Recarregar conversas
      await carregarConversas();
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      alert('Erro ao excluir conversa. Tente novamente.');
    } finally {
      setExcluindo(false);
      setShowDeleteModal(false);
      setConversaParaExcluir(null);
    }
  };

  const formatarTelefone = (telefone: string) => {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'finalizada':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa':
        return '🟢';
      case 'aguardando':
        return '🟡';
      case 'finalizada':
        return '⚫';
      default:
        return '🔵';
    }
  };

  const conversasFiltradas = conversas.filter(conversa =>
    conversa.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversa.numero_cliente.includes(searchTerm)
  );

  if (loading) {
    return (
      <AdminLayout title="WhatsApp">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-green-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 font-medium">Carregando conversas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="WhatsApp">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-2xl shadow-lg">
              <MessageCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                WhatsApp - Conversas
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Gerencie as conversas do WhatsApp e intervenha quando necessário
              </p>
            </div>
          </div>
          
          <AdminButton
            variant="secondary"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            ← Voltar
          </AdminButton>
        </div>

        {/* Search and Refresh */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <AdminButton
            variant="primary"
            onClick={carregarConversas}
            className="flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Atualizar
          </AdminButton>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <AdminCard className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {totalConversas}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Total de Conversas
            </div>
          </AdminCard>
          
          <AdminCard className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {conversasAtivas}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Conversas Ativas
            </div>
          </AdminCard>
          
          <AdminCard className="text-center">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {aguardando}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Aguardando
            </div>
          </AdminCard>
          
          <AdminCard className="text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {totalNaoLidas}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Não Lidas
            </div>
          </AdminCard>
        </div>

        {/* Conversations List */}
        {conversasFiltradas.length === 0 ? (
          <AdminCard className="text-center py-12">
            <MessageCircle className="mx-auto text-gray-400 dark:text-gray-500" size={64} />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Nenhuma conversa encontrada
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {searchTerm ? 'Tente ajustar sua busca' : 'As conversas aparecerão aqui quando houver atividade'}
            </p>
          </AdminCard>
        ) : (
          <div className="space-y-4">
            {conversasFiltradas.map((conversa) => (
              <AdminCard key={conversa.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <Link href={`/admin/whatsapp/conversas/${conversa.id}`} className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 dark:bg-green-900 p-3 rounded-2xl shadow-lg">
                        <User className="text-green-600 dark:text-green-400" size={24} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {conversa.nome_cliente || 'Cliente'}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(conversa.status)}`}>
                            {getStatusIcon(conversa.status)} {conversa.status}
                          </span>
                          {(conversa.mensagens_nao_lidas || 0) > 0 && (
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              {conversa.mensagens_nao_lidas} nova{(conversa.mensagens_nao_lidas || 0) > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mt-1">
                          <div className="flex items-center gap-1">
                            <Phone size={16} className="text-green-600 dark:text-green-400" />
                            <span className="font-medium">{formatarTelefone(conversa.numero_cliente)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle size={16} className="text-green-600 dark:text-green-400" />
                            <span>Conversa ativa</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock size={16} />
                      <span>{formatarData(conversa.ultima_interacao)}</span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setConversaParaExcluir(conversa);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors text-red-600 dark:text-red-400"
                      title="Excluir conversa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </AdminCard>
            ))}
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteModal && conversaParaExcluir && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                  <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Excluir Conversa
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Tem certeza que deseja excluir a conversa com{' '}
                  <span className="font-semibold">{conversaParaExcluir.nome_cliente || 'este cliente'}</span>?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Todas as mensagens serão excluídas permanentemente.
                </p>
              </div>
              
              <div className="flex gap-3">
                <AdminButton
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConversaParaExcluir(null);
                  }}
                  disabled={excluindo}
                  className="flex-1"
                >
                  Cancelar
                </AdminButton>
                
                <AdminButton
                  variant="danger"
                  onClick={excluirConversa}
                  disabled={excluindo}
                  className="flex-1 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  {excluindo ? 'Excluindo...' : 'Excluir'}
                </AdminButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 