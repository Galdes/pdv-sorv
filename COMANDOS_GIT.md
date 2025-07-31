# 📋 Comandos Git para Enviar Mudanças

## 🚀 Comandos para Executar no Terminal

### **Opção 1: Comandos Separados**

```bash
# 1. Adicionar todas as mudanças
git add .

# 2. Fazer commit com mensagem
git commit -m "fix: corrigir inconsistência de status das mesas e padronizar verificação"

# 3. Enviar para o GitHub
git push origin main
```

### **Opção 2: Comando Único**

```bash
git add . && git commit -m "fix: corrigir inconsistência de status das mesas e padronizar verificação" && git push origin main
```

## 📝 O que será enviado:

✅ **Correções no Sistema de Comandas e Mesas**
- **Problema Resolvido**: Inconsistência entre status das mesas no sistema de pagamento vs abertura de comanda
- **Solução**: Padronização usando função SQL `mesa_disponivel()` em todos os sistemas
- **Arquivos Modificados**:
  - `app/abrir-comanda/page.tsx` - Corrigido cálculo de status das mesas
  - `app/abrir-comanda/[mesa_id]/page.tsx` - Migrado para função SQL
  - `components/SelecionarMesaModal.tsx` - Melhorada lógica de verificação

✅ **Melhorias Técnicas**
- **Performance**: Uso da função SQL otimizada `mesa_disponivel()`
- **Consistência**: Todos os sistemas usam a mesma lógica de verificação
- **Manutenibilidade**: Lógica centralizada na função SQL
- **Confiabilidade**: Verificação dupla no processo de abertura

✅ **Lógica Unificada**
- **Status da Mesa**: Baseado em comandas abertas (`status = 'aberta'`)
- **Sistema de Pagamento**: Considera comandas abertas + pedidos não pagos
- **Sistema de Abertura**: Verifica apenas comandas abertas

## 🔧 Detalhes das Correções:

### **1. Página Principal (`/abrir-comanda`)**
- **Antes**: Tentava acessar `mesa.status` (campo inexistente)
- **Depois**: Usa função SQL `mesa_disponivel()` para calcular status real
- **Resultado**: Mostra corretamente se mesa está livre ou ocupada

### **2. Página Específica (`/abrir-comanda/[mesa_id]`)**
- **Antes**: Query manual para verificar comandas abertas
- **Depois**: Migrado para função SQL `mesa_disponivel()`
- **Resultado**: Verificação mais eficiente e consistente

### **3. Sistema de Pagamento (`SelecionarMesaModal`)**
- **Antes**: Considerava apenas pedidos não pagos
- **Depois**: Considera comandas abertas + pedidos não pagos
- **Resultado**: Mesa aparece como "Ativa" se tem comanda aberta

## 🎯 Benefícios das Correções:

1. **Consistência**: Todos os sistemas usam a mesma lógica
2. **Performance**: Uso da função SQL otimizada
3. **Manutenibilidade**: Lógica centralizada na função SQL
4. **Confiabilidade**: Verificação dupla no processo de abertura
5. **Experiência do Usuário**: Status correto em todas as telas

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
4. Teste o sistema de comandas:
   - Abra uma comanda em uma mesa
   - Pague todos os pedidos
   - Verifique se o status está consistente em todas as telas

## ⚠️ Se der erro:

- Verifique se está na pasta correta: `C:\Users\User\Desktop\Projetos\PDV`
- Certifique-se de que o Git está configurado
- Tente executar os comandos um por vez

---

**Data:** 31/07/2025  
**Arquivo:** COMANDOS_GIT.md  
**Versão:** 2.0 - Correções Sistema de Comandas