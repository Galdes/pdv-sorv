# 📋 Comandos Git para Enviar Mudanças

## 🚀 Comandos para Executar no Terminal

### **Opção 1: Comandos Separados**

```bash
# 1. Adicionar todas as mudanças
git add .

# 2. Fazer commit com mensagem
git commit -m "docs: adicionar documentação completa e limpar arquivos desnecessários"

# 3. Enviar para o GitHub
git push origin main
```

### **Opção 2: Comando Único**

```bash
git add . && git commit -m "docs: adicionar documentação completa e limpar arquivos desnecessários" && git push origin main
```

## 📝 O que será enviado:

✅ **Documentação Completa**
- `DOCUMENTACAO_SISTEMA.md` - Documentação técnica completa
- Comentários importantes nos arquivos de API
- Avisos sobre URL do ngrok e problemas conhecidos

✅ **Limpeza de Arquivos**
- Removido `h origin main` (arquivo de log)
- Removido `RESUMO_CHATBOT_TESTE.md` (documentação antiga)
- Removido `prompt-chatbot-sorveteria.md` (versão antiga)

✅ **Comentários nos Códigos**
- Avisos sobre URL do ngrok em `app/api/whatsapp/enviar/route.ts`
- Documentação de intervenção humana em `app/api/webhook/whatsapp/route.ts`
- Logs detalhados para debug

## 🚨 AVISOS IMPORTANTES DOCUMENTADOS:

### **1. URL do Ngrok**
- Muda a cada reinicialização
- Atualizar `N8N_SEND_WEBHOOK_URL` no Vercel
- URL atual: `https://aec91f83329e.ngrok-free.app`

### **2. Problemas Conhecidos**
- Desincronização entre sistema e Redis
- Ordem de mensagens pode estar incorreta
- Timeout de 5 minutos para intervenção humana

### **3. Checklist de Deploy**
- Verificar ngrok antes de deploy
- Atualizar URL no Vercel após reinicialização
- Testar envio de mensagem

## 🔍 Como verificar se funcionou:

1. Acesse: https://github.com/Galdes/pdv-sorv
2. Verifique se aparece um novo commit recente
3. Aguarde o deploy automático no Vercel
4. Consulte `DOCUMENTACAO_SISTEMA.md` para dúvidas

## ⚠️ Se der erro:

- Verifique se está na pasta correta: `C:\Users\User\Desktop\Projetos\PDV`
- Certifique-se de que o Git está configurado
- Tente executar os comandos um por vez

---

**Data:** 29/07/2025  
**Arquivo:** COMANDOS_GIT.md