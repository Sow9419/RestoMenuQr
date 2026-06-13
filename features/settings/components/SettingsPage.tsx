'use client';

import React, { useState } from 'react';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { updatePageSettings } from '@/features/menu/actions/settingsActions';
import { 
  Settings, 
  Trash2, 
  WifiOff, 
  HelpCircle, 
  Store, 
  BadgeHelp, 
  Smartphone, 
  Sparkles, 
  Check, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const { config } = useMenuStore();

  const [savingState, setSavingState] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);
  const [name, setName] = useState(config?.name || '');
  const [phone, setPhone] = useState(config?.phone || '');
  const [address, setAddress] = useState(config?.address || '');
  const [isOpen, setIsOpen] = useState(config?.isOpen ?? true);
  const [currency, setCurrency] = useState(config?.style?.currency || 'FCFA');
  // Simulation UX — état local uniquement (démo, pas persisté)
  const [isNetworkSimulatedOffline, setNetworkSimulatedOffline] = useState(false);
  const [isWhatsAppSimulatedInstalled, setWhatsAppSimulatedInstalled] = useState(true);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config?.id) return;
    setSavingState(true);

    await updatePageSettings(config.id, {
      settings: {
        ...config.style,
        currency,
        fontFamily: config.style?.fontFamily || 'Playfair Display',
        templateLayout: 'classic',
        displayMode: config.style?.displayMode || 'light',
      },
      sections: config.sections.map(s => ({ name: s.name, label: s.label, enabled: s.enabled }))
    });

    setSavingState(false);
    setSavingSuccess(true);
    setTimeout(() => setSavingSuccess(false), 2000);
  };

  const handleReset = async () => {
    if (confirm('Voulez-vous réinitialiser l\'application ? Cette action est irréversible.')) {
      // Phase 2 — reset complet via Server Action dédiée
      alert('Réinitialisation complète disponible en Phase 2.');
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
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
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
              {savingState ? 'Enregistrement en cours...' : savingSuccess ? '✓ Paramètres sauvegardés !' : 'Sauvegarder les Coordonnées'}
              <Check size={14} />
            </button>
          </form>

          {/* Reset Block */}
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 md:p-6 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-red-600 flex items-center gap-1">
              <AlertTriangle size={14} /> ZONE DE DANGER
            </h4>
            <p className="text-[11px] text-stone-500 leading-relaxed font-sans font-medium">
              {"En effaçant la base de données locale, tous les plats personnalisés, les catégories modifiées et les commandes clients enregistrées seront définitivement purgés pour restaurer les paramètres d'usine."}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-red-50 hover:bg-red-100/50 text-red-605 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer select-none font-sans"
            >
              <RotateCcw size={13} />
              Effacer la base de données locale
            </button>
          </div>
        </div>

        {/* Right Side: Network & Whatsapp Simulation */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 md:p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-1.5 pb-3 border-b border-[#E7E5E4]">
              <Smartphone size={16} className="text-emerald-600" />
              Simulation UX
            </h3>

            {/* Simulated Network status */}
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-stone-705 font-sans">Connexion Réseau</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-normal font-sans font-medium">{"Permet de tester la cinématique de reconnexion automatique en cas de coupure (Flow 1)."}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNetworkSimulatedOffline(false)}
                  className={`py-2 px-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    !isNetworkSimulatedOffline
                      ? 'bg-emerald-50 text-emerald-650 border-emerald-300 font-extrabold shadow-sm'
                      : 'bg-[#F5F5F4] text-stone-500 border-transparent hover:bg-[#E7E5E4] hover:text-[#1C1917] font-semibold'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  En ligne (Normal)
                </button>

                <button
                  type="button"
                  onClick={() => setNetworkSimulatedOffline(true)}
                  className={`py-2 px-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isNetworkSimulatedOffline
                      ? 'bg-amber-50 text-amber-605 border-amber-300 font-extrabold shadow-sm'
                      : 'bg-[#F5F5F4] text-stone-505 border-transparent hover:bg-[#E7E5E4] hover:text-[#1C1917]'
                  }`}
                >
                  <WifiOff size={11} />
                  Hors-ligne (Coupé)
                </button>
              </div>
            </div>

            {/* Simulated WhatsApp presence */}
            <div className="space-y-2 pt-3 border-t border-[#E7E5E4]">
              <div>
                <h4 className="text-xs font-bold text-stone-705 font-sans">Présence de WhatsApp API</h4>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-normal font-sans font-medium">{"Permet de simuler si l'appareil du client supporte WhatsApp lors d'une commande livraison (Flow 2)."}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWhatsAppSimulatedInstalled(true)}
                  className={`py-2 px-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isWhatsAppSimulatedInstalled
                      ? 'bg-emerald-550/10 text-emerald-600 border-emerald-300 font-extrabold shadow-sm'
                      : 'bg-[#F5F5F4] text-stone-505 border-transparent hover:bg-[#E7E5E4] hover:text-[#1C1917]'
                  }`}
                >
                  Disponible
                </button>

                <button
                  type="button"
                  onClick={() => setWhatsAppSimulatedInstalled(false)}
                  className={`py-2 px-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    !isWhatsAppSimulatedInstalled
                      ? 'bg-emerald-555/10 text-emerald-600 border-emerald-300 font-extrabold shadow-sm'
                      : 'bg-[#F5F5F4] text-stone-505 border-transparent hover:bg-[#E7E5E4] hover:text-[#1C1917]'
                  }`}
                >
                  Non installé
                </button>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-650 block uppercase mb-1 font-sans">Comment Tester ?</span>
              <p className="text-[10px] text-stone-500 leading-normal font-sans font-medium font-sans">
                {"Activez l'état \"Hors-ligne\" puis allez dans le téléphone de prévisualisation à droite. Remplissez votre panier sur place et cliquez sur valider : la commande va tenter de se reconnecter automatiquement 3 fois, avec des délais croissants avant de réussir !"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
