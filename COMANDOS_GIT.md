# 📋 Comandos Git para Enviar Mudanças

## 🚀 Comandos para Executar no Terminal

### **Opção 1: Comandos Separados**

```bash
# 1. Adicionar todas as mudanças
git add .

# 2. Fazer commit com mensagem
git commit -m "fix: adicionar logs para investigar se webhook recebe mensagens do WhatsApp"

# 3. Enviar para o GitHub
git push origin main
```

### **Opção 2: Comando Único**

```bash
git add . && git commit -m "fix: adicionar logs para investigar se webhook recebe mensagens do WhatsApp" && git push origin main
```

## 📝 O que será enviado:

✅ **Investigação de Mensagens do WhatsApp**
- **Problema**: Após liberar conversa, não recebe mensagens do WhatsApp
- **Causa**: Possível problema no N8N ou no webhook
- **Solução**: Logs detalhados para verificar se mensagens chegam
- **Resultado**: Identificação se problema está no N8N ou no sistema

✅ **Arquivos Modificados:**
- `app/api/webhook/whatsapp/route.ts` - Logs detalhados de mensagens recebidas

✅ **Funcionalidades Implementadas:**
- **Logs de Mensagens**: Verificação se mensagens chegam ao webhook
- **Logs de Tipo**: Identificação do tipo de mensagem recebida
- **Logs de Conteúdo**: Verificação do conteúdo da mensagem
- **Debug Completo**: Rastreamento completo do fluxo

✅ **Cenários Investigados:**
- **Mensagens Chegam**: Se o webhook está recebendo mensagens
- **Tipo Correto**: Se o tipo da mensagem está correto
- **Conteúdo Válido**: Se o conteúdo está sendo processado
- **N8N Funciona**: Se o problema está no N8N ou no sistema

## 🔍 Como verificar se funcionou:

1. Acesse: https://github.com/Galdes/pdv-sorv
2. Verifique se aparece um novo commit recente
3. Aguarde o deploy automático no Vercel
4. Teste o sistema:
   - Envie uma mensagem do WhatsApp
   - Verifique os logs do Vercel para ver se a mensagem chegou
   - Identifique se o problema está no N8N ou no sistema

## ⚠️ Se der erro:

- Verifique se está na pasta correta: `C:\\Users\\User\\Desktop\\Projetos\\PDV`
- Certifique-se de que o Git está configurado
- Tente executar os comandos um por vez

## 📊 Status Atual:

**Data:** 31/07/2025  
**Arquivo:** COMANDOS_GIT.md  
**Versão:** 2.13 - Investigação Mensagens WhatsApp