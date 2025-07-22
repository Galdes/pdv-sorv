// Tipos TypeScript para o sistema de comandas

export interface Bar {
  id: string;
  nome: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
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
  categoria?: string;
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

// Tipos para respostas da API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
} 