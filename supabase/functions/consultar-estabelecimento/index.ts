import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')
          }
        }
      }
    );

    // Get request body
    const { bar_id, nome, listar_todos } = await req.json();

    // Format date function
    const formatarData = (data: string) => {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    let query = supabaseClient
      .from('bares')
      .select(`
        id,
        nome,
        endereco,
        telefone,
        email,
        descricao,
        ativo,
        created_at,
        updated_at
      `)
      .eq('ativo', true);

    // Apply filters based on request
    if (bar_id) {
      query = query.eq('id', bar_id);
    } else if (nome) {
      query = query.ilike('nome', `%${nome}%`);
    }

    // Execute query
    const { data: estabelecimentos, error } = await query.order('nome', { ascending: true });

    if (error) {
      console.error('Erro na query bares:', error);
      return new Response(JSON.stringify({
        error: 'Erro ao consultar estabelecimento',
        details: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!estabelecimentos || estabelecimentos.length === 0) {
      return new Response(JSON.stringify({
        error: 'Nenhum estabelecimento encontrado',
        total: 0,
        estabelecimentos: []
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Process establishments
    const estabelecimentosFormatados = estabelecimentos.map(estabelecimento => ({
      id: estabelecimento.id,
      nome: estabelecimento.nome,
      endereco: estabelecimento.endereco || 'Endereço não informado',
      telefone: estabelecimento.telefone || 'Telefone não informado',
      email: estabelecimento.email || 'Email não informado',
      descricao: estabelecimento.descricao || 'Descrição não informada',
      ativo: estabelecimento.ativo,
      created_at: estabelecimento.created_at,
      updated_at: estabelecimento.updated_at,
      created_at_formatado: formatarData(estabelecimento.created_at),
      updated_at_formatado: formatarData(estabelecimento.updated_at)
    }));

    // Prepare response
    const response = {
      total: estabelecimentosFormatados.length,
      estabelecimentos: estabelecimentosFormatados,
      mensagem: estabelecimentosFormatados.length === 1 
        ? `Dados do estabelecimento ${estabelecimentosFormatados[0].nome} recuperados com sucesso.`
        : `Encontrados ${estabelecimentosFormatados.length} estabelecimento(s) ativo(s).`
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 