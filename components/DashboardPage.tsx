'use client';

import React from 'react';
import { useResto } from './RestoContext';
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
  const { orders, config, refreshData, isLoading } = useResto();

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

  // Mock analytical coordinates for nice looking SVG curves
  // If we have actual prices, we display beautiful bars or lines
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const dataPoints = [35000, 48000, 72000, 51000, 94000, 142000, 115000];
  // Adjust last day dynamically based on current live revenue
  dataPoints[6] = Math.max(dataPoints[6], Math.min(revenue, 250000));

  const maxPoint = Math.max(...dataPoints);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6 md:p-8 space-y-8 select-none font-sans">
      {/* Header section with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">RestoMenu Analytics</span>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight flex items-center gap-2">
            {"Vue d'ensemble"} <Sparkles className="text-amber-400" size={24} />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Suivi des performances financières de votre restaurant, synchronisé en temps réel.
          </p>
        </div>
        
        <button 
          onClick={() => refreshData()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-800 text-zinc-100 border border-zinc-800 shadow-sm cursor-pointer transition-all self-start sm:self-center disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-emerald-400' : ''} />
          Réactualiser
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#0d0d0d] border border-zinc-800 rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Coins size={20} />
            </div>
            <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} /> +12%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-zinc-550 text-xs font-medium uppercase tracking-wider">Chiffre d’affaires</span>
            <h3 className="text-2xl font-bold text-zinc-100 mt-1 truncate">
              {formatPrice(revenue)}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">Cumul des commandes terminées</p>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#0d0d0d] border border-zinc-800 rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <ShoppingBag size={20} />
            </div>
            <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} /> +18.4%
            </span>
          </div>
          <div className="mt-4">
            <span className="text-zinc-550 text-xs font-medium uppercase tracking-wider">Commandes Totales</span>
            <h3 className="text-2xl font-bold text-zinc-100 mt-1">
              {totalOrdersCount} <span className="text-xs text-zinc-500 font-normal">reçues</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">Commandes en ligne et sur place</p>
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#0d0d0d] border border-zinc-800 rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-medium text-amber-500 flex items-center gap-1 bg-amber-500/5 px-2 py-0.5 rounded-full">
              Stables
            </span>
          </div>
          <div className="mt-4">
            <span className="text-zinc-550 text-xs font-medium uppercase tracking-wider">Panier Moyen</span>
            <h3 className="text-2xl font-bold text-zinc-100 mt-1">
              {formatPrice(avgBasket)}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">Moyenne calculée par reçu</p>
          </div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#0d0d0d] border border-zinc-800 rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
              <CheckCircle size={20} />
            </div>
            <span className="text-xs font-medium text-sky-500 flex items-center gap-1 bg-sky-500/5 px-2 py-0.5 rounded-full">
              {"Chef-d'œuvre"}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-zinc-550 text-xs font-medium uppercase tracking-wider">Taux de Service</span>
            <h3 className="text-2xl font-bold text-zinc-100 mt-1">
              {orders.length > 0 
                ? `${Math.round((completedOrders.length / orders.length) * 100)}%`
                : '100%'}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">Proportion de plats finalisés</p>
          </div>
        </motion.div>
      </div>

      {/* Analytics grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Revenue Graph */}
        <div className="lg:col-span-2 bg-[#0d0d0d] border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold text-zinc-100">Activité de la semaine</h4>
              <p className="text-[11px] text-zinc-550">Montant des transactions quotidiennes estimées</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-450 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/15">
              <TrendingUp size={12} />
              <span>Gains croissants</span>
            </div>
          </div>

          {/* SVG Custom Graph */}
          <div className="flex-1 h-64 w-full flex items-end justify-between px-2 pt-4 relative group">
            <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-zinc-800/40 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-zinc-800/10 pointer-events-none"></div>

            {dataPoints.map((point, index) => {
              const heightPercent = maxPoint > 0 ? (point / maxPoint) * 80 : 0; // capped at 80%
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative z-10 mx-1">
                  {/* Tooltip */}
                  <div className="absolute bottom-[108%] bg-zinc-950 border border-zinc-805 text-zinc-100 font-mono text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
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
                        : 'bg-gradient-to-t from-zinc-805 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600'
                    }`}
                  >
                    {/* Glowing Accent Top */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-white/20 rounded-t-lg"></div>
                  </motion.div>
                  {/* Day label */}
                  <span className="text-[11px] text-zinc-500 font-medium mt-3 font-sans">{daysOfWeek[index]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top items */}
        <div className="bg-[#0d0d0d] border border-zinc-800 rounded-2xl p-5 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-bold text-zinc-100">Plats Best-Sellers</h4>
              <p className="text-[11px] text-zinc-550">Classés par volume de ventes client</p>
            </div>
            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/15 font-semibold">
              Top Frites
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {sortedItems.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-805/40 p-2.5 rounded-xl">
                {/* Number position */}
                <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                  index === 0 ? 'bg-amber-500/10 text-amber-400' :
                  index === 1 ? 'bg-zinc-500/10 text-zinc-400' :
                  'bg-zinc-800/30 text-zinc-555'
                }`}>
                  {index + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0 font-sans">
                  <h5 className="text-xs font-semibold text-zinc-200 truncate">{item.name}</h5>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{formatPrice(item.price)}</p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <span className="font-semibold text-xs text-emerald-400 font-mono">
                    {item.salesCount || 0}
                  </span>
                  <p className="text-[9px] text-zinc-500 font-sans">vendus</p>
                </div>
              </div>
            ))}

            {sortedItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-xl">
                <Clock8 className="text-zinc-600 mb-2" size={24} />
                <span className="text-xs font-medium text-zinc-400">Aucun plat commandé</span>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[180px]">Les plats apparaîtront une fois les premières commandes client confirmées.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
