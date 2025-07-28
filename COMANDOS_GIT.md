# 📋 Comandos Git para Enviar Mudanças

## 🚀 Comandos para Executar no Terminal

### **Opção 1: Comandos Separados**

```bash
# 1. Adicionar todas as mudanças
git add .

# 2. Fazer commit com mensagem
git commit -m "fix: corrigir timestamp das mensagens do webhook"

# 3. Enviar para o GitHub
git push origin main
```

### **Opção 2: Comando Único**

```bash
git add . && git commit -m "fix: corrigir timestamp das mensagens do webhook" && git push origin main
```

## 📝 O que será enviado:

✅ **Correção do timestamp no webhook**
- Forçar timestamp atual em vez do timestamp do N8N
- Corrigir ordem de exibição das mensagens

✅ **Melhorias no webhook**
- Logs mais detalhados
- Melhor tratamento de erros

✅ **Correção da ordem das mensagens**
- Mensagens agora aparecem na ordem correta

## 🔍 Como verificar se funcionou:

1. Acesse: https://github.com/Galdes/pdv-sorv
2. Verifique se aparece um novo commit recente
3. Aguarde o deploy automático no Vercel

## ⚠️ Se der erro:

- Verifique se está na pasta correta: `C:\Users\User\Desktop\Projetos\PDV`
- Certifique-se de que o Git está configurado
- Tente executar os comandos um por vez

---
**Data:** 28/07/2025  
**Arquivo:** COMANDOS_GIT.md 