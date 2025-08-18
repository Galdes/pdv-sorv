# 🤖 Prompt para Extração de Dados de Pedidos WhatsApp

## 📋 Objetivo
Extrair automaticamente dados de pedidos do WhatsApp para salvar no sistema de delivery.

## 🎯 Dados a Extrair
- **Nome do cliente**
- **Telefone**
- **Lista de produtos**

## 📝 Prompt para IA

```
Você é um assistente especializado em extrair informações de pedidos de delivery via WhatsApp.

TAREFA:
Extraia as seguintes informações da mensagem do cliente:
1. Nome do cliente
2. Telefone (se mencionado)
3. Lista de produtos desejados

REGRAS:
- Se o nome não for mencionado, use "Cliente"
- Se o telefone não for mencionado, use o número do WhatsApp da conversa
- Mantenha a lista de produtos exatamente como mencionada
- Não adicione informações que não estão na mensagem
- Seja preciso e não invente dados

FORMATO DE RESPOSTA (JSON):
{
  "nome_cliente": "Nome do Cliente",
  "telefone": "11999999999",
  "produtos": "Lista de produtos mencionados"
}

EXEMPLOS:

Mensagem: "Oi, quero 2 sorvetes de chocolate"
Resposta: {
  "nome_cliente": "Cliente",
  "telefone": "11999999999",
  "produtos": "2 sorvetes de chocolate"
}

Mensagem: "Sou João Silva, telefone 11999999999. Quero 1 milkshake de morango e 2 sorvetes de chocolate"
Resposta: {
  "nome_cliente": "João Silva",
  "telefone": "11999999999",
  "produtos": "1 milkshake de morango, 2 sorvetes de chocolate"
}

Mensagem: "Boa tarde! Gostaria de fazer um pedido: 3 sorvetes de baunilha, 1 milkshake de chocolate e 2 picolés de limão"
Resposta: {
  "nome_cliente": "Cliente",
  "telefone": "11999999999",
  "produtos": "3 sorvetes de baunilha, 1 milkshake de chocolate, 2 picolés de limão"
}

Mensagem: "Oi, sou Maria Santos, meu telefone é 11988888888. Quero 1 sorvete de morango para entrega"
Resposta: {
  "nome_cliente": "Maria Santos",
  "telefone": "11988888888",
  "produtos": "1 sorvete de morango"
}

Agora extraia as informações da seguinte mensagem:

MENSAGEM DO CLIENTE:
{{ $json.mensagem }}

NÚMERO DO WHATSAPP:
{{ $json.numero_cliente }}

RESPOSTA (apenas o JSON):
```

## 🔧 Configuração no N8N

### **1. Node de IA (OpenAI/GPT)**
- **Model:** `gpt-3.5-turbo`
- **Temperature:** `0.1` (para respostas consistentes)
- **Max Tokens:** `500`
- **Prompt:** Use o prompt acima

### **2. Node Set (Extrair Dados)**
```json
{
  "nome_cliente": "{{ $json.nome_cliente }}",
  "telefone": "{{ $json.telefone }}",
  "produtos": "{{ $json.produtos }}",
  "numero_original": "{{ $('IA Node').json.numero_cliente }}",
  "mensagem_original": "{{ $('IA Node').json.mensagem }}"
}
```

### **3. Node HTTP Request (Salvar Pedido)**
```json
{
  "nome_cliente": "{{ $json.nome_cliente }}",
  "telefone": "{{ $json.telefone }}",
  "produtos": "{{ $json.produtos }}",
  "bar_id": "550e8400-e29b-41d4-a716-446655440000",
  "observacoes": "Pedido via WhatsApp - {{ $now }}",
  "forma_pagamento": "pix",
  "tipo_servico": "entrega"
}
```

## 📊 Fluxo Completo

```
Mensagem WhatsApp → IA Extrai Dados → Set Node → Salvar no Delivery → Confirmar ao Cliente
```

## 🧪 Testes

### **Teste 1 - Pedido Simples**
**Entrada:** "Quero 2 sorvetes de chocolate"
**Saída Esperada:**
```json
{
  "nome_cliente": "Cliente",
  "telefone": "11999999999",
  "produtos": "2 sorvetes de chocolate"
}
```

### **Teste 2 - Pedido Completo**
**Entrada:** "Oi, sou João Silva, telefone 11999999999. Quero 1 milkshake de morango e 2 sorvetes de chocolate"
**Saída Esperada:**
```json
{
  "nome_cliente": "João Silva",
  "telefone": "11999999999",
  "produtos": "1 milkshake de morango, 2 sorvetes de chocolate"
}
```

### **Teste 3 - Pedido com Observações**
**Entrada:** "Boa tarde! Sou Maria, telefone 11988888888. Quero 3 sorvetes de baunilha e 1 milkshake de chocolate para entrega"
**Saída Esperada:**
```json
{
  "nome_cliente": "Maria",
  "telefone": "11988888888",
  "produtos": "3 sorvetes de baunilha, 1 milkshake de chocolate"
}
```

## 🚨 Tratamento de Erros

### **Erro de Extração:**
- Se a IA não conseguir extrair dados válidos, retornar erro
- Logar a mensagem original para análise
- Não salvar pedido incompleto

### **Dados Faltando:**
- Nome: Usar "Cliente"
- Telefone: Usar número do WhatsApp
- Produtos: Retornar erro se não houver produtos

## 📈 Métricas de Qualidade

### **Taxa de Sucesso:**
- Pedidos extraídos corretamente / Total de tentativas
- Meta: > 90%

### **Qualidade dos Dados:**
- Produtos encontrados no sistema / Produtos mencionados
- Meta: > 80%

### **Tempo de Resposta:**
- Tempo total de extração + salvamento
- Meta: < 5 segundos

---

**Data:** 15/01/2024  
**Arquivo:** doc/prompt_extracao_pedido_whatsapp.md  
**Status:** Implementado ✅ 