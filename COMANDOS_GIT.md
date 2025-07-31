# 📋 Comandos Git para Enviar Mudanças

## 🚀 Comandos para Executar no Terminal

### **Opção 1: Comandos Separados**

```bash
# 1. Adicionar todas as mudanças
git add .

# 2. Fazer commit com mensagem
git commit -m "feat: implementar verificação por telefones únicos - reutilização de comandas"

# 3. Enviar para o GitHub
git push origin main
```

### **Opção 2: Comando Único**

```bash
git add . && git commit -m "feat: implementar verificação por telefones únicos - reutilização de comandas" && git push origin main
```

## 📝 O que será enviado:

✅ **Implementação da Verificação por Telefones Únicos**
- **Problema**: Sistema não permitia múltiplas comandas e perdia comandas ao fechar navegador
- **Solução**: Verificação por telefones únicos + reutilização de comandas existentes
- **Resultado**: Amigos podem abrir comandas e clientes recuperam comandas perdidas

✅ **Arquivos Modificados:**
- `app/abrir-comanda/[mesa_id]/page.tsx` - Nova lógica de verificação por telefones únicos

✅ **Funcionalidades Implementadas:**
- **Verificação por Telefones**: Capacidade da mesa = máximo de telefones únicos
- **Reutilização de Comandas**: Mesmo telefone reutiliza comanda existente
- **Recuperação de Comandas**: Cliente não perde comanda ao fechar navegador
- **Lógica Simples**: Baseada em telefones únicos, não em comandas

✅ **Cenários Suportados:**
- **Múltiplos amigos**: Cada telefone único pode ter uma comanda
- **Recuperação**: Cliente pode reabrir comanda com mesmo telefone
- **Limite de Capacidade**: Máximo de telefones únicos = capacidade da mesa
- **Flexibilidade**: Sistema funciona mesmo se cliente fechar navegador

## 🔍 Como verificar se funcionou:

1. Acesse: https://github.com/Galdes/pdv-sorv
2. Verifique se aparece um novo commit recente
3. Aguarde o deploy automático no Vercel
4. Teste o sistema:
   - Abra uma comanda com telefone A
   - Abra outra comanda com telefone B (deve funcionar)
   - Tente abrir com telefone A novamente (deve reutilizar comanda)
   - Continue até atingir capacidade da mesa
   - Verifique se aparece mensagem de limite atingido

## ⚠️ Se der erro:

- Verifique se está na pasta correta: `C:\\Users\\User\\Desktop\\Projetos\\PDV`
- Certifique-se de que o Git está configurado
- Tente executar os comandos um por vez

## 📊 Status Atual:

**Data:** 31/07/2025  
**Arquivo:** COMANDOS_GIT.md  
**Versão:** 2.6 - Verificação por Telefones Únicos