'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { RestoProvider, useResto } from '@/components/RestoContext';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';
import BuilderPanel from '@/components/BuilderPanel';
import MobilePreview from '@/components/MobilePreview';
import DashboardPage from '@/components/DashboardPage';
import OrderManagerPage from '@/components/OrderManagerPage';
import CaissePage from '@/components/CaissePage';
import SettingsPage from '@/components/SettingsPage';
import { QrCode, ChefHat, Sparkles, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

function MerchantDashboardContent() {
  const { activeTab, config } = useResto();
  const isLight = config?.style?.displayMode === 'light';
  
  // Custom split resize percentage
  const [panelWidthPercent, setPanelWidthPercent] = useState<number>(45); // defaults to 45% of width
  const [isDragging, setIsDragging] = useState(false);

  const startDragging = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const containerElement = document.getElementById('central-container');
      if (containerElement) {
        const rect = containerElement.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const percent = Math.max(25, Math.min(75, (relativeX / rect.width) * 100));
        setPanelWidthPercent(percent);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handleSeparatorClick = () => {
    if (!isDragging) {
      // Toggle layout preset sizes if clicked
      setPanelWidthPercent(prev => prev === 45 ? 55 : prev === 55 ? 35 : 45);
    }
  };

  return (
    <div 
      className={`h-screen w-screen overflow-hidden flex font-sans transition-colors duration-200 ${
        isLight 
          ? 'bg-[#FAFAF9] text-[#1C1917]' 
          : 'bg-[#0a0a0a] text-zinc-300'
      }`}
    >
      
      {/* 1. COLLAPSIBLE APPLE-STYLE SIDEBAR */}
      <CollapsibleSidebar />

      {/* Central View Dashboard Container */}
      <div 
        id="central-container" 
        className="flex-1 h-full overflow-hidden flex flex-col relative"
      >
        
        {/* Render Tab Contents */}
        {activeTab === 'dashboard' && <DashboardPage />}
        
        {activeTab === 'orders' && <OrderManagerPage />}
        
        {activeTab === 'pos' && <CaissePage />}
        
        {activeTab === 'settings' && <SettingsPage />}

        {/* Builder View: SPLIT SCREEN WITH TWO REDIMENSIONNABLE ZONES */}
        {activeTab === 'builder' && (
          <div className="flex-1 flex overflow-hidden w-full h-full">
            
            {/* Zone gauche: BuilderPanel (adjustable width layout) */}
            <div 
              className={`h-full shrink-0 flex flex-col overflow-hidden relative ${
                isLight ? 'border-r border-[#E7E5E4]' : 'border-r border-zinc-800'
              }`}
              style={{ width: `${panelWidthPercent}%`, minWidth: '320px', maxWidth: '640px' }}
            >
              <BuilderPanel />
            </div>

            {/* Drag Handle splitter emulator */}
            <div 
              onPointerDown={startDragging}
              onClick={handleSeparatorClick}
              className={`w-1.5 hover:w-2 hover:bg-emerald-500/30 h-full shrink-0 cursor-col-resize transition-all flex items-center justify-center relative group z-35 ${
                isLight 
                  ? 'bg-[#F5F5F4] border-x border-[#E7E5E4]' 
                  : 'bg-[#0d0d0d] border-x border-zinc-900/40'
              }`}
              title="Faites glisser pour redimensionner le split-screen"
            >
              {/* Floating resize indicator */}
              <div 
                className={`w-[1.5px] h-10 rounded-full group-hover:bg-emerald-500 ${
                  isLight ? 'bg-stone-300' : 'bg-zinc-700'
                }`}
              ></div>
            </div>

            {/* Zone droite: MobilePreview (Visual dominant) */}
            <div 
              className={`flex-1 h-full min-w-0 transition-colors duration-200 ${
                isLight ? 'bg-[#F5F5F4]' : 'bg-[#121212]/30'
              }`}
            >
              <MobilePreview />
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function MerchantDashboard() {
  return (
    <RestoProvider>
      <MerchantDashboardContent />
    </RestoProvider>
  );
}
