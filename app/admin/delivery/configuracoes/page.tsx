'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import AdminLayout, { AdminCard, AdminButton, AdminInput } from '../../../../components/AdminLayout';

interface ConfigDelivery {
  id?: string;
  bar_id: string;
  ativo: boolean;
  taxa_entrega_fixa: number;
  taxa_entrega_por_km: number;
  raio_entrega_km: number;
  tempo_estimado_min: number;
  horario_inicio: string;
  horario_fim: string;
  dias_funcionamento: string[];
  valor_minimo_pedido: number;
  aceita_retirada: boolean;
  aceita_entrega: boolean;
}

export default function ConfiguracoesDeliveryPage() {
  const [config, setConfig] = useState<ConfigDelivery>({
    bar_id: '550e8400-e29b-41d4-a716-446655440000', // ID fixo para teste
    ativo: true,
    taxa_entrega_fixa: 0,
    taxa_entrega_por_km: 0,
    raio_entrega_km: 5.0,
    tempo_estimado_min: 30,
    horario_inicio: '10:00',
    horario_fim: '22:00',
    dias_funcionamento: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
    valor_minimo_pedido: 0,
    aceita_retirada: true,
    aceita_entrega: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const diasSemana = [
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('config_delivery')
        .select('*')
        .eq('bar_id', config.bar_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('config_delivery')
        .upsert({
          ...config,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleDiaChange = (dia: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      dias_funcionamento: checked 
        ? [...prev.dias_funcionamento, dia]
        : prev.dias_funcionamento.filter(d => d !== dia)
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando configurações...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚙️ Configurações de Delivery</h1>
            <p className="text-gray-600">Configure as opções de delivery do seu estabelecimento</p>
          </div>
          <AdminButton
            variant="secondary"
            onClick={() => router.push('/admin/delivery')}
          >
            Voltar
          </AdminButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações Gerais */}
          <AdminCard>
            <h3 className="text-lg font-semibold mb-4">Configurações Gerais</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.ativo}
                  onChange={(e) => setConfig(prev => ({ ...prev, ativo: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Ativar delivery
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.aceita_retirada}
                  onChange={(e) => setConfig(prev => ({ ...prev, aceita_retirada: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Aceitar retirada no local
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.aceita_entrega}
                  onChange={(e) => setConfig(prev => ({ ...prev, aceita_entrega: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Aceitar entrega em domicílio
                </label>
              </div>

              <AdminInput
                label="Valor mínimo do pedido (R$)"
                type="number"
                step="0.01"
                min="0"
                value={config.valor_minimo_pedido}
                onChange={(e) => setConfig(prev => ({ ...prev, valor_minimo_pedido: parseFloat(e.target.value) || 0 }))}
              />

              <AdminInput
                label="Tempo estimado de entrega (minutos)"
                type="number"
                min="1"
                value={config.tempo_estimado_min}
                onChange={(e) => setConfig(prev => ({ ...prev, tempo_estimado_min: parseInt(e.target.value) || 30 }))}
              />
            </div>
          </AdminCard>

          {/* Taxas de Entrega */}
          <AdminCard>
            <h3 className="text-lg font-semibold mb-4">Taxas de Entrega</h3>
            
            <div className="space-y-4">
              <AdminInput
                label="Taxa fixa de entrega (R$)"
                type="number"
                step="0.01"
                min="0"
                value={config.taxa_entrega_fixa}
                onChange={(e) => setConfig(prev => ({ ...prev, taxa_entrega_fixa: parseFloat(e.target.value) || 0 }))}
              />

              <AdminInput
                label="Taxa por km (R$)"
                type="number"
                step="0.01"
                min="0"
                value={config.taxa_entrega_por_km}
                onChange={(e) => setConfig(prev => ({ ...prev, taxa_entrega_por_km: parseFloat(e.target.value) || 0 }))}
              />

              <AdminInput
                label="Raio de entrega (km)"
                type="number"
                step="0.1"
                min="0"
                value={config.raio_entrega_km}
                onChange={(e) => setConfig(prev => ({ ...prev, raio_entrega_km: parseFloat(e.target.value) || 5 }))}
              />
            </div>
          </AdminCard>

          {/* Horário de Funcionamento */}
          <AdminCard>
            <h3 className="text-lg font-semibold mb-4">Horário de Funcionamento</h3>
            
            <div className="space-y-4">
              <AdminInput
                label="Horário de início"
                type="time"
                value={config.horario_inicio}
                onChange={(e) => setConfig(prev => ({ ...prev, horario_inicio: e.target.value }))}
              />

              <AdminInput
                label="Horário de fim"
                type="time"
                value={config.horario_fim}
                onChange={(e) => setConfig(prev => ({ ...prev, horario_fim: e.target.value }))}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias de funcionamento
                </label>
                <div className="space-y-2">
                  {diasSemana.map((dia) => (
                    <div key={dia.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.dias_funcionamento.includes(dia.value)}
                        onChange={(e) => handleDiaChange(dia.value, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        {dia.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AdminCard>

          {/* Preview */}
          <AdminCard>
            <h3 className="text-lg font-semibold mb-4">Resumo das Configurações</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery ativo:</span>
                <span className={config.ativo ? 'text-green-600' : 'text-red-600'}>
                  {config.ativo ? 'Sim' : 'Não'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Retirada:</span>
                <span className={config.aceita_retirada ? 'text-green-600' : 'text-red-600'}>
                  {config.aceita_retirada ? 'Aceita' : 'Não aceita'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Entrega:</span>
                <span className={config.aceita_entrega ? 'text-green-600' : 'text-red-600'}>
                  {config.aceita_entrega ? 'Aceita' : 'Não aceita'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Valor mínimo:</span>
                <span>R$ {config.valor_minimo_pedido.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa fixa:</span>
                <span>R$ {config.taxa_entrega_fixa.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa por km:</span>
                <span>R$ {config.taxa_entrega_por_km.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Raio de entrega:</span>
                <span>{config.raio_entrega_km} km</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Horário:</span>
                <span>{config.horario_inicio} - {config.horario_fim}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Dias:</span>
                <span>{config.dias_funcionamento.length} dias</span>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Botões de Ação */}
        <div className="mt-6 flex justify-end gap-4">
          <AdminButton
            variant="secondary"
            onClick={() => router.push('/admin/delivery')}
          >
            Cancelar
          </AdminButton>
          
          <AdminButton
            variant="primary"
            onClick={salvarConfiguracoes}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </AdminButton>
        </div>
      </div>
    </AdminLayout>
  );
} 