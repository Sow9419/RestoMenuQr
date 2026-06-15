'use client';

import React from 'react';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useOrderStore } from '@/features/order/store/order.store';
import { 
  TrendingUp, 
  ShoppingBag, 
  TrendingDown, 
  Users, 
  Coins, 
  Sparkles, 
  RefreshCw, 
  CheckCircle,
  Clock8
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DashboardPage() {
  const { config, isLoading } = useMenuStore();
  const { orders } = useOrderStore();

  // Computations
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const revenue = completedOrders.reduce((sum, ord) => sum + ord.totalPrice, 0);
  
  // Average ticket
  const avgBasket = completedOrders.length > 0 
    ? Math.round(revenue / completedOrders.length) 
    : 0;

  // Total orders count
  const totalOrdersCount = orders.length;

  // Best selling products compiled dynamically from live config salesCount
  const sortedItems = [...(config?.items || [])].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 4);

  // Formatting helper
  const formatPrice = (val: number) => {
    const parts = val.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${parts.join(".")} ${config?.style?.currency || 'FCFA'}`;
  };

  // Weekly revenue bars — computed from live orders grouped by day
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const dayRevenue = daysOfWeek.map((_, i) => {
    const dayStart = new Date(startOfWeek);
    dayStart.setDate(startOfWeek.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    return completedOrders
      .filter(o => {
        const d = new Date(o.createdAt);
        return d >= dayStart && d < dayEnd;
      })
      .reduce((sum, o) => sum + o.totalPrice, 0);
  });

  const maxPoint = Math.max(...dayRevenue, 1);

  const isLight = config?.style?.displayMode === 'light';

  return (
    <div className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-8 select-none font-sans transition-colors duration-200 ${
      isLight ? 'bg-[#FAFAF9] text-[#1C1917]' : 'bg-[#0a0a0a] text-zinc-300'
    }`}>
      {/* Header section with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">RestoMenu Analytics</span>
          <h1 className={`text-3xl font-extrabold tracking-tight flex items-center gap-2 ${
            isLight ? 'text-[#1C1917]' : 'text-zinc-100'
          }`}>
            {"Vue d'ensemble"} <Sparkles className="text-amber-400" size={24} />
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-[#78716C]' : 'text-zinc-400'}`}>
            Suivi des performances financières de votre restaurant, synchronisé en temps réel.
          </p>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
            isLight 
              ? 'bg-[#E7E5E4] border-[#E7E5E4] hover:bg-stone-300 text-[#1C1917]' 
              : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100'
          }`}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-emerald-500' : ''} />
          Réactualiser
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
            isLight ? 'bg-[#F5F5F4] border-[#E7E5E4]' : 'bg-[#0d0d0d] border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Coins size={20} />
            </div>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} /> Actif
            </span>
          </div>
          <div className="mt-4">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>Chiffre d’affaires</span>
            <h3 className={`text-2xl font-black mt-1 truncate ${isLight ? 'text-[#1C1917]' : 'text-zinc-100'}`}>
              {formatPrice(revenue)}
            </h3>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-[#78716C]/85' : 'text-zinc-500'}`}>Cumul des commandes terminées</p>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
            isLight ? 'bg-[#F5F5F4] border-[#E7E5E4]' : 'bg-[#0d0d0d] border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <ShoppingBag size={20} />
            </div>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} /> Actif
            </span>
          </div>
          <div className="mt-4">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>Commandes Totales</span>
            <h3 className={`text-2xl font-black mt-1 ${isLight ? 'text-[#1C1917]' : 'text-zinc-100'}`}>
              {totalOrdersCount} <span className="text-xs font-normal text-stone-500">reçues</span>
            </h3>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-[#78716C]/85' : 'text-zinc-500'}`}>Commandes en ligne et sur place</p>
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
            isLight ? 'bg-[#F5F5F4] border-[#E7E5E4]' : 'bg-[#0d0d0d] border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-medium text-amber-550 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Stables
            </span>
          </div>
          <div className="mt-4">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>Panier Moyen</span>
            <h3 className={`text-2xl font-black mt-1 ${isLight ? 'text-[#1C1917]' : 'text-zinc-100'}`}>
              {formatPrice(avgBasket)}
            </h3>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-[#78716C]/85' : 'text-zinc-500'}`}>Moyenne calculée par reçu</p>
          </div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
            isLight ? 'bg-[#F5F5F4] border-[#E7E5E4]' : 'bg-[#0d0d0d] border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-sky-500/10 rounded-xl text-sky-500">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs font-medium text-sky-600 flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded-full">
              {"Chef-d'œuvre"}
            </span>
          </div>
          <div className="mt-4">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>Taux de Service</span>
            <h3 className={`text-2xl font-black mt-1 ${isLight ? 'text-[#1C1917]' : 'text-zinc-100'}`}>
              {orders.length > 0 
                ? `${Math.round((completedOrders.length / orders.length) * 100)}%`
                : '100%'}
            </h3>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-[#78716C]/85' : 'text-zinc-500'}`}>Proportion de plats finalisés</p>
          </div>
        </motion.div>
      </div>

      {/* Analytics grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Revenue Graph */}
        <div className={`border rounded-2xl p-5 md:p-6 flex flex-col transition-all ${
          isLight ? 'bg-[#F5F5F4] border-[#E7E5E4]' : 'bg-[#0d0d0d] border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className={`text-base font-bold ${isLight ? 'text-[#1C1917]' : 'text-zinc-100'}`}>Activité de la semaine</h4>
              <p className={`text-[11px] ${isLight ? 'text-[#78716C]' : 'text-zinc-550'}`}>Montant des transactions quotidiennes estimées</p>
            </div>
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${
              isLight 
                ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' 
                : 'text-emerald-450 bg-emerald-500/10 px-3 py-1 border-emerald-500/15'
            }`}>
              <TrendingUp size={12} />
              <span>Gains croissants</span>
            </div>
          </div>

          {/* SVG Custom Graph */}
          <div className="flex-1 h-64 w-full flex items-end justify-between px-2 pt-4 relative group">
            <div className={`absolute inset-x-0 top-1/2 border-b border-dashed pointer-events-none ${
              isLight ? 'border-[#E7E5E4]' : 'border-zinc-805/40'
            }`}></div>
            <div className={`absolute inset-x-0 top-1/4 border-b border-dashed pointer-events-none ${
              isLight ? 'border-[#E7E5E4]/50' : 'border-zinc-805/10'
            }`}></div>

            {dayRevenue.map((point, index) => {
              const heightPercent = maxPoint > 0 ? (point / maxPoint) * 80 : 0; // capped at 80%
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative z-10 mx-1">
                  {/* Tooltip */}
                  <div className={`absolute bottom-[108%] border text-font-mono text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 ${
                    isLight 
                      ? 'bg-[#FAFAF9] border-[#E7E5E4] text-[#1C1917]' 
                      : 'bg-zinc-950 border-zinc-805 text-zinc-100'
                  }`}>
                    {formatPrice(point)}
                  </div>
                  {/* Bar */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
                    className={`w-full max-w-[28px] sm:max-w-[42px] rounded-t-lg transition-all relative ${
                      index === 6 
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-450 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.35)]' 
                        : isLight 
                          ? 'bg-gradient-to-t from-[#E7E5E4] to-[#A8A29E] hover:from-[#A8A29E] hover:to-[#78716C]'
                          : 'bg-gradient-to-t from-zinc-805 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600'
                    }`}
                  >
                    {/* Glowing Accent Top */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-white/20 rounded-t-lg"></div>
                  </motion.div>
                  {/* Day label */}
                  <span className={`text-[11px] font-medium mt-3 font-sans ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>{daysOfWeek[index]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top items */}
        <div className={`border rounded-2xl p-5 md:p-6 flex flex-col transition-all ${
          isLight ? 'bg-[#F5F5F4] border-[#E7E5E4]' : 'bg-[#0d0d0d] border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className={`text-base font-bold ${isLight ? 'text-[#1C1917]' : 'text-zinc-100'}`}>Plats Best-Sellers</h4>
              <p className={`text-[11px] ${isLight ? 'text-[#78716C]' : 'text-zinc-550'}`}>Classés par volume de ventes client</p>
            </div>
            <span className="text-[10px] text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/15 font-semibold">
              Top Frites
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {sortedItems.map((item, index) => (
              <div key={item.id} className={`flex items-center gap-3 border p-2.5 rounded-xl transition-colors ${
                isLight ? 'bg-[#FAFAF9] border-[#E7E5E4]' : 'bg-zinc-950/60 border-zinc-805/40'
              }`}>
                {/* Number position */}
                <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                  index === 0 ? 'bg-amber-500/10 text-amber-500 font-extrabold' :
                  index === 1 ? 'bg-stone-500/10 text-stone-500' :
                  isLight ? 'bg-stone-200/50 text-[#78716C]' : 'bg-zinc-800/30 text-zinc-555'
                }`}>
                  {index + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0 font-sans">
                  <h5 className={`text-xs font-semibold truncate ${isLight ? 'text-[#1C1917]' : 'text-zinc-200'}`}>{item.name}</h5>
                  <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>{formatPrice(item.price)}</p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <span className="font-semibold text-xs text-emerald-500 font-mono">
                    {item.salesCount || 0}
                  </span>
                  <p className={`text-[9px] font-sans ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>vendus</p>
                </div>
              </div>
            ))}

            {sortedItems.length === 0 && (
              <div className={`flex flex-col items-center justify-center h-full text-center p-6 border rounded-xl border-dashed ${
                isLight ? 'bg-[#FAFAF9] border-[#E7E5E4]' : 'bg-zinc-900/10 border-zinc-800'
              }`}>
                <Clock8 className="text-zinc-600 mb-2" size={24} />
                <span className={`text-xs font-medium ${isLight ? 'text-[#1C1917]' : 'text-zinc-400'}`}>Aucun plat commandé</span>
                <p className={`text-[10px] mt-1 max-w-[180px] ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>Les plats apparaîtront une fois les premières commandes client confirmées.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
