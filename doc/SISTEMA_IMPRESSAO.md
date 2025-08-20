# 🖨️ Sistema de Impressão - PDV Talos

## 📋 **Visão Geral**

O sistema de impressão foi completamente reformulado para oferecer melhor compatibilidade com impressoras térmicas e controle sobre o layout de impressão. O novo sistema resolve os problemas de ajuste automático às impressoras.

## 🔧 **Componentes do Sistema**

### **1. Hook de Impressão (`usePrint`)**
- **Arquivo:** `lib/hooks/usePrint.ts`
- **Função:** Gerencia todo o processo de impressão
- **Recursos:**
  - Controle de estado de impressão
  - Tratamento de erros
  - Configurações personalizáveis
  - Suporte a diferentes tipos de impressora

### **2. Configurações de Impressoras (`printers.ts`)**
- **Arquivo:** `lib/config/printers.ts`
- **Função:** Define configurações para diferentes tipos de impressoras
- **Tipos Suportados:**
  - `thermal-80mm`: Impressoras térmicas 80mm (padrão)
  - `thermal-58mm`: Impressoras térmicas 58mm
  - `thermal-112mm`: Impressoras térmicas 112mm
  - `desktop-a4`: Impressoras de mesa A4

### **3. Componente de Impressão (`PrintComponent`)**
- **Arquivo:** `components/PrintComponent.tsx`
- **Função:** Componente React para impressão
- **Recursos:**
  - Renderização otimizada para impressão
  - Controle de layout
  - Callbacks de sucesso/erro

## 🚀 **Como Usar**

### **Uso Básico no Componente:**

