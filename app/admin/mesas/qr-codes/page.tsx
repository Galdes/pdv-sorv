'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import QRCodeLib from 'qrcode';
import { supabase } from '../../../../lib/supabaseClient';
import type { Mesa } from '../../../../lib/types';
import AdminLayout, { AdminCard, AdminButton } from '../../../../components/AdminLayout';

export default function QRCodePage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMesas, setSelectedMesas] = useState<Set<string>>(new Set());

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (!userData) {
      router.push('/admin/login');
      return;
    }
    setAdminUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => {
    if (!adminUser) return;
    fetchMesas();
  }, [adminUser]);

  const fetchMesas = async () => {
    setLoading(true);
    try {
      const { data: mesas, error: errMesas } = await supabase
        .from('mesas')
        .select('*')
        .eq('bar_id', adminUser.bar_id)
        .eq('ativa', true)
        .order('numero');
      if (errMesas) throw errMesas;
      setMesas(mesas || []);
    } catch (err: any) {
      console.error('Erro ao buscar mesas:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (mesaId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/abrir-comanda/${mesaId}`;
  };

  const generateQRCodeSVG = async (text: string) => {
    try {
      // Usar biblioteca qrcode para gerar SVG
      const svg = await QRCodeLib.toString(text, {
        type: 'svg',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return svg;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      // Fallback para API externa
      const encodedText = encodeURIComponent(text);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}&format=svg`;
      return `<img src="${qrCodeUrl}" alt="QR Code" width="200" height="200" style="border: 1px solid #ccc;"/>`;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const printQRCode = async (mesa: Mesa) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const qrCodeUrl = generateQRCode(mesa.id);
      
      // Gerar QR Code como SVG
      const qrCodeSvg = await generateQRCodeSVG(qrCodeUrl);
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - Mesa ${mesa.numero}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .qr-container {
              display: inline-block;
              padding: 20px;
              border: 2px solid #333;
              border-radius: 10px;
              margin: 10px;
            }
            .mesa-info {
              margin-bottom: 15px;
            }
            .mesa-numero {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .mesa-descricao {
              font-size: 14px;
              color: #666;
            }
            .qr-code {
              margin: 15px 0;
              display: flex;
              justify-content: center;
            }
            .link-info {
              font-size: 12px;
              color: #999;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="mesa-info">
              <div class="mesa-numero">Mesa ${mesa.numero}</div>
              ${mesa.descricao ? `<div class="mesa-descricao">${mesa.descricao}</div>` : ''}
            </div>
            <div class="qr-code">
              ${qrCodeSvg}
            </div>
            <div class="link-info">
              Link: ${qrCodeUrl}
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const printSelectedQRCodes = async () => {
    if (selectedMesas.size === 0) {
      alert('Selecione pelo menos uma mesa para imprimir');
      return;
    }

    const selectedMesasList = mesas.filter(mesa => selectedMesas.has(mesa.id));
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Gerar todos os QR Codes primeiro
      const qrCodesPromises = selectedMesasList.map(async (mesa) => {
        const qrCodeUrl = generateQRCode(mesa.id);
        const qrCodeSvg = await generateQRCodeSVG(qrCodeUrl);
        return { mesa, qrCodeUrl, qrCodeSvg };
      });

      const qrCodes = await Promise.all(qrCodesPromises);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Codes - ${selectedMesasList.length} Mesas</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .qr-container {
              display: inline-block;
              padding: 20px;
              border: 2px solid #333;
              border-radius: 10px;
              margin: 10px;
              page-break-inside: avoid;
            }
            .mesa-info {
              margin-bottom: 15px;
            }
            .mesa-numero {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .mesa-descricao {
              font-size: 14px;
              color: #666;
            }
            .qr-code {
              margin: 15px 0;
            }
            .link-info {
              font-size: 12px;
              color: #999;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          ${qrCodes.map(({ mesa, qrCodeUrl, qrCodeSvg }) => `
            <div class="qr-container">
              <div class="mesa-info">
                <div class="mesa-numero">Mesa ${mesa.numero}</div>
                ${mesa.descricao ? `<div class="mesa-descricao">${mesa.descricao}</div>` : ''}
              </div>
              <div class="qr-code">
                ${qrCodeSvg}
              </div>
              <div class="link-info">
                Link: ${qrCodeUrl}
              </div>
            </div>
          `).join('')}
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 1000);
    }
  };

  const toggleMesaSelection = (mesaId: string) => {
    const newSelected = new Set(selectedMesas);
    if (newSelected.has(mesaId)) {
      newSelected.delete(mesaId);
    } else {
      newSelected.add(mesaId);
    }
    setSelectedMesas(newSelected);
  };

  const selectAllMesas = () => {
    setSelectedMesas(new Set(mesas.map(mesa => mesa.id)));
  };

  const deselectAllMesas = () => {
    setSelectedMesas(new Set());
  };

  if (!adminUser) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <AdminLayout
      title="QR Codes para Impressão"
      subtitle="Visualize e imprima QR Codes para todas as mesas"
      onBack={() => router.push('/admin/mesas')}
      actions={
        <div className="flex space-x-2">
          <AdminButton
            variant="warning"
            onClick={selectAllMesas}
            title="Selecionar todas as mesas"
          >
            Selecionar Todas
          </AdminButton>
          <AdminButton
            variant="secondary"
            onClick={deselectAllMesas}
            title="Desmarcar todas as mesas"
          >
            Desmarcar Todas
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={printSelectedQRCodes}
            title="Imprimir QR Codes das mesas selecionadas"
          >
            Imprimir Selecionadas ({selectedMesas.size})
          </AdminButton>
        </div>
      }
    >
      {loading ? (
        <div className="text-center">Carregando mesas...</div>
      ) : mesas.length === 0 ? (
        <div className="text-center text-gray-600">Nenhuma mesa ativa encontrada</div>
      ) : (
        <>
          {/* Grid de QR Codes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {mesas.map((mesa) => (
              <AdminCard key={mesa.id} className="text-center">
                {/* Checkbox de seleção */}
                <div className="flex justify-center mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMesas.has(mesa.id)}
                      onChange={() => toggleMesaSelection(mesa.id)}
                      className="mr-2 w-4 h-4"
                      title="Selecionar esta mesa para impressão"
                    />
                    <span className="text-sm font-medium">Selecionar para impressão</span>
                  </label>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold">Mesa {mesa.numero}</h3>
                  {mesa.descricao && (
                    <p className="text-sm text-gray-600 mt-1">{mesa.descricao}</p>
                  )}
                  <p className="text-sm text-gray-500">Capacidade: {mesa.capacidade} pessoas</p>
                </div>
                
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                    <QRCode
                      value={generateQRCode(mesa.id)}
                      size={150}
                      level="M"
                      title={`QR Code da Mesa ${mesa.numero}`}
                      style={{ display: 'block' }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <AdminButton
                    variant="primary"
                    size="sm"
                    onClick={() => printQRCode(mesa)}
                    title="Imprimir QR Code desta mesa"
                  >
                    Imprimir Individual
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(generateQRCode(mesa.id))}
                    title="Copiar link da mesa"
                  >
                    Copiar Link
                  </AdminButton>
                  <AdminButton
                    variant="success"
                    size="sm"
                    onClick={() => {
                      const link = generateQRCode(mesa.id);
                      window.open(link, '_blank');
                    }}
                    title="Testar link da mesa"
                  >
                    Testar Link
                  </AdminButton>
                </div>
              </AdminCard>
            ))}
          </div>

          {/* Instruções */}
          <AdminCard title="Instruções de Impressão">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">✅ Seleção de Mesas:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Marque as checkboxes das mesas que deseja imprimir</li>
                  <li>• Use "Selecionar Todas" para marcar todas as mesas</li>
                  <li>• Use "Desmarcar Todas" para limpar a seleção</li>
                  <li>• O contador mostra quantas mesas estão selecionadas</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🖨️ Para Imprimir Selecionadas:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Selecione as mesas desejadas com as checkboxes</li>
                  <li>• Clique em "Imprimir Selecionadas" no topo da página</li>
                  <li>• Uma nova janela será aberta com os QR Codes formatados</li>
                  <li>• Use Ctrl+P para imprimir</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🖨️ Para Imprimir Individualmente:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Clique em "Imprimir Individual" em cada QR Code</li>
                  <li>• Uma nova janela será aberta com o QR Code formatado</li>
                  <li>• Use Ctrl+P para imprimir</li>
                  <li>• Cole na mesa correspondente</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📱 Para Testar:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use "Testar Link" para verificar se o QR Code funciona</li>
                  <li>• Use "Copiar Link" para compartilhar manualmente</li>
                  <li>• Escaneie com o celular para testar o fluxo completo</li>
                </ul>
              </div>
            </div>
          </AdminCard>
        </>
      )}
    </AdminLayout>
  );
} 