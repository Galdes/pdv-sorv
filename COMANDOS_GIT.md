# 📋 Comandos Git para Enviar Mudanças

## 🚀 Comandos para Executar no Terminal

### **Opção 1: Comandos Separados**

```bash
# 1. Adicionar todas as mudanças
git add .

# 2. Fazer commit com mensagem
git commit -m "feat: adicionar sistema de notificações para mensagens não lidas"

# 3. Enviar para o GitHub
git push origin main
```

### **Opção 2: Comando Único**

```bash
git add . && git commit -m "feat: adicionar sistema de notificações para mensagens não lidas" && git push origin main
```

## 📝 O que será enviado:

✅ **Sistema de Notificações**
- Badge de notificações não lidas
- Contador por conversa
- Estatísticas gerais
- Marcação automática como lida

✅ **Melhorias no Webhook**
- Campo "lida" nas mensagens
- Mensagens recebidas começam como não lidas

✅ **Interface Aprimorada**
- Card "Não Lidas" no dashboard
- Badge vermelho nas conversas com mensagens não lidas

## 🔍 Como verificar se funcionou:

1. Acesse: https://github.com/Galdes/pdv-sorv
2. Verifique se aparece um novo commit recente
3. Aguarde o deploy automático no Vercel

## ⚠️ Se der erro:

- Verifique se está na pasta correta: `C:\Users\User\Desktop\Projetos\PDV`
- Certifique-se de que o Git está configurado
- Tente executar os comandos um por vez

---

# 🗄️ Script SQL para Banco de Dados

## **Execute este comando no Supabase:**

```sql
-- Adicionar campo "lida" na tabela mensagens_whatsapp
ALTER TABLE mensagens_whatsapp 
ADD COLUMN lida BOOLEAN DEFAULT false;

-- Atualizar mensagens existentes para marcar como lidas
UPDATE mensagens_whatsapp 
SET lida = true 
WHERE tipo = 'enviada' OR tipo = 'sistema';

-- Manter mensagens recebidas como não lidas
UPDATE mensagens_whatsapp 
SET lida = false 
WHERE tipo = 'recebida';
```

## **Como executar no Supabase:**

1. Acesse: https://supabase.com/dashboard
2. Vá no seu projeto
3. Clique em "SQL Editor"
4. Cole o script acima
5. Clique em "Run"

---

**Data:** 28/07/2025  
**Arquivo:** COMANDOS_GIT.md 