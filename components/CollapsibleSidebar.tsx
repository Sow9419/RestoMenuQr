'use client';

import React, { useState } from 'react';
import { useResto } from './RestoContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Coins, 
  Settings, 
  QrCode, 
  ChevronLeft, 
  ChevronRight, 
  Coffee, 
  CircleAlert,
  HelpCircle,
  LogOut,
  AppWindow
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CollapsibleSidebar() {
  const { activeTab, setActiveTab, config, orders } = useResto();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isLight = true; // Always warm-light theme for merchant panel

  // Count pending or preparing orders
  const activeOrdersCount = orders.filter(
    ord => ord.status === 'PENDING' || ord.status === 'PREPARING'
  ).length;

  const menuItems = [
    { id: 'builder', label: 'Resto Builder', icon: QrCode },
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { 
      id: 'orders', 
      label: 'Commandes', 
      icon: ShoppingBag, 
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined 
    },
    { id: 'pos', label: 'Caisse POS', icon: Coins },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? '72px' : '260px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`h-screen flex flex-col relative select-none flex-shrink-0 border-r transition-colors duration-200 ${
        isLight 
          ? 'bg-[#F5F5F4] border-[#E7E5E4] text-[#78716C]' 
          : 'bg-[#0d0d0d] border-zinc-800 text-zinc-400'
      }`}
    >
      {/* Sidebar Collapse Trigger */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-md z-45 transition-colors border ${
          isLight 
            ? 'bg-[#FAFAF9] border-[#E7E5E4] hover:bg-[#E7E5E4] text-[#1C1917]' 
            : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-900 text-zinc-100'
        }`}
        title={isCollapsed ? "Développer" : "Réduire"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header Profile / Brand */}
      <div className={`p-5 flex items-center gap-3 overflow-hidden border-b transition-colors ${
        isLight ? 'border-[#E7E5E4]/60' : 'border-zinc-800/60'
      }`}>
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/10">
          <Coffee className="text-black font-bold" size={20} />
        </div>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col min-w-0"
          >
            <span className={`font-semibold text-sm truncate ${isLight ? 'text-[#1C1917]' : 'text-zinc-100'}`}>
              {config?.name || 'Le Palace'}
            </span>
            <span className={`text-[11px] truncate flex items-center gap-1 ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>
              <span className={`w-2 h-2 rounded-full ${config?.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              {config?.isOpen ? 'Ouvert' : 'Fermé'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto font-sans">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer ${
                isActive 
                  ? isLight
                    ? 'bg-[#E7E5E4] text-emerald-600 font-bold'
                    : 'bg-emerald-500/10 text-emerald-400 font-semibold' 
                  : isLight
                    ? 'hover:bg-[#E7E5E4]/60 hover:text-[#1C1917] text-[#78716C]'
                    : 'hover:bg-zinc-900/40 hover:text-zinc-100 text-zinc-400'
              }`}
            >
              {/* Highlight bar inside button */}
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-emerald-500 rounded-r-md"
                />
              )}
              <Icon size={18} className={isActive ? 'text-emerald-500' : isLight ? 'text-stone-400 group-hover:text-stone-600' : 'text-zinc-500 group-hover:text-zinc-300'} />
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate flex-1 text-left font-sans"
                >
                  {item.label}
                </motion.span>
              )}
              {item.badge && !isCollapsed && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-black shadow-sm ring-1 ring-emerald-500/100">
                  {item.badge}
                </span>
              )}
              {item.badge && isCollapsed && (
                <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border ${
                  isLight ? 'border-[#F5F5F4]' : 'border-[#0d0d0d]'
                }`}></span>
              )}

              {/* Collapsed Tooltip */}
              {isCollapsed && (
                <div className={`absolute left-[76px] top-1/2 -translate-y-1/2 border rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-md ${
                  isLight 
                    ? 'bg-[#FAFAF9] border-[#E7E5E4] text-[#1C1917]' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-100'
                }`}>
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Branding or Profile */}
      <div className={`p-4 border-t flex flex-col gap-2 overflow-hidden transition-colors ${
        isLight ? 'border-[#E7E5E4]' : 'border-zinc-900'
      }`}>
        {!isCollapsed ? (
          <div className={`border rounded-xl p-3 transition-colors ${
            isLight ? 'bg-[#FAFAF9]/60 border-[#E7E5E4]' : 'bg-zinc-900/20 border-zinc-800'
          }`}>
            <div className={`flex items-center gap-1 text-[11px] font-medium ${isLight ? 'text-[#1C1917]' : 'text-zinc-400'}`}>
              <AppWindow size={12} className="text-emerald-500" />
              <span>Version Premium v1.4</span>
            </div>
            <p className={`text-[10px] mt-1 leading-relaxed ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>
              Gérez votre restaurant en toute liberté, sans ordinateur.
            </p>
          </div>
        ) : (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500 mx-auto ${
            isLight ? 'bg-stone-200/50' : 'bg-zinc-900/30'
          }`}>
            <AppWindow size={16} />
          </div>
        )}
      </div>
    </motion.aside>
  );
}
