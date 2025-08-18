# 🚀 Instruções para Executar a Funcionalidade Z-API

## 📋 **Passos para Ativar a Funcionalidade:**

### **1. Executar Script SQL no Supabase:**
1. Acesse o **Supabase Dashboard** do seu projeto
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `doc/criar_tabela_config_zapi.sql`
4. **IMPORTANTE:** Substitua o UUID `550e8400-e29b-41d4-a716-446655440000` pelo ID real do seu estabelecimento
5. Clique em **Run** para executar

### **2. Verificar se a Tabela foi Criada:**
1. No Supabase, vá em **Table Editor**
2. Verifique se a tabela `config_zapi` foi criada
3. Confirme se tem as colunas corretas

### **3. Testar a Funcionalidade:**
1. Acesse `/admin/configuracoes` no seu sistema
2. Role para baixo até ver o card **"Configurações Z-API (WhatsApp)"**
3. Os campos devem estar preenchidos com os valores padrão:
   - **ID da Instância:** `3E29A3AF9423B0EA10A44AAAADA6D328`
   - **Token:** `7D1DE18113C654C07EA765C7`

## 🧪 **Testes Recomendados:**

### **Teste 1 - Verificar Status:**
1. Clique em **"🧪 Testar Conexão"**
2. Deve mostrar o status atual da Z-API
3. Verificar se aparece "🟢 Conectado" ou "🔴 Desconectado"

### **Teste 2 - Reconexão:**
1. Se estiver desconectado, clique em **"🔄 Reconectar"**
2. Aguarde a mensagem de sucesso
3. Teste novamente a conexão

### **Teste 3 - Salvar Configurações:**
1. Altere algum campo (ex: token)
2. Clique em **"💾 Salvar Configurações"**
3. Verifique se salva no banco

## 🔧 **Funcionalidades Implementadas:**

✅ **Status Visual da Conexão** - Mostra se está conectado/desconectado  
✅ **Teste de Conexão** - Botão para verificar status atual  
✅ **Reconexão Automática** - Botão para forçar reconexão  
✅ **Configuração de Instância** - Campos para ID e token  
✅ **Salvamento no Banco** - Persiste configurações  
✅ **Interface Integrada** - Adicionada na página de configurações existente  

## 🚨 **Em Caso de Problemas:**

### **Erro 500 nas APIs:**
- Verifique se as rotas `/api/zapi/testar-conexao` e `/api/zapi/reconectar` foram criadas
- Confirme se o Next.js está rodando

### **Tabela não criada:**
- Execute novamente o script SQL
- Verifique se não há erros de sintaxe

### **Campos não aparecem:**
- Recarregue a página
- Verifique o console do navegador para erros

## 📱 **Como Funciona:**

1. **Sistema verifica** status da Z-API automaticamente
2. **Botão "Testar"** faz verificação manual
3. **Botão "Reconectar"** força nova conexão
4. **Status visual** mostra situação atual
5. **Configurações** são salvas no banco

## 🎯 **Resultado Esperado:**

Após executar todos os passos, você deve ver na página de configurações:
- Um novo card "Configurações Z-API (WhatsApp)"
- Status visual da conexão
- Campos para configurar instância e token
- Botões para testar e reconectar
- Funcionalidade completa de reconexão

---

**✅ Funcionalidade implementada com sucesso!**  
**🚀 Sistema Z-API integrado ao painel administrativo!**
