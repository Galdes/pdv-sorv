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

      // Criar iframe para impressão
      const printFrame = document.createElement('iframe');
      printFrame.style.display = 'none';
      printFrame.style.position = 'fixed';
      printFrame.style.left = '-9999px';
      printFrame.style.top = '-9999px';
      printFrame.style.width = '80mm';
      printFrame.style.height = 'auto';
      printFrame.style.border = 'none';

      document.body.appendChild(printFrame);

      // Aguardar o iframe carregar
      await new Promise<void>((resolve) => {
        printFrame.onload = () => resolve();
      });

            // Escrever conteúdo HTML otimizado para impressão térmica
      printFrame.contentDocument?.write(`
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

      printFrame.contentDocument?.close();

      // Aguardar um pouco para garantir que o conteúdo foi renderizado
      await new Promise(resolve => setTimeout(resolve, 500));

      // Tentar imprimir
      if (printFrame.contentWindow) {
        // Configurar opções de impressão se disponíveis
        if ('print' in printFrame.contentWindow) {
          // Tentar usar a API de impressão moderna se disponível
          try {
            // @ts-ignore - Verificar se a API de impressão está disponível
            if (printFrame.contentWindow.print && typeof printFrame.contentWindow.print === 'function') {
              printFrame.contentWindow.print();
              
              // Aguardar a impressão ser concluída
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              return {
                success: true,
                message: 'Documento enviado para impressão com sucesso'
              };
            }
          } catch (error) {
            console.warn('Erro na API de impressão moderna:', error);
          }
        }

        // Fallback para método tradicional
        printFrame.contentWindow.print();
        
        // Aguardar a impressão ser concluída
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          success: true,
          message: 'Documento enviado para impressão com sucesso'
        };
      }

      throw new Error('Não foi possível acessar a janela de impressão');

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
      
      // Limpar o iframe após um delay para permitir que a impressão seja processada
      setTimeout(() => {
        const existingFrame = document.querySelector('iframe[style*="left: -9999px"]');
        if (existingFrame) {
          document.body.removeChild(existingFrame);
        }
      }, 3000);
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
