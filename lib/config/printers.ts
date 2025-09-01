// Configurações para diferentes tipos de impressoras térmicas
export interface PrinterConfig {
  name: string;
  width: string;
  height: string;
  fontSize: string;
  lineHeight: string;
  margins: string;
  orientation: 'portrait' | 'landscape';
  fontFamily: string;
}

// Configurações padrão para impressoras térmicas 80mm
export const THERMAL_80MM: PrinterConfig = {
  name: 'Impressora Térmica 80mm',
  width: '80mm',
  height: 'auto',
  fontSize: '10px',
  lineHeight: '1.2',
  margins: '0 0 0 2mm', // top right bottom left - margem esquerda de 2mm
  orientation: 'portrait',
  fontFamily: 'Courier New, Monaco, Menlo, monospace'
};

// Configurações para impressoras térmicas 58mm
export const THERMAL_58MM: PrinterConfig = {
  name: 'Impressora Térmica 58mm',
  width: '58mm',
  height: 'auto',
  fontSize: '8px',
  lineHeight: '1.1',
  margins: '0 0 0 1.5mm', // top right bottom left - margem esquerda de 1.5mm
  orientation: 'portrait',
  fontFamily: 'Courier New, Monaco, Menlo, monospace'
};

// Configurações para impressoras térmicas 112mm
export const THERMAL_112MM: PrinterConfig = {
  name: 'Impressora Térmica 112mm',
  width: '112mm',
  height: 'auto',
  fontSize: '12px',
  lineHeight: '1.3',
  margins: '0 0 0 3mm', // top right bottom left - margem esquerda de 3mm
  orientation: 'portrait',
  fontFamily: 'Courier New, Menlo, monospace'
};

// Configurações para impressoras de mesa (A4)
export const DESKTOP_A4: PrinterConfig = {
  name: 'Impressora de Mesa A4',
  width: '210mm',
  height: '297mm',
  fontSize: '12px',
  lineHeight: '1.4',
  margins: '10mm',
  orientation: 'portrait',
  fontFamily: 'Arial, sans-serif'
};

// Mapeamento de tipos de impressora
export const PRINTER_TYPES = {
  'thermal-80mm': THERMAL_80MM,
  'thermal-58mm': THERMAL_58MM,
  'thermal-112mm': THERMAL_112MM,
  'desktop-a4': DESKTOP_A4
};

// Função para obter configuração de impressora
export function getPrinterConfig(type: keyof typeof PRINTER_TYPES): PrinterConfig {
  return PRINTER_TYPES[type] || THERMAL_80MM;
}

// Função para gerar CSS baseado na configuração da impressora
export function generatePrinterCSS(config: PrinterConfig): string {
  return `
         /* Configurações específicas para ${config.name} */
     body {
       font-family: ${config.fontFamily};
       font-size: ${config.fontSize};
       line-height: ${config.lineHeight};
       color: #000;
       background: #fff;
       width: ${config.width};
       max-width: ${config.width};
       margin: 0;
       padding: 3mm 2mm 2mm 4mm; /* top right bottom left - mais espaço à esquerda */
       white-space: pre-wrap;
       word-wrap: break-word;
       overflow-wrap: break-word;
     }
    
         @media print {
       body {
         margin: 0 !important;
         padding: 3mm 2mm 2mm 4mm !important; /* top right bottom left - mais espaço à esquerda */
         width: ${config.width} !important;
         max-width: ${config.width} !important;
         font-size: ${config.fontSize} !important;
         line-height: ${config.lineHeight} !important;
       }
      
      @page {
        margin: ${config.margins} !important;
        size: ${config.width} auto !important;
        width: ${config.width} !important;
        max-width: ${config.width} !important;
        orientation: ${config.orientation} !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
      }
      
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .printer-content {
        font-size: ${config.fontSize} !important;
        line-height: ${config.lineHeight} !important;
        margin: 0 !important;
        padding: 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
      }
      
      /* Evitar quebras de página desnecessárias */
      body {
        page-break-after: avoid !important;
        page-break-before: avoid !important;
      }
      
      /* Garantir que o conteúdo não quebre em páginas desnecessárias */
      .print-preview {
        page-break-after: avoid !important;
        page-break-before: avoid !important;
        page-break-inside: avoid !important;
      }
    }
    
         .print-preview {
       font-family: ${config.fontFamily};
       font-size: ${config.fontSize};
       line-height: ${config.lineHeight};
       white-space: pre-wrap;
       word-wrap: break-word;
       overflow-wrap: break-word;
       width: ${config.width};
       max-width: ${config.width};
       border: none;
       padding: 8px 5px 5px 8px; /* top right bottom left - mais espaço à esquerda */
       background: #fff;
       margin: 20px auto;
     }
  `;
}
