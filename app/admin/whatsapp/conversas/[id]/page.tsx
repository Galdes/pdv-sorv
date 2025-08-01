'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Send, User, MessageCircle, Clock, Phone, MoreVertical, Trash2, AlertTriangle, UserCheck, UserX } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout, { AdminCard, AdminButton } from '../../../../../components/AdminLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Mensagem {
  id: string;
  tipo: 'recebida' | 'enviada' | 'sistema';
  conteudo: string;
  timestamp: string;
  lida?: boolean;
}

interface Conversa {
  id: string;
  numero_cliente: string;
  nome_cliente: string;
  status: string;
  ultima_interacao: string;
  modo_atendimento?: string;
  atendente_nome?: string;
  assumido_em?: string;
  bloqueado_ate?: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversaId = params.id as string;
  
  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [assumindo, setAssumindo] = useState(false);

  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    carregarConversa();
    carregarMensagens();
    
    // Atualizar mensagens a cada 10 segundos
    const interval = setInterval(carregarMensagens, 10000);
    return () => clearInterval(interval);
  }, [conversaId]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const carregarConversa = async () => {
    try {
      const { data, error } = await supabase
        .from('conversas_whatsapp')
        .select('*')
        .eq('id', conversaId)
        .single();

      if (error) throw error;
      setConversa(data);
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
    }
  };

  const carregarMensagens = async () => {
    try {
      const { data, error } = await supabase
        .from('mensagens_whatsapp')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('timestamp', { ascending: true })
        .order('id', { ascending: true }); // Ordenar também por ID para garantir ordem

      if (error) throw error;
      setMensagens(data || []);
      
      // Marcar mensagens recebidas como lidas
      if (data && data.length > 0) {
        const mensagensRecebidas = data.filter(m => m.tipo === 'recebida' && !m.lida);
        if (mensagensRecebidas.length > 0) {
          await supabase
            .from('mensagens_whatsapp')
            .update({ lida: true })
            .in('id', mensagensRecebidas.map(m => m.id));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !conversa) return;

    setEnviando(true);
    try {
      // Enviar via Z-API (N8N salvará a mensagem via webhook)
      const response = await fetch('/api/whatsapp/enviar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero_cliente: conversa.numero_cliente,
          mensagem: novaMensagem
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      // Atualizar conversa
      await supabase
        .from('conversas_whatsapp')
        .update({
          ultima_interacao: new Date().toISOString(),
          status: 'ativa'
        })
        .eq('id', conversaId);

      setNovaMensagem('');
      carregarMensagens();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const assumirConversa = async () => {
    if (!conversa) return;

    setAssumindo(true);
    try {
      const response = await fetch('/api/whatsapp/assumir-conversa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversa_id: conversaId,
          acao: 'assumir',
          atendente_nome: 'Atendente' // Você pode personalizar isso
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao assumir conversa');
      }

      const result = await response.json();
      console.log('Conversa assumida:', result);

      // Recarregar conversa para atualizar status
      await carregarConversa();
    } catch (error) {
      console.error('Erro ao assumir conversa:', error);
      alert('Erro ao assumir conversa. Tente novamente.');
    } finally {
      setAssumindo(false);
    }
  };



  const excluirConversa = async () => {
    if (!conversa) return;

    setExcluindo(true);
    try {
      const response = await fetch(`/api/whatsapp/excluir-conversa?id=${conversaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir conversa');
      }

      const result = await response.json();
      console.log('Conversa excluída:', result);

      // Redirecionar para a lista de conversas
      router.push('/admin/whatsapp');
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      alert('Erro ao excluir conversa. Tente novamente.');
    } finally {
      setExcluindo(false);
      setShowDeleteModal(false);
    }
  };

  const formatarTelefone = (telefone: string) => {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatarHora = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
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

  const getModoAtendimentoColor = (modo: string) => {
    switch (modo) {
      case 'humano':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'bot':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <AdminLayout title="WhatsApp">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-green-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 font-medium">Carregando conversa...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!conversa) {
    return (
      <AdminLayout title="WhatsApp">
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">Conversa não encontrada</h3>
        </div>
      </AdminLayout>
    );
  }

  const isModoHumano = conversa.modo_atendimento === 'humano';
  const tempoRestante = conversa.bloqueado_ate ? Math.max(0, new Date(conversa.bloqueado_ate).getTime() - new Date().getTime()) : 0;
  const minutosRestantes = Math.ceil(tempoRestante / (1000 * 60));

  return (
    <AdminLayout title="WhatsApp">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <AdminCard className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AdminButton
                variant="secondary"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Voltar
              </AdminButton>
              
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-2xl shadow-lg">
                  <User className="text-green-600 dark:text-green-400" size={24} />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {conversa.nome_cliente || 'Cliente'}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Phone size={16} className="text-green-600 dark:text-green-400" />
                    <span className="font-medium">{formatarTelefone(conversa.numero_cliente)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(conversa.status)}`}>
                {conversa.status}
              </span>
              
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getModoAtendimentoColor(conversa.modo_atendimento || 'bot')}`}>
                {conversa.modo_atendimento === 'humano' ? '👤 Humano' : '🤖 Bot'}
              </span>
              
              {isModoHumano && conversa.atendente_nome && (
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  Atendido por: {conversa.atendente_nome}
                </span>
              )}
              
              {isModoHumano && minutosRestantes > 0 && (
                <span className="text-xs text-orange-600 dark:text-orange-400">
                  {minutosRestantes}min restantes
                </span>
              )}
              
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors text-red-600 dark:text-red-400"
                title="Excluir conversa"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </AdminCard>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {mensagens.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="mx-auto text-gray-400 dark:text-gray-500" size={64} />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Nenhuma mensagem ainda
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Inicie a conversa enviando uma mensagem
                </p>
              </div>
            ) : (
              mensagens.map((mensagem) => {
                console.log('Renderizando mensagem:', {
                  id: mensagem.id,
                  tipo: mensagem.tipo,
                  conteudo: mensagem.conteudo,
                  timestamp: mensagem.timestamp
                });
                
                return (
                  <div
                    key={mensagem.id}
                    className={`flex ${mensagem.tipo === 'recebida' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        mensagem.tipo === 'recebida'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : mensagem.tipo === 'enviada'
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                      }`}
                    >
                      <div className="text-sm leading-relaxed">{mensagem.conteudo}</div>
                      <div className={`text-xs mt-2 flex items-center gap-1 ${
                        mensagem.tipo === 'recebida' 
                          ? 'text-gray-500 dark:text-gray-400' 
                          : 'text-green-100'
                      }`}>
                        <Clock size={12} />
                        {formatarHora(mensagem.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={enviando}
              />
              
              <AdminButton
                variant="primary"
                onClick={enviarMensagem}
                disabled={!novaMensagem.trim() || enviando}
                className="flex items-center gap-2 px-6"
              >
                <Send size={18} />
                {enviando ? 'Enviando...' : 'Enviar'}
              </AdminButton>
              
              {/* Botão Assumir (apenas quando não está em modo humano) */}
              {!isModoHumano && (
                <AdminButton
                  variant="secondary"
                  onClick={assumirConversa}
                  disabled={assumindo}
                  className="flex items-center gap-2 px-4"
                >
                  <UserCheck size={18} />
                  {assumindo ? 'Assumindo...' : 'Assumir'}
                </AdminButton>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteModal && (
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
                  <span className="font-semibold">{conversa.nome_cliente || 'este cliente'}</span>?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Todas as mensagens serão excluídas permanentemente.
                </p>
              </div>
              
              <div className="flex gap-3">
                <AdminButton
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
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