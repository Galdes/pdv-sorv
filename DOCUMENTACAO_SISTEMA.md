# 📋 Documentação do Sistema WhatsApp

## 🚨 AVISOS IMPORTANTES

### **1. URL do Ngrok**
- **⚠️ ATENÇÃO:** URL do ngrok muda a cada reinicialização
- **URL atual:** `https://aec91f83329e.ngrok-free.app`
- **Ação necessária:** Atualizar `N8N_SEND_WEBHOOK_URL` no Vercel sempre que reiniciar
- **Localização:** Vercel Dashboard → Settings → Environment Variables

### **2. Variáveis de Ambiente**
- **N8N_SEND_WEBHOOK_URL:** URL do webhook N8N (via ngrok)
- **ZAPI_CLIENT_TOKEN:** Token da Z-API (se usar envio direto)
- **WEBHOOK_SECRET_TOKEN:** Token de segurança (desabilitado para teste)

### **3. Fluxo de Mensagens**
```
Sistema → ngrok → N8N → Z-API → WhatsApp
```

### **4. Intervenção Humana**
- **Timeout:** 5 minutos automático
- **Sincronização:** Sistema e Redis têm contadores separados
- **Problema:** Pode haver desincronização entre sistema e N8N

## 🔧 CONFIGURAÇÕES TÉCNICAS

### **Banco de Dados (Supabase)**
- **Tabela:** `conversas_whatsapp`
- **Campos de intervenção:** `modo_atendimento`, `atendente_nome`, `assumido_em`, `bloqueado_ate`
- **Timeout padrão:** 5 minutos

### **N8N Workflow**
- **Webhook recebe:** `https://aec91f83329e.ngrok-free.app/webhook-test/send-message`
- **Redis:** Controle de bloqueio do bot
- **Z-API:** Envio de mensagens

### **Sistema (Vercel)**
- **Webhook:** `/api/webhook/whatsapp` (recebe do N8N)
- **Envio:** `/api/whatsapp/enviar` (envia para N8N)
- **Intervenção:** `/api/whatsapp/assumir-conversa`

## 🐛 PROBLEMAS CONHECIDOS

### **1. Desincronização de Timeout**
- **Problema:** Sistema e Redis têm contadores independentes
- **Impacto:** Bot pode responder mesmo com humano ativo
- **Solução:** Implementar sincronização via webhooks

### **2. URL do Ngrok**
- **Problema:** Muda a cada reinicialização
- **Impacto:** Sistema não consegue enviar mensagens
- **Solução:** Atualizar variável no Vercel

### **3. Ordem de Mensagens**
- **Problema:** Mensagens podem aparecer fora de ordem
- **Causa:** Timestamps idênticos
- **Solução:** Ordenar por ID também

## 📋 CHECKLIST DE DEPLOY

### **Antes de Fazer Deploy:**
- [ ] Verificar se ngrok está rodando
- [ ] Atualizar URL do ngrok no Vercel
- [ ] Testar envio de mensagem
- [ ] Verificar logs no Vercel

### **Após Reinicialização:**
- [ ] Iniciar ngrok: `ngrok http 5678`
- [ ] Copiar nova URL
- [ ] Atualizar no Vercel: `N8N_SEND_WEBHOOK_URL`
- [ ] Testar sistema

## 🔍 TROUBLESHOOTING

### **Erro 500 no Envio:**
1. Verificar se ngrok está ativo
2. Verificar URL no Vercel
3. Verificar logs no Vercel
4. Testar webhook diretamente no N8N

### **Mensagem não chega:**
1. Verificar se N8N está ativo
2. Verificar conexão Z-API
3. Verificar logs no N8N
4. Verificar token Z-API

### **Intervenção não funciona:**
1. Verificar campos no banco
2. Verificar timeout no sistema
3. Verificar Redis no N8N
4. Verificar logs de ambos

## 🚀 MELHORIAS FUTURAS

### **1. Sincronização de Timeout**
- Implementar webhook para sincronizar sistema e Redis
- Evitar desincronização de contadores

### **2. URL Fixa do Ngrok**
- Considerar conta paga do ngrok para URL fixa
- Ou implementar atualização automática

### **3. Logs Centralizados**
- Implementar sistema de logs unificado
- Facilitar debug de problemas

### **4. Monitoramento**
- Implementar alertas de falha
- Dashboard de status do sistema

---

**Data:** 29/07/2025  
**Versão:** 1.0  
**Arquivo:** DOCUMENTACAO_SISTEMA.md