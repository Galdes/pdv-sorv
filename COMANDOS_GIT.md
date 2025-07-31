# 📋 Comandos Git para Enviar Mudanças

## 🚀 Comandos para Executar no Terminal

### **Opção 1: Comandos Separados**

```bash
# 1. Adicionar todas as mudanças
git add .

# 2. Fazer commit com mensagem
git commit -m "fix: corrigir lógica de disponibilidade das mesas - considerar pedidos pagos"

# 3. Enviar para o GitHub
git push origin main
```

### **Opção 2: Comando Único**

```bash
git add . && git commit -m "fix: corrigir lógica de disponibilidade das mesas - considerar pedidos pagos" && git push origin main
```

## 📝 O que será enviado:

✅ **Correção da Lógica de Disponibilidade das Mesas**
- **Problema**: Mesas apareciam como "ocupadas" mesmo com todos os pedidos pagos
- **Causa**: Função `mesa_disponivel()` era muito restritiva - considerava ocupada se havia comanda aberta
- **Solução**: Nova função `mesa_disponivel_melhorada()` que considera pedidos pagos
- **Arquivos Modificados**:
  - `doc/funcoes_pagamento_comandas.sql` - Nova função SQL
  - `app/abrir-comanda/page.tsx` - Migrado para nova função
  - `app/abrir-comanda/[mesa_id]/page.tsx` - Migrado para nova função

✅ **Nova Lógica de Disponibilidade**
- **Mesa Livre**: Não há comandas abertas OU há comandas abertas mas todos os pedidos estão pagos
- **Mesa Ocupada**: Há comandas abertas com pedidos pendentes
- **Compatibilidade**: Função original mantida para sistemas que precisam de verificação mais restritiva

✅ **Suporte a Múltiplas Comandas**
- **Cenário**: Vários amigos na mesma mesa, cada um com sua comanda
- **Funcionamento**: Mesa fica "ocupada" enquanto há pedidos pendentes
- **Liberação**: Mesa fica "livre" quando todos os pedidos são pagos

## 🔧 Detalhes das Correções:

### **1. Nova Função SQL (`mesa_disponivel_melhorada`)**
```sql
-- Considera mesa disponível se:
-- 1. Não há comandas abertas OU
-- 2. Há comandas abertas mas todos os pedidos estão pagos
```

### **2. Lógica Anterior vs Nova**
- **Antes**: Mesa = ocupada se há comanda aberta (muito restritiva)
- **Depois**: Mesa = ocupada se há comanda aberta COM pedidos pendentes

### **3. Cenários de Teste**
- ✅ Mesa com comanda aberta e pedidos pagos = LIVRE
- ✅ Mesa com comanda aberta e pedidos pendentes = OCUPADA
- ✅ Mesa sem comandas = LIVRE
- ✅ Múltiplas comandas na mesma mesa = OCUPADA (se há pedidos pendentes)

## 🎯 Benefícios das Correções:

1. **Flexibilidade**: Permite múltiplas comandas por mesa
2. **Precisão**: Status correto baseado em pedidos pendentes
3. **Experiência**: Clientes podem abrir comandas mesmo com amigos na mesa
4. **Controle**: Garçom pode fazer pedidos para mesa com comandas existentes
5. **Automação**: Mesa libera automaticamente quando todos pagam

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
- **NOVO**: Executar script SQL das novas funções

## 🔍 Como verificar se funcionou:

1. Acesse: https://github.com/Galdes/pdv-sorv
2. Verifique se aparece um novo commit recente
3. Aguarde o deploy automático no Vercel
4. **Execute o script SQL**: `doc/funcoes_pagamento_comandas.sql`
5. Teste o sistema:
   - Abra uma comanda em uma mesa
   - Pague todos os pedidos
   - Verifique se a mesa aparece como "Livre"
   - Teste múltiplas comandas na mesma mesa

## ⚠️ Se der erro:

- Verifique se está na pasta correta: `C:\Users\User\Desktop\Projetos\PDV`
- Certifique-se de que o Git está configurado
- Tente executar os comandos um por vez
- **Importante**: Execute o script SQL no Supabase antes de testar

---

**Data:** 31/07/2025  
**Arquivo:** COMANDOS_GIT.md  
**Versão:** 2.1 - Correção Lógica de Disponibilidade das Mesas