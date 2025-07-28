'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { MessageCircle, Clock, User, Phone, Search, RefreshCw, ArrowLeft } from 'lucide-react';
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
  created_at: string;
}

export default function WhatsAppPage() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    carregarConversas();
    const interval = setInterval(carregarConversas, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarConversas = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('conversas_whatsapp')
        .select('*')
        .order('ultima_interacao', { ascending: false });

      if (error) throw error;
      setConversas(data || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const conversasAtivas = conversas.filter(c => c.status === 'ativa').length;
  const conversasAguardando = conversas.filter(c => c.status === 'aguardando').length;

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
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">💬 WhatsApp - Conversas</h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Gerencie as conversas do WhatsApp e intervenha quando necessário</p>
            </div>
            <AdminButton
              variant="secondary"
              onClick={() => router.push('/admin/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Voltar
            </AdminButton>
          </div>
        </div>

        {/* Filtros */}
        <AdminCard className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-black dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            <AdminButton
              variant="primary"
              onClick={carregarConversas}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 py-3"
            >
              <RefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={18} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </AdminButton>
          </div>
        </AdminCard>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AdminCard className="text-center py-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{conversas.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total de Conversas</div>
          </AdminCard>

          <AdminCard className="text-center py-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{conversasAtivas}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Conversas Ativas</div>
          </AdminCard>

          <AdminCard className="text-center py-6">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{conversasAguardando}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Aguardando</div>
          </AdminCard>
        </div>

        {/* Lista de conversas */}
        <div className="space-y-6">
          {conversasFiltradas.length === 0 ? (
            <AdminCard>
              <div className="text-center py-16">
                <MessageCircle className="mx-auto text-gray-400 dark:text-gray-500" size={72} />
                <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-white mb-3">
                  Nenhuma conversa encontrada
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {searchTerm ? 'Tente ajustar os termos de busca.' : 'As conversas aparecerão aqui quando clientes enviarem mensagens.'}
                </p>
              </div>
            </AdminCard>
          ) : (
            conversasFiltradas.map((conversa) => (
              <Link
                key={conversa.id}
                href={`/admin/whatsapp/conversas/${conversa.id}`}
                className="group block"
              >
                <AdminCard className="hover:shadow-xl transition-all duration-300 cursor-pointer group-hover:border-green-300 dark:group-hover:border-green-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-2xl shadow-lg">
                          <User className="text-green-600 dark:text-green-400" size={28} />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg border-2 border-green-200 dark:border-green-700">
                          <span className="text-xs">{getStatusIcon(conversa.status)}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            {conversa.nome_cliente || 'Cliente'}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(conversa.status)}`}>
                            {conversa.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <Phone size={18} className="text-green-600 dark:text-green-400" />
                            <span className="font-medium">{formatarTelefone(conversa.numero_cliente)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MessageCircle size={18} className="text-green-600 dark:text-green-400" />
                            <span className="font-medium">Conversa ativa</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock size={18} className="text-green-600 dark:text-green-400" />
                        <span className="font-medium">{formatarData(conversa.ultima_interacao)}</span>
                      </div>
                    </div>
                  </div>
                </AdminCard>
              </Link>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 