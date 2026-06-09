'use client';

import React, { useState } from 'react';
import { useResto } from './RestoContext';
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
  const { 
    config, 
    updateConfigOnServer, 
    resetAllData, 
    isNetworkSimulatedOffline, 
    setNetworkSimulatedOffline,
    isWhatsAppSimulatedInstalled,
    setWhatsAppSimulatedInstalled
  } = useResto();

  const [savingState, setSavingState] = useState(false);
  const [name, setName] = useState(config?.name || '');
  const [phone, setPhone] = useState(config?.phone || '');
  const [address, setAddress] = useState(config?.address || '');
  const [isOpen, setIsOpen] = useState(config?.isOpen ?? true);
  const [currency, setCurrency] = useState(config?.style?.currency || 'FCFA');

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingState(true);
    
    // Copy config
    const newConfig = {
      ...config,
      name,
      phone,
      address,
      isOpen,
      style: {
        ...config.style,
        currency
      }
    };

    await updateConfigOnServer(newConfig);
    setSavingState(false);
  };

  const handleReset = async () => {
    if (confirm('Voulez-vous réinitialiser l’application ? Cela effacera l’historique des commandes et restaura le menu d’usine d’origine.')) {
      await resetAllData();
      // Reload states
      setName(config.name);
      setPhone(config.phone);
      setAddress(config.address);
      setIsOpen(config.isOpen);
      setCurrency(config.style.currency);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6 md:p-8 space-y-6 select-none max-w-4xl font-sans text-zinc-100">
      
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider font-sans">Panneau Administratif</span>
        <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight flex items-center gap-2 font-sans">
          Paramètres Généraux <Settings className="text-emerald-500" size={24} />
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {"Ajustez les coordonnées administratives du restaurant et configurez les conditions de simulation client de l'application."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveGeneral} className="bg-[#0b0b0b] border border-zinc-800/80 rounded-2xl p-5 md:p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-1.5 pb-3 border-b border-zinc-800/80">
              <Store size={16} className="text-emerald-400" />
              Profil de Restaurant
            </h3>

            {/* Restaurant Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider font-sans">Nom du Restaurant</label>
              <input 
                type="text" 
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#070707] border border-zinc-850 text-xs rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-medium font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone / Whatsapp */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider font-sans">{"Téléphone d'Assistance / WhatsApp"}</label>
                <input 
                  type="text" 
                  value={phone}
                  required
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#070707] border border-zinc-850 text-xs rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500 transition-all font-medium font-sans"
                />
              </div>

              {/* Currency Selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider font-sans">Devise Monétaire</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#070707] border border-zinc-850 text-xs rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500 transition-all font-medium font-sans"
                >
                  <option value="FCFA">FCFA (Franc CFA)</option>
                  <option value="€">EUR (€ — Euro)</option>
                  <option value="$">USD ($ — Dollar US)</option>
                </select>
              </div>
            </div>

            {/* Restaurant Address */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider font-sans">Adresse Physique</label>
              <input 
                type="text" 
                value={address}
                required
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#070707] border border-zinc-850 text-xs rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500 transition-all font-medium font-sans"
              />
            </div>

            {/* Bistro Opening Hour status */}
            <div className="p-4 bg-zinc-950/20 rounded-xl border border-zinc-800/60 flex justify-between items-center">
              <div>
                <h5 className="text-xs font-bold text-zinc-200">Statut de Disponibilité</h5>
                <p className="text-[10px] text-zinc-500 mt-0.5">{"Si le restaurant est fermé, les boutons '+' du menu client s’inactivent."}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                  isOpen 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm' 
                    : 'bg-red-500/10 text-red-500 border-red-500/20 shadow-sm'
                }`}
              >
                {isOpen ? 'OUVERT (Commandes ON)' : 'FERMÉ (Commandes OFF)'}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={savingState}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs shadow-lg shadow-emerald-950/10 hover:shadow-emerald-950/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans"
            >
              {savingState ? 'Enregistrement en cours...' : 'Sauvegarder les Coordonnées'}
              <Check size={14} />
            </button>
          </form>

          {/* Reset Block */}
          <div className="bg-[#0b0b0b] border border-red-500/10 rounded-2xl p-5 md:p-6 space-y-3">
            <h4 className="text-xs font-bold text-red-400 flex items-center gap-1">
              <AlertTriangle size={14} /> ZONE DE DANGER
            </h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
              {"En effaçant la base de données locale, tous les plats personnalisés, les catégories modifiées et les commandes clients enregistrées seront définitivement purgés pour restaurer les paramètres d'usine."}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-red-600/10 text-red-450 hover:bg-red-600/20 text-xs font-bold rounded-xl border border-red-500/25 flex items-center gap-1.5 transition-colors cursor-pointer select-none font-sans"
            >
              <RotateCcw size={13} />
              Effacer la base de données locale
            </button>
          </div>
        </div>

        {/* Right Side: Network & Whatsapp Simulation */}
        <div className="space-y-6">
          <div className="bg-[#0b0b0b] border border-zinc-800/80 rounded-2xl p-5 md:p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-1.5 pb-3 border-b border-zinc-800/80">
              <Smartphone size={16} className="text-emerald-400" />
              Simulation UX
            </h3>

            {/* Simulated Network status */}
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-zinc-350 font-sans">Connexion Réseau</h4>
                  <p className="text-[10px] text-zinc-550 mt-0.5 leading-normal font-sans">{"Permet de tester la cinématique de reconnexion automatique en cas de coupure (Flow 1)."}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNetworkSimulatedOffline(false)}
                  className={`py-2 px-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    !isNetworkSimulatedOffline
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-extrabold'
                      : 'bg-[#0d0d0d] text-zinc-450 border-transparent hover:text-zinc-200'
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
                      ? 'bg-[#121212] text-amber-500 border-amber-500/25'
                      : 'bg-[#0d0d0d] text-zinc-450 border-transparent hover:text-zinc-200'
                  }`}
                >
                  <WifiOff size={11} />
                  Hors-ligne (Coupé)
                </button>
              </div>
            </div>

            {/* Simulated WhatsApp presence */}
            <div className="space-y-2 pt-3 border-t border-zinc-800/80">
              <div>
                <h4 className="text-xs font-bold text-zinc-350 font-sans">Présence de WhatsApp API</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal font-sans">{"Permet de simuler si l'appareil du client supporte WhatsApp lors d'une commande livraison (Flow 2)."}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWhatsAppSimulatedInstalled(true)}
                  className={`py-2 px-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isWhatsAppSimulatedInstalled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-extrabold'
                      : 'bg-[#0d0d0d] text-zinc-450 border-transparent hover:text-zinc-200'
                  }`}
                >
                  Disponible
                </button>

                <button
                  type="button"
                  onClick={() => setWhatsAppSimulatedInstalled(false)}
                  className={`py-2 px-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    !isWhatsAppSimulatedInstalled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-extrabold'
                      : 'bg-[#0d0d0d] text-zinc-450 border-transparent hover:text-zinc-200'
                  }`}
                >
                  Non installé
                </button>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-450 block uppercase mb-1 font-sans">Comment Tester ?</span>
              <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                {"Activez l'état \"Hors-ligne\" puis allez dans le téléphone de prévisualisation à droite. Remplissez votre panier sur place et cliquez sur valider : la commande va tenter de se reconnecter automatiquement 3 fois, avec des délais croissants avant de réussir !"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
