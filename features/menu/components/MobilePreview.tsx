'use client';

import React, { useState, useEffect } from 'react';
import { useMenuStore } from '@/features/menu/store/menu.store';
import ClientMenu from './ClientMenu';
import { 
  Wifi,
  BatteryMedium,
  Plus,
  Minus,
  RefreshCw,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';

export default function MobilePreview() {
  const { config } = useMenuStore();
  const isLight = config?.style?.displayMode === 'light';

  // State for zoom factor
  const [zoom, setZoom] = useState<number>(0.9); // Default 0.9 to fit screens elegantly

  const handleZoomIn = () => {
    setZoom(prev => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.6, Math.round((prev - 0.1) * 10) / 10));
  };

  const handleZoomReset = () => {
    setZoom(0.9);
  };

  const [simulatedTime, setSimulatedTime] = useState('12:00');

  useEffect(() => {
    const updateSimTime = () => {
      const now = new Date();
      setSimulatedTime(
        now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateSimTime();
    const interval = setInterval(updateSimTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className={`flex-1 flex flex-col relative items-center justify-center p-6 h-full w-full overflow-hidden select-none transition-colors duration-200 ${
        isLight ? 'bg-[#FAFAF9]' : 'bg-[#121212]/40'
      }`}
    >
      {/* Dynamic zoom percentage display */}
      <div 
        className={`absolute top-4 left-4 z-40 px-3 py-1.5 border rounded-xl text-[10px] font-black tracking-widest font-mono flex items-center gap-1.5 shadow-xs transition-all ${
          isLight 
            ? 'bg-[#F5F5F4] border-[#E7E5E4] text-[#1C1917]' 
            : 'bg-[#0d0d0d]/90 border-zinc-805 text-zinc-300'
        }`}
      >
        <Smartphone size={11} className="text-emerald-500 animate-pulse" />
        <span>APERÇU : {Math.round(zoom * 100)}%</span>
      </div>

      {/* Floating Zoom Action Toolbar */}
      <div 
        className={`absolute top-4 right-4 z-40 p-1 rounded-xl border flex items-center gap-0.5 shadow-sm transition-all ${
          isLight 
            ? 'bg-[#F5F5F4] border-[#E7E5E4] text-[#1C1917]' 
            : 'bg-[#0d0d0d]/90 border-zinc-805 text-zinc-200'
        }`}
      >
        <button
          onClick={handleZoomOut}
          className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
            isLight ? 'hover:bg-[#E7E5E4] text-[#1C1917]' : 'hover:bg-zinc-800 text-zinc-100'
          }`}
          title="Zoom arrière (Agrandir le champ)"
        >
          <Minus size={13} />
        </button>

        <button
          onClick={handleZoomReset}
          className={`px-2 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
            isLight ? 'hover:bg-[#E7E5E4] text-[#1C1917]' : 'hover:bg-zinc-800 text-zinc-100'
          }`}
          title="Rétablir le zoom par défaut"
        >
          <RefreshCw size={11} className="mr-1 opacity-70" />
          <span>Reset</span>
        </button>

        <button
          onClick={handleZoomIn}
          className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
            isLight ? 'hover:bg-[#E7E5E4] text-[#1C1917]' : 'hover:bg-zinc-800 text-zinc-100'
          }`}
          title="Zoom avant"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Simulated space for physical device centering */}
      <div className="flex-1 flex items-center justify-center w-full h-full overflow-auto p-4">
        
        {/* Transform container applying smooth Zoom */}
        <div 
          className="relative flex-shrink-0 transition-transform duration-100 ease-out origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          
          {/* Exterior border bezel */}
          <div className="relative w-[340px] h-[680px] rounded-[48px] bg-slate-950 border-[9px] border-slate-900 shadow-2xl flex flex-col overflow-hidden ring-[1px] ring-white/10">
            
            {/* Dynamic Island style notch */}
            <div className="absolute top-2 inset-x-0 mx-auto w-24 h-5 rounded-full bg-slate-950 z-50 flex items-center justify-between px-3.5 border border-slate-900/40">
              {/* Camera lens */}
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-950 border border-indigo-900"></span>
              {/* Speaker line */}
              <span className="w-8 h-[2px] rounded-full bg-slate-900/80 block"></span>
            </div>

            {/* Phone simulated status rail header */}
            <div className="h-10 bg-slate-950 shrink-0 px-6 flex justify-between items-center text-white text-[10px] font-bold z-45 relative font-mono select-none">
              <span>{simulatedTime}</span>
              <div className="flex items-center gap-1.5">
                <Wifi size={11} className="text-slate-300" />
                <BatteryMedium size={14} className="text-slate-300" />
              </div>
            </div>

            {/* Active app viewport inside frames */}
            <div className="flex-1 bg-slate-900 relative">
              <ClientMenu isPreview={true} />
            </div>

            {/* Simulated iOS home slider rail footer */}
            <div className="h-4 bg-slate-950 shrink-0 flex items-center justify-center pb-2.5 z-45 relative select-none">
              <span className="w-24 h-[3.5px] rounded-full bg-slate-705 block mx-auto"></span>
            </div>

          </div>

          {/* Side physical chassis buttons decoration */}
          <div className="absolute -left-[11.5px] top-[120px] w-[2.5px] h-10 bg-slate-900 rounded-l"></div>
          <div className="absolute -left-[11.5px] top-[170px] w-[2.5px] h-14 bg-slate-900 rounded-l"></div>
          <div className="absolute -left-[11.5px] top-[230px] w-[2.5px] h-14 bg-slate-900 rounded-l"></div>
          <div className="absolute -right-[11.5px] top-[180px] w-[2.5px] h-20 bg-slate-900 rounded-r"></div>
        </div>

      </div>

    </div>
  );
}
