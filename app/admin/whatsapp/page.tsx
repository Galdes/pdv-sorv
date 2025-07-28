'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MessageCircle, Clock, User, Phone, Search } from 'lucide-react';
import Link from 'next/link';

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

  useEffect(() => {
    carregarConversas();
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarConversas, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarConversas = async () => {
    try {
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
        return 'bg-green-100 text-green-800';
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-800';
      case 'finalizada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const conversasFiltradas = conversas.filter(conversa =>
    conversa.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversa.numero_cliente.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageCircle className="text-green-600" size={32} />
            WhatsApp - Conversas
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie as conversas do WhatsApp e intervenha quando necessário
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={carregarConversas}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {conversasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto text-gray-400" size={64} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Nenhuma conversa encontrada
            </h3>
            <p className="mt-2 text-gray-600">
              {searchTerm ? 'Tente ajustar os termos de busca.' : 'As conversas aparecerão aqui quando clientes enviarem mensagens.'}
            </p>
          </div>
        ) : (
          conversasFiltradas.map((conversa) => (
            <Link
              key={conversa.id}
              href={`/admin/whatsapp/conversas/${conversa.id}`}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <User className="text-green-600" size={24} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {conversa.nome_cliente || 'Cliente'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversa.status)}`}>
                        {conversa.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone size={16} />
                        {formatarTelefone(conversa.numero_cliente)}
                      </div>
                      
                                             <div className="flex items-center gap-1">
                         <MessageCircle size={16} />
                         Conversa ativa
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock size={16} />
                    {formatarData(conversa.ultima_interacao)}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 