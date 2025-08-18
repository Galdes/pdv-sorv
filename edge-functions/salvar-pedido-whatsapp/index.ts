import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') } } }
    );

    const { nome_cliente, telefone, produtos, bar_id } = await req.json();
    
    if (!nome_cliente || !telefone || !produtos) {
      return new Response(
        JSON.stringify({ 
          error: 'Dados obrigatórios faltando', 
          required: ['nome_cliente', 'telefone', 'produtos'], 
          received: { nome_cliente, telefone, produtos } 
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Salvando pedido WhatsApp:', { nome_cliente, telefone, produtos });

    const barId = bar_id || '550e8400-e29b-41d4-a716-446655440000';
    
    // Criar endereço básico
    const { data: endereco, error: errorEndereco } = await supabaseClient
      .from('enderecos_entrega')
      .insert({
        nome_destinatario: nome_cliente,
        telefone: telefone,
        logradouro: 'Endereço via WhatsApp',
        numero: '1',
        bairro: 'Bairro via WhatsApp',
        cidade: 'Cidade via WhatsApp',
        estado: 'SP',
        ativo: true
      })
      .select('id')
      .single();

    if (errorEndereco) {
      console.error('Erro ao criar endereço:', errorEndereco);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar endereço de entrega', 
          details: errorEndereco.message 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Endereço criado:', endereco.id);

    // Criar pedido com observações completas
    const observacoes = `Cliente: ${nome_cliente} | Telefone: ${telefone} | Pedido: ${produtos}`;
    
    const { data: pedidoCriado, error: errorPedido } = await supabaseClient
      .from('pedidos_externos')
      .insert({
        bar_id: barId,
        endereco_id: endereco.id,
        tipo_pedido: 'whatsapp',
        tipo_servico: 'entrega',
        status: 'pendente',
        forma_pagamento: 'pix',
        valor_subtotal: 0,
        valor_taxa_entrega: 0,
        valor_total: 0,
        observacoes: observacoes
      })
      .select('id')
      .single();

    if (errorPedido) {
      console.error('Erro ao criar pedido:', errorPedido);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar pedido', 
          details: errorPedido.message 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Pedido criado:', pedidoCriado.id);

    const response = {
      success: true,
      message: 'Pedido salvo com sucesso',
      pedido_id: pedidoCriado.id,
      observacoes: observacoes,
      status: 'pendente',
      timestamp: new Date().toISOString()
    };

    console.log('Resposta final:', response);
    return new Response(
      JSON.stringify(response), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 