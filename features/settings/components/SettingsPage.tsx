'use client';

import React, { useState } from 'react';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { updateRestaurantProfile } from '@/features/settings/actions/settingsActions';
import { toast } from '@/shared/store/uiStore';
import { 
  Settings, 
  Store, 
  Sparkles, 
  Check, 
} from 'lucide-react';

export default function SettingsPage() {
  const { config } = useMenuStore();

  const [savingState, setSavingState] = useState(false);
  const [name, setName] = useState(config?.name || '');
  const [phone, setPhone] = useState(config?.phone || '');
  const [address, setAddress] = useState(config?.address || '');
  const [isOpen, setIsOpen] = useState(config?.isOpen ?? true);
  const [currency, setCurrency] = useState(config?.style?.currency || 'FCFA');

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config?.id) return;
    setSavingState(true);

    const result = await updateRestaurantProfile(config.id, {
      name,
      phone,
      address,
      isOpen,
      currency,
    });

    setSavingState(false);

    if (result.success) {
      toast.success('Parametres sauvegardes avec succes.');
    } else {
      toast.error(result.error.message);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F5F4] p-6 md:p-8 space-y-6 select-none max-w-4xl font-sans text-[#1C1917]">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider font-sans">Panneau Administratif</span>
        <h1 className="text-3xl font-extrabold text-[#1C1917] tracking-tight flex items-center gap-2 font-sans">
          Paramètres Généraux <Settings className="text-emerald-500" size={24} />
        </h1>
        <p className="text-stone-500 text-sm mt-1 font-medium">
          {"Ajustez les coordonnées administratives du restaurant et configurez les conditions de simulation client de l'application."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveGeneral} className="bg-white border border-[#E7E5E4] rounded-2xl p-5 md:p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-1.5 pb-3 border-b border-[#E7E5E4]">
              <Store size={16} className="text-emerald-600" />
              Profil de Restaurant
            </h3>

            {/* Restaurant Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500 font-bold uppercase tracking-wider font-sans">Nom du Restaurant</label>
              <input 
                type="text" 
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-[#E7E5E4] text-xs rounded-xl px-4 py-3 text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-emerald-500 transition-all font-semibold font-sans shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone / Whatsapp */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider font-sans">{"Téléphone d'Assistance / WhatsApp"}</label>
                <input 
                  type="text" 
                  value={phone}
                  required
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-[#E7E5E4] text-xs rounded-xl px-4 py-3 text-[#1C1917] placeholder-stone-400 focus:outline-none focus:border-emerald-500 transition-all font-semibold font-sans shadow-xs"
                />
              </div>

              {/* Currency Selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider font-sans">Devise Monétaire</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-[#E7E5E4] text-xs rounded-xl px-4 py-3 text-[#1C1917] placeholder-stone-400 focus:outline-none focus:border-emerald-500 transition-all font-semibold font-sans shadow-xs cursor-pointer"
                >
                  <option value="FCFA">FCFA (Franc CFA)</option>
                  <option value="€">EUR (€ — Euro)</option>
                  <option value="$">USD ($ — Dollar US)</option>
                </select>
              </div>
            </div>

            {/* Restaurant Address */}
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500 font-bold uppercase tracking-wider font-sans">Adresse Physique</label>
              <input 
                type="text" 
                value={address}
                required
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-[#E7E5E4] text-xs rounded-xl px-4 py-3 text-[#1C1917] placeholder-stone-400 focus:outline-none focus:border-emerald-500 transition-all font-semibold font-sans shadow-xs"
              />
            </div>

            {/* Bistro Opening Hour status */}
            <div className="p-4 bg-stone-550/5 rounded-xl border border-[#E7E5E4] flex justify-between items-center bg-stone-50/50">
              <div>
                <h5 className="text-xs font-bold text-[#1C1917]">Statut de Disponibilité</h5>
                <p className="text-[10px] text-stone-500 mt-0.5 font-medium">{"Si le restaurant est fermé, les boutons '+' du menu client s’inactivent."}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 h-11 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                  isOpen 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-xs' 
                    : 'bg-red-50 text-red-650 border-red-200 shadow-xs'
                }`}
              >
                {isOpen ? 'OUVERT (Commandes ON)' : 'FERMÉ (Commandes OFF)'}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={savingState}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans"
            >
              {savingState ? 'Enregistrement en cours...' : 'Sauvegarder les Coordonnees'}
              <Check size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
