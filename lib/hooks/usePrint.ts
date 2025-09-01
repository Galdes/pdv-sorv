import { useState, useCallback } from 'react';
import { getPrinterConfig, generatePrinterCSS, PrinterConfig } from '../config/printers';

interface PrintOptions {
  title?: string;
  content: string;
  printerName?: string;
  copies?: number;
  orientation?: 'portrait' | 'landscape';
  paperSize?: string;
  margins?: string;
}

interface PrintResult {
  success: boolean;
  error?: string;
  message?: string;
}

export function usePrint() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  const print = useCallback(async (options: PrintOptions): Promise<PrintResult> => {
    setIsPrinting(true);
    setPrintError(null);

    try {
      const {
        title = 'Documento',
        content,
        printerName = 'thermal-80mm',
        copies = 1,
        orientation = 'portrait',
        paperSize = '80mm auto',
        margins = '0'
      } = options;

      // Obter configuração da impressora
      const printerConfig = getPrinterConfig(printerName as keyof typeof import('../config/printers').PRINTER_TYPES);
      const printerCSS = generatePrinterCSS(printerConfig);

      // Criar nova janela para impressão
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        throw new Error('Não foi possível abrir janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.');
      }

      // Escrever conteúdo HTML otimizado para impressão térmica
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            /* Reset e configurações base */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            ${printerCSS}
          </style>
        </head>
        <body>
          <div class="print-preview printer-content">
            ${content}
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();

      // Aguardar um pouco para garantir que o conteúdo foi renderizado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Imprimir
      printWindow.print();
      
      // Aguardar a impressão ser concluída
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fechar a janela
      printWindow.close();
      
      return {
        success: true,
        message: 'Documento enviado para impressão com sucesso'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na impressão';
      setPrintError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        message: 'Falha ao imprimir documento'
      };
    } finally {
      setIsPrinting(false);
    }
  }, []);

  const printThermal = useCallback(async (content: string, title?: string): Promise<PrintResult> => {
    return print({
      content,
      title: title || 'Pedido',
      printerName: 'thermal-80mm',
      paperSize: '80mm auto',
      orientation: 'portrait',
      margins: '0'
    });
  }, [print]);

  const clearError = useCallback(() => {
    setPrintError(null);
  }, []);

  return {
    print,
    printThermal,
    isPrinting,
    printError,
    clearError
  };
}
