// Tipos TypeScript para o sistema de comandas

export interface Bar {
  id: string;
  nome: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  bar_id: string;
  created_at: string;
  updated_at: string;
}

export interface Sabor {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  bar_id: string;
  created_at: string;
  updated_at: string;
}

export interface Mesa {
  id: string;
  bar_id: string;
  numero: number;
  capacidade: number;
  descricao?: string;
  qr_code?: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  bar_id: string;
  nome?: string;
  telefone: string;
  created_at: string;
  updated_at: string;
}

export interface Comanda {
  id: string;
  mesa_id: string;
  cliente_id: string;
  status: 'aberta' | 'fechada' | 'paga';
  total: number;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  bar_id: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria_id?: string;
  categoria_nome?: string;
  sabor_id?: string;
  sabor_nome?: string;
  sabores?: Sabor[]; // Array de objetos Sabor
  sabores_ids?: string[]; // Array de IDs dos sabores
  max_sabores?: number; // Número máximo de sabores permitidos
  ativo: boolean;
  imagem_url?: string; // URL da imagem do produto
  created_at: string;
  updated_at: string;
}

export interface Pedido {
  id: string;
  comanda_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  valor_pago?: number;
  valor_restante?: number;
  status: 'pendente' | 'preparando' | 'entregue' | 'pago' | 'cancelado';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface PagamentoMesa {
  id: string;
  mesa_id: string;
  valor_total_mesa: number;
  valor_pago: number;
  valor_restante: number;
  tipo_pagamento: 'parcial' | 'seletivo' | 'total';
  observacoes?: string;
  usuario_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PagamentoPedido {
  id: string;
  pagamento_mesa_id: string;
  pedido_id: string;
  valor_pago_pedido: number;
  valor_restante_pedido: number;
  created_at: string;
}

export interface Usuario {
  id: string;
  bar_id: string;
  nome: string;
  email: string;
  tipo: 'sistema_admin' | 'dono_bar' | 'garcom' | 'cozinheiro';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para formulários
export interface FormAberturaComanda {
  nome?: string;
  telefone: string;
}

export interface FormLogin {
  email: string;
  senha: string;
}

export interface FormCategoria {
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface FormSabor {
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface FormProduto {
  nome: string;
  descricao?: string;
  preco: number;
  categoria_id?: string;
  sabor_id?: string;
  sabores_ids?: string[];
  max_sabores?: number;
  ativo: boolean;
  imagem_url?: string;
}

export interface FormBar {
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  descricao: string;
  ativo: boolean;
}

// Tipos para respostas da API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// ===== TIPOS PARA DELIVERY =====

export interface EnderecoEntrega {
  id?: string;
  cliente_id?: string;
  nome_destinatario: string;
  telefone: string;
  cep?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  referencia?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PedidoExterno {
  id?: string;
  bar_id: string;
  cliente_id?: string;
  endereco_id?: string;
  tipo_pedido: 'delivery' | 'whatsapp' | 'ecommerce';
  tipo_servico: 'entrega' | 'retirada';
  status: 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'em_entrega' | 'entregue' | 'cancelado';
  forma_pagamento: 'pix' | 'cartao' | 'dinheiro';
  valor_subtotal: number;
  valor_taxa_entrega: number;
  valor_desconto: number;
  valor_total: number;
  valor_pago?: number;
  valor_troco?: number;
  pagamento_confirmado: boolean;
  horario_entrega?: string;
  tempo_estimado_entrega?: number;
  observacoes?: string;
  usuario_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ItemPedidoExterno {
  id?: string;
  pedido_externo_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  observacoes?: string;
  created_at?: string;
}

export interface ItemCarrinhoDelivery {
  produto: {
    id: string;
    nome: string;
    preco: number;
    descricao?: string;
    max_sabores?: number;
  };
  quantidade: number;
  saboresEscolhidos?: string[];
  observacoes?: string;
}

export interface ConfigDelivery {
  id?: string;
  bar_id: string;
  ativo: boolean;
  taxa_entrega_fixa: number;
  taxa_entrega_por_km: number;
  raio_entrega_km: number;
  tempo_estimado_min: number;
  horario_inicio: string;
  horario_fim: string;
  dias_funcionamento: string[];
  valor_minimo_pedido: number;
  aceita_retirada: boolean;
  aceita_entrega: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ConfigWhatsApp {
  id?: string;
  bar_id: string;
  ativo: boolean;
  numero_whatsapp: string;
  mensagem_boas_vindas?: string;
  mensagem_menu?: string;
  horario_atendimento?: string;
  link_cardapio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConversaWhatsApp {
  id?: string;
  bar_id: string;
  numero_cliente: string;
  nome_cliente?: string;
  status: 'ativa' | 'finalizada' | 'abandonada';
  ultima_interacao: string;
  pedido_externo_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MensagemWhatsApp {
  id?: string;
  conversa_id: string;
  tipo: 'recebida' | 'enviada';
  conteudo: string;
  timestamp: string;
}

// Tipos para formulários de delivery
export interface FormEnderecoEntrega {
  nome_destinatario: string;
  telefone: string;
  cep?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  referencia?: string;
}

export interface FormPedidoExterno {
  tipo_servico: 'entrega' | 'retirada';
  forma_pagamento: 'pix' | 'cartao' | 'dinheiro';
  valor_troco?: number;
  endereco?: FormEnderecoEntrega;
  observacoes?: string;
  itens: ItemCarrinhoDelivery[];
} 