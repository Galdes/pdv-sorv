# 🔧 Configuração do Webhook N8N para Envio de Mensagens

## 📋 Passos para Configurar no N8N

### **1. Criar Novo Workflow (ou adicionar ao existente)**

1. Abra o N8N
2. Crie um novo workflow ou adicione ao workflow existente
3. Nome: `Envio de Mensagens do Sistema`

### **2. Adicionar Webhook Node**

1. **Adicione um node "Webhook"**
2. **Configure:**
   - **HTTP Method:** `POST`
   - **Path:** `/send-message`
   - **Response Mode:** `Last Node`
   - **Authentication:** `None`

### **3. Adicionar HTTP Request para Z-API**

1. **Conecte o Webhook** → **HTTP Request Node**
2. **Configure:**
   - **Name:** `Enviar para Z-API`
   - **Method:** `POST`
   - **URL:** `https://api.z-api.io/instances/3E29A3AF9423B0EA10A44AAAADA6D328/token/7D1DE18113C654C07EA765C7/send-text`
   - **Headers:**
     ```
     Content-Type: application/json
     Client-Token: F1a3944af237e41109ba151a729e869e9S
     ```
   - **Body:**
     ```json
     {
       "phone": "{{ $json.numero_cliente }}",
       "message": "{{ $json.mensagem }}"
     }
     ```

### **4. Adicionar HTTP Request para Salvar no Sistema**

1. **Conecte o HTTP Request Z-API** → **HTTP Request Node**
2. **Configure:**
   - **Name:** `Salvar no Sistema`
   - **Method:** `POST`
   - **URL:** `https://pdv-talos.vercel.app/api/webhook/whatsapp`
   - **Headers:**
     ```
     Content-Type: application/json
     ```
   - **Body:**
     ```json
     {
       "conversa": {
         "numero_cliente": "{{ $json.numero_cliente }}",
         "nome_cliente": "Cliente",
         "status": "ativa",
         "ultima_interacao": "{{ $now }}"
       },
       "mensagem": {
         "tipo": "enviada",
         "conteudo": "{{ $json.mensagem }}",
         "timestamp": "{{ $now }}"
       }
     }
     ```

### **5. Adicionar Responder**

1. **Conecte o último HTTP Request** → **Respond to Webhook Node**
2. **Configure:**
   - **Response Code:** `200`
   - **Response Body:**
     ```json
     {
       "success": true,
       "message": "Mensagem enviada com sucesso",
       "timestamp": "{{ $now }}"
     }
     ```

## 🔗 Fluxo Completo

```
Sistema → N8N Webhook → Z-API → WhatsApp
                ↓
            Salvar no Sistema
                ↓
            Responder ao Sistema
```

## ⚙️ Configuração no Sistema

### **Variável de Ambiente:**

Adicione no Vercel:
- **Nome:** `N8N_SEND_WEBHOOK_URL`
- **Valor:** `https://seu-n8n.com/webhook/send-message`

### **URL do Webhook:**

Após criar o webhook no N8N, você receberá uma URL como:
```
https://seu-n8n.com/webhook/send-message
```

Copie essa URL e configure no Vercel.

## 🧪 Teste

### **1. Teste no N8N:**
- Use o botão "Test" no webhook
- Verifique se a mensagem chega no WhatsApp

### **2. Teste no Sistema:**
- Acesse uma conversa
- Envie uma mensagem
- Verifique se aparece no chat

## 🔍 Troubleshooting

### **Erro 500:**
- Verifique se a URL do webhook está correta
- Verifique se o token Z-API está correto
- Verifique os logs no N8N

### **Mensagem não chega:**
- Verifique se o número está no formato correto
- Verifique se o Z-API está conectado
- Verifique se o webhook está ativo

---

**Data:** 29/07/2025  
**Arquivo:** INSTRUCOES_N8N_WEBHOOK.md

---

# 🔧 CONFIGURAÇÃO DO FLUXO 2: RECEBER MENSAGENS DO WHATSAPP

## 📋 Configuração do Node "Salva Mensagens Recebidas"

### **PROBLEMA IDENTIFICADO:**
O node "Salva Mensagens Recebidas" está salvando mensagens do WhatsApp com `tipo: "enviada"` quando deveria ser `tipo: "recebida"`.

### **SOLUÇÃO:**

**Configure o node "Salva Mensagens Recebidas" com:**

```json
{
  "conversa": {
    "numero_cliente": "{{ $json.numero_cliente }}",
    "nome_cliente": "Cliente",
    "status": "ativa",
    "ultima_interacao": "{{ $now }}"
  },
  "mensagem": {
    "tipo": "recebida",
    "conteudo": "{{ $json.mensagem }}",
    "timestamp": "{{ $now }}"
  }
}
```

### **DIFERENÇA CRÍTICA:**

- **Fluxo 1 (Envio)**: `"tipo": "enviada"` ✅
- **Fluxo 2 (Recebimento)**: `"tipo": "recebida"` ✅

### **RESULTADO ESPERADO:**

Após a correção:
- ✅ Mensagens do usuário aparecem na **esquerda** (cinza)
- ✅ Mensagens do sistema aparecem na **direita** (verde)
- ✅ Bot responde corretamente
- ✅ Modo humano funciona adequadamente

---

**Data:** 01/08/2025  
**Arquivo:** INSTRUCOES_N8N_WEBHOOK.md  
**Versão:** 2.0 - Adicionado Fluxo 2