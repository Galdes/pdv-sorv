# 📋 Instruções N8N - Salvar Pedido WhatsApp

## **🛠️ Configuração do Nó "Salvar Pedido no Delivery"**

### **📌 Configurações Básicas:**
- **Resource:** Row
- **Operation:** Create
- **Table Name:** `pedidos_externos`

### **📦 Fields to Send:**

#### **Campo 1:**
- **Field Name:** `bar_id`
- **Field Value:** `550e8400-e29b-41d4-a716-446655440000`

#### **Campo 2:**
- **Field Name:** `tipo_pedido`
- **Field Value:** `whatsapp`

#### **Campo 3:**
- **Field Name:** `tipo_servico`
- **Field Value:** `entrega`

#### **Campo 4:**
- **Field Name:** `status`
- **Field Value:** `pendente`

#### **Campo 5:**
- **Field Name:** `forma_pagamento`
- **Field Value:** `pix`

#### **Campo 6:**
- **Field Name:** `valor_subtotal`
- **Field Value:** `0`

#### **Campo 7:**
- **Field Name:** `valor_taxa_entrega`
- **Field Value:** `0`

#### **Campo 8:**
- **Field Name:** `valor_total`
- **Field Value:** `0`

#### **Campo 9 (Observações - Principal):**
- **Field Name:** `observacoes`
- **Field Value:** `Cliente: {{ $('If').item.json.NomeCliente }} | Telefone: {{ $('If').item.json.Telefone }} | Endereço: {{ $('If').item.json.MensagemUser }} | Produtos: [PRODUTOS_ANTERIORES]`

## **🎯 Como Funciona:**

### **📝 Nova Abordagem com Endereço:**
1. **Cliente diz produtos** → Talos anota
2. **Talos pede endereço** → Cliente fornece
3. **Talos salva** → Com endereço completo
4. **Formato:** `"Cliente: João Silva | Telefone: 11999999999 | Endereço: Rua das Flores, 123 | Produtos: 2 sorvetes"`

### **✅ Vantagens:**
- ✅ **Endereço real** para entrega
- ✅ **Sem Edge Function** - mais simples
- ✅ **Sem HTTP Request** - menos erros
- ✅ **Conexão direta** - mais confiável
- ✅ **Debug automático** - logs nativos

## **🔄 Fluxo Completo:**

1. **Cliente:** "2 sorvetes de morango"
2. **Talos:** "Agora preciso do seu endereço para entrega"
3. **Cliente:** "Rua das Flores, 123, Centro"
4. **Talos:** [Salva com endereço completo]
5. **Cliente:** Recebe confirmação

## **📊 Resposta Esperada:**
```json
{
  "success": true,
  "message": "Pedido salvo com sucesso",
  "pedido_id": "uuid-do-pedido",
  "observacoes": "Cliente: João Silva | Telefone: 11999999999 | Endereço: Rua das Flores, 123 | Produtos: 2 sorvetes",
  "status": "pendente",
  "timestamp": "2025-08-05T15:12:00.000Z"
}
```

## **🔧 Configurações Adicionais:**

### **Credential:** Supabase account
### **Use Custom Schema:** OFF
### **Data to Send:** Define Below for Each Column

## **⚠️ Importante:**
- **Endereço** é coletado após produtos
- **Nome e telefone** vêm da Z-API automaticamente
- **Observações** contêm todos os dados necessários
- **Produtos** devem ser preservados quando salvar

## **🔍 Variáveis Z-API:**
- **Nome:** `{{ $('If').item.json.NomeCliente }}`
- **Telefone:** `{{ $('If').item.json.Telefone }}`
- **Endereço:** `{{ $('If').item.json.MensagemUser }}` (quando for endereço)
- **Produtos:** Devem ser preservados de mensagens anteriores 