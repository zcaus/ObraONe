import React, { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { AppSettings } from '../types';
import { storageService } from '../services/storageService';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    commercialPolicy: '',
    freightOptions: [],
    minOrderValue: 0
  });
  const [newFreight, setNewFreight] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const data = await storageService.getSettings();
      setSettings(data);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    await storageService.setSettings(settings);
    alert('Configurações salvas com sucesso!');
  };

  const addFreight = () => {
    if (newFreight && !settings.freightOptions.includes(newFreight)) {
      setSettings({
        ...settings,
        freightOptions: [...settings.freightOptions, newFreight]
      });
      setNewFreight('');
    }
  };

  const removeFreight = (opt: string) => {
    setSettings({
      ...settings,
      freightOptions: settings.freightOptions.filter(o => o !== opt)
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando configurações...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Ajustes do Sistema</h2>
        <p className="text-gray-500 dark:text-gray-400">Definições globais de vendas e políticas</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Política Comercial Padrão</label>
          <textarea 
            className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-3 h-32 text-sm"
            placeholder="Ex: Pagamento 30 dias, Desconto máximo 10%..."
            value={settings.commercialPolicy}
            onChange={e => setSettings({...settings, commercialPolicy: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor Mínimo de Pedido (R$)</label>
          <input 
            type="number"
            className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2 max-w-xs"
            value={settings.minOrderValue}
            onChange={e => setSettings({...settings, minOrderValue: Number(e.target.value)})}
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opções de Frete</label>
           <div className="flex gap-2 mb-3">
             <input 
              type="text" 
              className="flex-1 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2"
              placeholder="Ex: Transportadora X..."
              value={newFreight}
              onChange={e => setNewFreight(e.target.value)}
             />
             <button onClick={addFreight} className="bg-indigo-100 text-indigo-700 p-2 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50">
               <Plus size={20} />
             </button>
           </div>
           <div className="space-y-2">
             {settings.freightOptions.map(opt => (
               <div key={opt} className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg border border-gray-200 dark:border-zinc-700">
                 <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                 <button onClick={() => removeFreight(opt)} className="text-red-400 hover:text-red-600">
                   <X size={16} />
                 </button>
               </div>
             ))}
           </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
          <button 
            onClick={handleSave}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Save size={18} /> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;