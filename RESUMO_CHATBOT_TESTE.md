# 🤖 Chatbot Sorveteria Talos - Teste Beta

## **📋 Resumo do Projeto:**
Implementamos um **chatbot inteligente** para a Sorveteria Talos que atende clientes via WhatsApp usando Z-API + N8N + Supabase.

## **✅ Funcionalidades Implementadas:**

### **🍦 Atendimento Geral:**
- **Nome do Bot:** Talos
- **Tom:** Simpático e acolhedor
- **Respostas:** Sempre direciona para o delivery online
- **Link Principal:** https://pdv-talos.vercel.app/delivery

### **📦 Consulta de Pedidos (NOVA):**
- Cliente informa o telefone
- Bot consulta pedidos ativos no banco
- Retorna status, valor, data e endereço
- **Exemplo:** "Encontrei 2 pedido(s) ativo(s) para você..."

### **🛒 Orientação de Vendas:**
- Direciona para cardápio online
- Não dá preços específicos
- Foca na conversão para o site

## **🔧 Tecnologia:**
- **Z-API:** Recebe mensagens WhatsApp
- **N8N:** Orquestra o fluxo
- **Supabase:** Banco de dados + Edge Function
- **Edge Function:** API para consulta de pedidos

## **📱 Como Testar:**

### **Cenário 1 - Cliente Curioso:**
```
Cliente: "Oi, vocês têm sorvete de chocolate?"
Bot: "Oi! 😊 Temos sim, e muito mais! 🍫
Acesse: https://pdv-talos.vercel.app/delivery"
```

### **Cenário 2 - Consulta de Pedido:**
```
Cliente: "Quero saber do meu pedido"
Bot: "Claro! 😊 Pode me passar seu telefone?"
Cliente: "16991188724"
Bot: "Encontrei 2 pedido(s) ativo(s) para você:
1. Pedido #001 - R$ 82,00 | Status: Pendente | Data: 24/07
2. Pedido #002 - R$ 70,00 | Status: Pendente | Data: 24/07"
```

### **Cenário 3 - Quer Fazer Pedido:**
```
Cliente: "Quero fazer um pedido"
Bot: "Perfeito! 🎉 Acesse: https://pdv-talos.vercel.app/delivery"
```

## **⚠️ Dados Institucionais:**
**Aguardando implementação amanhã:**
- Horário de funcionamento específico
- Endereço físico da loja
- Tempo de entrega por região
- Políticas de troca/devolução

## **🎯 Objetivo do Teste:**
1. **Verificar respostas** do chatbot
2. **Testar consulta de pedidos** (use telefone: 16991188724)
3. **Avaliar tom de comunicação**
4. **Identificar melhorias necessárias**

## **📝 Feedback Necessário:**
- As respostas estão adequadas?
- O tom está simpático?
- A consulta de pedidos funciona bem?
- Que funcionalidades estão faltando?
- Sugestões de melhorias?

## **🔗 Links Úteis:**
- **Delivery:** https://pdv-talos.vercel.app/delivery
- **Prompt Completo:** `prompt-chatbot-sorveteria.md`
- **Edge Function:** `supabase/functions/consultar-pedidos/`

---
**Status:** ✅ Funcionando | **Próximo:** Dados institucionais amanhã 