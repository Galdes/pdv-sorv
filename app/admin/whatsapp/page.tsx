'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, RefreshCw, MessageCircle, User, Phone, Clock } from 'lucide-react';
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

  useEffect(() => {
    carregarConversas();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarConversas, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarConversas = async () => {
    try {
      // Buscar conversas com contagem de mensagens não lidas
      const { data, error } = await supabase
        .from('conversas_whatsapp')
        .select(`
          *,
          mensagens_nao_lidas:mensagens_whatsapp(count)
        `)
        .eq('mensagens_whatsapp.tipo', 'recebida')
        .eq('mensagens_whatsapp.lida', false)
        .order('ultima_interacao', { ascending: false });

      if (error) throw error;

      // Processar dados para incluir contagem de não lidas
      const conversasProcessadas = data?.map(conversa => ({
        ...conversa,
        mensagens_nao_lidas: conversa.mensagens_nao_lidas?.[0]?.count || 0
      })) || [];

      setConversas(conversasProcessadas);
      
      // Calcular estatísticas
      setTotalConversas(conversasProcessadas.length);
      setConversasAtivas(conversasProcessadas.filter(c => c.status === 'ativa').length);
      setAguardando(conversasProcessadas.filter(c => c.status === 'aguardando').length);
      setTotalNaoLidas(conversasProcessadas.reduce((total, c) => total + (c.mensagens_nao_lidas || 0), 0));
      
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
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
              <Link key={conversa.id} href={`/admin/whatsapp/conversas/${conversa.id}`}>
                <AdminCard className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
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
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock size={16} />
                      <span>{formatarData(conversa.ultima_interacao)}</span>
                    </div>
                  </div>
                </AdminCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 