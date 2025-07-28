'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Send, User, MessageCircle, Clock, Phone } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Mensagem {
  id: string;
  tipo: 'recebida' | 'enviada' | 'sistema';
  conteudo: string;
  timestamp: string;
}

interface Conversa {
  id: string;
  numero_cliente: string;
  nome_cliente: string;
  status: string;
  ultima_interacao: string;
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
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setMensagens(data || []);
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
      // 1. Salvar mensagem no banco
      const { error: errorMensagem } = await supabase
        .from('mensagens_whatsapp')
        .insert({
          conversa_id: conversaId,
          tipo: 'enviada',
          conteudo: novaMensagem,
          timestamp: new Date().toISOString()
        });

      if (errorMensagem) throw errorMensagem;

      // 2. Enviar via Z-API
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

      // 3. Atualizar conversa
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

  const formatarTelefone = (telefone: string) => {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatarHora = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!conversa) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Conversa não encontrada</h3>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <User className="text-green-600" size={20} />
            </div>
            
            <div>
              <h2 className="font-semibold text-gray-900">
                {conversa.nome_cliente || 'Cliente'}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} />
                {formatarTelefone(conversa.numero_cliente)}
              </div>
            </div>
          </div>
          
          <div className="ml-auto">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              conversa.status === 'ativa' ? 'bg-green-100 text-green-800' :
              conversa.status === 'aguardando' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {conversa.status}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.map((mensagem) => (
          <div
            key={mensagem.id}
            className={`flex ${mensagem.tipo === 'recebida' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                mensagem.tipo === 'recebida'
                  ? 'bg-gray-100 text-gray-900'
                  : mensagem.tipo === 'enviada'
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-100 text-blue-900'
              }`}
            >
              <div className="text-sm">{mensagem.conteudo}</div>
              <div className={`text-xs mt-1 ${
                mensagem.tipo === 'recebida' ? 'text-gray-500' : 'text-green-100'
              }`}>
                {formatarHora(mensagem.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={enviando}
          />
          
          <button
            onClick={enviarMensagem}
            disabled={!novaMensagem.trim() || enviando}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
} 