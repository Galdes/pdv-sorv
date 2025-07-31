# 📋 Comandos Git para Enviar Mudanças

## 🚀 Comandos para Executar no Terminal

### **Opção 1: Comandos Separados**

```bash
# 1. Adicionar todas as mudanças
git add .

# 2. Fazer commit com mensagem
git commit -m "feat: implementar verificação de capacidade das mesas - limite de comandas por mesa"

# 3. Enviar para o GitHub
git push origin main
```

### **Opção 2: Comando Único**

```bash
git add . && git commit -m "feat: implementar verificação de capacidade das mesas - limite de comandas por mesa" && git push origin main
```

## 📝 O que será enviado:

✅ **Implementação da Verificação de Capacidade das Mesas**
- **Problema**: Sistema não permitia múltiplas comandas na mesma mesa
- **Solução**: Capacidade da mesa = limite de comandas simultâneas
- **Resultado**: Amigos podem abrir comandas na mesma mesa

✅ **Arquivos Modificados:**
- `app/abrir-comanda/[mesa_id]/page.tsx` - Verificação de capacidade antes de criar comanda
- `app/abrir-comanda/page.tsx` - Exibição de informações de capacidade restante

✅ **Funcionalidades Implementadas:**
- **Verificação de Capacidade**: Antes de criar comanda, verifica se mesa não atingiu limite
- **Mensagem Clara**: "Capacidade de comandas atingiu seu limite. Para abrir uma nova comanda, solicite ao atendente que aumente a capacidade da mesa."
- **Informações Visuais**: Mostra comandas ativas e vagas restantes
- **Lógica Simples**: Usa campo `capacidade` existente sem alterar banco

✅ **Cenários Suportados:**
- **Múltiplos amigos**: Cada um pode abrir sua comanda na mesma mesa
- **Limite de Capacidade**: Mesa não aceita mais comandas quando atinge limite
- **Flexibilidade**: Dono pode ajustar capacidade conforme necessidade
- **Transparência**: Cliente vê quantas vagas restam na mesa

## 🔍 Como verificar se funcionou:

1. Acesse: https://github.com/Galdes/pdv-sorv
2. Verifique se aparece um novo commit recente
3. Aguarde o deploy automático no Vercel
4. Teste o sistema:
   - Abra uma comanda em uma mesa
   - Tente abrir outra comanda na mesma mesa (deve funcionar)
   - Continue até atingir a capacidade da mesa
   - Verifique se aparece mensagem de limite atingido
   - Confirme se as informações de capacidade são exibidas

## ⚠️ Se der erro:

- Verifique se está na pasta correta: `C:\\Users\\User\\Desktop\\Projetos\\PDV`
- Certifique-se de que o Git está configurado
- Tente executar os comandos um por vez

## 📊 Status Atual:

**Data:** 31/07/2025  
**Arquivo:** COMANDOS_GIT.md  
**Versão:** 2.5 - Verificação de Capacidade das Mesas