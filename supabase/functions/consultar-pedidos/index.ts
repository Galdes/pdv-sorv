import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get request body
    const { telefone } = await req.json()

    if (!telefone) {
      return new Response(
        JSON.stringify({ error: 'Telefone é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Clean phone number (remove special characters)
    const telefoneLimpo = telefone.replace(/\D/g, '')

    // console.log('Consultando telefone:', telefoneLimpo)

    // Query to get active orders - simplified version
    const { data: pedidos, error } = await supabaseClient
      .from('pedidos_externos')
      .select(`
        id,
        status,
        valor_total,
        created_at,
        forma_pagamento,
        observacoes,
        endereco_id
      `)
      .not('status', 'in', '(entregue,cancelado)')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro na query pedidos_externos:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao consultar pedidos', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // console.log('Pedidos encontrados:', pedidos?.length || 0)

    // Filter by phone number and get address details
    const pedidosComEndereco = []
    
    for (const pedido of pedidos || []) {
      // Get address details for this order
      const { data: endereco, error: enderecoError } = await supabaseClient
        .from('enderecos_entrega')
        .select('*')
        .eq('id', pedido.endereco_id)
        .eq('telefone', telefoneLimpo)
        .single()

      if (enderecoError) {
        // console.log('Endereço não encontrado para pedido:', pedido.id)
        continue
      }

      if (endereco) {
        pedidosComEndereco.push({
          ...pedido,
          endereco
        })
      }
    }

    // console.log('Pedidos com endereço encontrados:', pedidosComEndereco.length)

    // Translate status to Portuguese
    const traduzirStatus = (status: string) => {
      const traducoes: { [key: string]: string } = {
        'pendente': 'Pendente',
        'preparando': 'Em Preparo',
        'saiu_entrega': 'Saiu para Entrega',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
      }
      return traducoes[status] || status
    }

    // Format address
    const formatarEndereco = (endereco: any) => {
      const parts = [
        endereco.logradouro,
        endereco.numero,
        endereco.complemento,
        endereco.bairro,
        endereco.cidade,
        endereco.estado,
        endereco.cep
      ].filter(Boolean)
      
      return parts.join(', ')
    }

    // Format date
    const formatarData = (data: string) => {
      const date = new Date(data)
      return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }

    // Process orders
    const pedidosFormatados = pedidosComEndereco.map((pedido, index) => ({
      codigo: `#${String(index + 1).padStart(3, '0')}`,
      id: pedido.id,
      status: traduzirStatus(pedido.status),
      valor_total: pedido.valor_total,
      created_at: pedido.created_at,
      data_formatada: formatarData(pedido.created_at),
      forma_pagamento: pedido.forma_pagamento,
      observacoes: pedido.observacoes || '',
      endereco: formatarEndereco(pedido.endereco),
      nome_destinatario: pedido.endereco.nome_destinatario
    }))

    // Prepare response
    const response = {
      telefone: telefoneLimpo,
      total_pedidos: pedidosFormatados.length,
      pedidos: pedidosFormatados,
      mensagem: pedidosFormatados.length === 0 
        ? `Não encontrei pedidos ativos para o telefone ${telefoneLimpo}.`
        : `Encontrei ${pedidosFormatados.length} pedido(s) ativo(s) para o telefone ${telefoneLimpo}.`
    }

    // console.log('Resposta final:', response)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 