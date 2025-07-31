# 📋 Comandos Git para Enviar Mudanças

## 🚀 Comandos para Executar no Terminal

### **Opção 1: Comandos Separados**

```bash
# 1. Adicionar todas as mudanças
git add .

# 2. Fazer commit com mensagem
git commit -m "fix: corrigir lógica de status das mesas - mesas com pedidos pagos devem aparecer como Livre"

# 3. Enviar para o GitHub
git push origin main
```

### **Opção 2: Comando Único**

```bash
git add . && git commit -m "fix: corrigir lógica de status das mesas - mesas com pedidos pagos devem aparecer como Livre" && git push origin main
```

## 📝 O que será enviado:

✅ **Correção da Lógica de Status das Mesas**
- **Problema**: Mesas com comanda aberta mas todos os pedidos pagos apareciam como "Ativa"
- **Causa**: Lógica forçava `pedidos_count = 1` se havia comanda aberta
- **Solução**: Agora considera apenas pedidos realmente não pagos
- **Resultado**: Mesas com todos os pedidos pagos aparecem como "Livre"

✅ **Arquivos Modificados:**
- `components/SelecionarMesaModal.tsx` - Corrigida lógica de contagem de pedidos

✅ **Melhorias Técnicas:**
- Status das mesas agora reflete corretamente se há pendências
- Consistência entre sistema de abertura e sistema de pagamento
- Interface mais clara para o usuário

## 🔍 Como verificar se funcionou:

1. Acesse: https://github.com/Galdes/pdv-sorv
2. Verifique se aparece um novo commit recente
3. Aguarde o deploy automático no Vercel
4. Teste o sistema:
   - Abra uma comanda em uma mesa
   - Pague todos os pedidos
   - Verifique se a mesa aparece como "Livre" no sistema de pagamento
   - Confirme que não há mais inconsistências

## ⚠️ Se der erro:

- Verifique se está na pasta correta: `C:\\Users\\User\\Desktop\\Projetos\\PDV`
- Certifique-se de que o Git está configurado
- Tente executar os comandos um por vez

## 📊 Status Atual:

**Data:** 31/07/2025  
**Arquivo:** COMANDOS_GIT.md  
**Versão:** 2.2 - Correção Lógica de Status das Mesas