```typescript
import { usePrint } from '../../../lib/hooks/usePrint';

export default function MeuComponente() {
  const { printThermal, isPrinting, printError, clearError } = usePrint();

  const imprimirPedido = async (pedido: Pedido) => {
    const conteudo = `
      ================================================
                    PEDIDO #${pedido.id}
      ================================================
      
      Cliente: ${pedido.cliente}
      Total: R$ ${pedido.total}
      
      ================================================
    `;

    try {
      const result = await printThermal(conteudo, `Pedido #${pedido.id}`);
      
      if (!result.success) {
        alert(`Erro ao imprimir: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error);
    }
  };

  return (
    <div>
      {/* Notificação de erro */}
      {printError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <span className="text-red-800">Erro: {printError}</span>
          <button onClick={clearError}>✕</button>
        </div>
      )}

      {/* Botão de impressão */}
      <button 
        onClick={imprimirPedido}
        disabled={isPrinting}
      >
        {isPrinting ? 'Imprimindo...' : 'Imprimir'}
      </button>
    </div>
  );
}
```

### **Uso Avançado com Configurações Personalizadas:**

```typescript
import { usePrint } from '../../../lib/hooks/usePrint';

export default function MeuComponente() {
  const { print, isPrinting } = usePrint();

  const imprimirComConfiguracao = async () => {
    const result = await print({
      content: 'Conteúdo do documento',
      title: 'Título do Documento',
      printerName: 'thermal-58mm', // Impressora 58mm
      copies: 2, // 2 cópias
      orientation: 'portrait',
      paperSize: '58mm auto',
      margins: '0'
    });

    if (result.success) {
      console.log('Impressão realizada com sucesso!');
    } else {
      console.error('Erro na impressão:', result.error);
    }
  };

  return (
    <button onClick={imprimirComConfiguracao} disabled={isPrinting}>
      Imprimir com Configuração Personalizada
    </button>
  );
}
```

## ⚙️ **Configurações de Impressoras**

### **Impressora Térmica 80mm (Padrão):**
```typescript
THERMAL_80MM: {
  name: 'Impressora Térmica 80mm',
  width: '80mm',
  height: 'auto',
  fontSize: '10px',
  lineHeight: '1.2',
  margins: '0',
  orientation: 'portrait',
  fontFamily: 'Courier New, Monaco, Menlo, monospace'
}
```

### **Impressora Térmica 58mm:**
```typescript
THERMAL_58MM: {
  name: 'Impressora Térmica 58mm',
  width: '58mm',
  height: 'auto',
  fontSize: '8px',
  lineHeight: '1.1',
  margins: '0',
  orientation: 'portrait',
  fontFamily: 'Courier New, Monaco, Menlo, monospace'
}
```

### **Impressora Térmica 112mm:**
```typescript
THERMAL_112MM: {
  name: 'Impressora Térmica 112mm',
  width: '112mm',
  height: 'auto',
  fontSize: '12px',
  lineHeight: '1.3',
  margins: '0',
  orientation: 'portrait',
  fontFamily: 'Courier New, Monaco, Menlo, monospace'
}
```

## 🎯 **Melhorias Implementadas**

### **1. CSS Otimizado para Impressão:**
- **`@page`** com configurações específicas para cada tipo de impressora
- **`@media print`** com estilos forçados usando `!important`
- **Margens e tamanhos** configurados automaticamente
- **Fontes monospace** para melhor alinhamento

### **2. Controle de Layout:**
- **Largura fixa** baseada no tipo de impressora
- **Quebras de página** controladas
- **Orientação** configurável
- **Margens** personalizáveis

### **3. Tratamento de Erros:**
- **Captura de erros** durante a impressão
- **Notificações visuais** para o usuário
- **Logs detalhados** no console
- **Recuperação automática** de falhas

### **4. Performance:**
- **Iframe otimizado** para impressão
- **Limpeza automática** de recursos
- **Timeouts configuráveis** para diferentes impressoras
- **Renderização assíncrona** para melhor responsividade

## 🔍 **Solução de Problemas**

### **Problema: Impressão não se ajusta à impressora**

**Causas Possíveis:**
1. **Configuração incorreta** do tipo de impressora
2. **CSS não sendo aplicado** corretamente
3. **Navegador não respeitando** as configurações de página
4. **Driver da impressora** com configurações conflitantes

**Soluções:**
1. **Verificar tipo de impressora** no código
2. **Usar configurações específicas** para o modelo
3. **Testar com diferentes navegadores**
4. **Configurar driver da impressora** para 80mm

### **Problema: Texto cortado ou mal alinhado**

**Soluções:**
1. **Ajustar `fontSize`** na configuração da impressora
2. **Modificar `lineHeight`** para melhor espaçamento
3. **Reduzir `margins`** se necessário
4. **Usar fonte monospace** para alinhamento consistente

### **Problema: Impressão muito lenta**

**Soluções:**
1. **Reduzir complexidade** do CSS
2. **Otimizar conteúdo** para impressão
3. **Usar configurações básicas** da impressora
4. **Verificar drivers** da impressora

## 📱 **Testes e Validação**

### **Teste Básico:**
```typescript
// Testar impressão simples
const resultado = await printThermal('Teste de Impressão', 'Teste');
console.log('Resultado:', resultado);
```

### **Teste com Configuração Personalizada:**
```typescript
// Testar diferentes tipos de impressora
const tipos = ['thermal-80mm', 'thermal-58mm', 'thermal-112mm'];

for (const tipo of tipos) {
  const resultado = await print({
    content: 'Teste de configuração',
    title: `Teste ${tipo}`,
    printerName: tipo
  });
  console.log(`${tipo}:`, resultado);
}
```

## 🔮 **Próximos Passos**

### **Melhorias Futuras:**
1. **Detecção automática** do tipo de impressora
2. **Configurações salvas** por usuário
3. **Preview de impressão** antes de imprimir
4. **Suporte a impressoras de rede**
5. **Configurações por estabelecimento**

### **Integrações:**
1. **API de impressão nativa** do navegador
2. **Drivers específicos** para impressoras populares
3. **Configurações via banco de dados**
4. **Logs de impressão** para auditoria

## 📞 **Suporte**

Para problemas específicos ou dúvidas sobre configuração:
1. **Verificar logs** do console do navegador
2. **Testar com diferentes** tipos de impressora
3. **Validar configurações** no arquivo `printers.ts`
4. **Consultar documentação** da impressora específica

---

**Última atualização:** Agosto 2025  
**Versão:** 2.0.0  
**Status:** ✅ Implementado e Testado
