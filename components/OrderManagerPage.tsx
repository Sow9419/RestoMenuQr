'use client';

import React, { useState } from 'react';
import { useResto } from './RestoContext';
import { 
  ClipboardList, 
  MapPin, 
  PhoneCall, 
  Check, 
  Clock, 
  X, 
  Share2, 
  Sparkles, 
  Trash2,
  AlertCircle,
  Smartphone,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Order, OrderStatus, OrderType } from '@/lib/restoTypes';
import { motion, AnimatePresence } from 'motion/react';

const simulatesNotes = [
  'Sauce piment à part s\'il vous plaît.',
  'Livrer rapidement si possible.',
  'Pas d\'oignon dans le burger.',
  'Veuillez sonner à l\'interphone B3.',
  undefined
];

// Relative time helper (pure outer utility)
const getRelativeTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    return `Il y a ${diffHours} h`;
  } catch {
    return '';
  }
};

function generateRandomMockOrder(config: any): Partial<Order> | null {
  const isDelivery = Math.random() > 0.5;
  const availableItems = (config?.items || []).filter((it: any) => it.isAvailable);
  if (availableItems.length === 0) return null;
  
  const itemsCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 items
  const selectedItems = [];
  let totalPrice = 0;
  
  for (let i = 0; i < itemsCount; i++) {
    const item = availableItems[Math.floor(Math.random() * availableItems.length)];
    const qty = Math.floor(Math.random() * 2) + 1;
    selectedItems.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: qty
    });
    totalPrice += item.price * qty;
  }

  const firstNames = ['Diallo', 'Sall', 'Sow', 'Ba', 'Cissokho', 'Gaye', 'Ndiaye', 'Tine'];
  const deliveryLocations = [
    'Almadies, Lot 4, Dakar',
    'Plateau, Rue Jules Ferry, Dakar',
    'Hann Maristes, Immeuble C, Dakar',
    'Mermoz, Rue des Écrivains, Dakar',
    'Fann Résidence, Villa 12, Dakar'
  ];

  const randomName = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + (Math.random() > 0.5 ? 'Awa' : 'Mamadou');

  return {
    type: isDelivery ? 'DELIVERY' : 'DINE_IN',
    items: selectedItems,
    totalPrice: totalPrice,
    customerName: randomName,
    whatsappNumber: '+22177' + Math.floor(1000000 + Math.random() * 9000000),
    deliveryAddress: isDelivery ? deliveryLocations[Math.floor(Math.random() * deliveryLocations.length)] : undefined,
    deliveryNotes: simulatesNotes[Math.floor(Math.random() * simulatesNotes.length)]
  };
}

export default function OrderManagerPage() {
  const { orders, config, updateOrderStatusOnServer, deleteOrderOnServer, addOrderOnServer } = useResto();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Generate a random mock order to help test the full synchronization flow instantly
  const handleCreateSimulatedOrder = async () => {
    const simulatedData = generateRandomMockOrder(config);
    if (!simulatedData) return;
    await addOrderOnServer(simulatedData);
  };

  // Filtering
  const filteredOrders = orders.filter(ord => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING') return ord.status === 'PENDING';
    if (filterStatus === 'PREPARING') return ord.status === 'PREPARING';
    if (filterStatus === 'READY') return ord.status === 'READY';
    if (filterStatus === 'ARCHIVED') return ord.status === 'COMPLETED' || ord.status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/10 flex items-center gap-1">⏳ En attente</span>;
      case 'PREPARING':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/10 flex items-center gap-1">👨‍🍳 En Cuisine</span>;
      case 'READY':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 flex items-center gap-1">📦 Prêt</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/50 flex items-center gap-1">✅ Terminé</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/15 text-red-500 border border-red-500/10 flex items-center gap-1">❌ Annulé</span>;
    }
  };

  const formatPrice = (val: number) => {
    const parts = val.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${parts.join(".")} ${config?.style?.currency || 'FCFA'}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6 md:p-8 space-y-6 select-none font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Cuisine ET Suivi Direct</span>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight flex items-center gap-2">
            Gestion Commande <ClipboardList className="text-emerald-500" size={24} />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gérez le flux de vos plats et changez les statuts en cuisine. Les clients sont avertis instantanément.
          </p>
        </div>

        <button
          onClick={handleCreateSimulatedOrder}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Sparkles size={14} />
          Simuler commande client
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-2">
        <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'PENDING', label: 'En attente' },
            { id: 'PREPARING', label: 'En cuisine' },
            { id: 'READY', label: 'Prêtes' },
            { id: 'ARCHIVED', label: 'Archivées' }
          ].map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-[#141414] text-emerald-450 border border-zinc-800' 
                    : 'text-zinc-444 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-zinc-500 text-xs hidden sm:inline">
          {filteredOrders.length} {filteredOrders.length > 1 ? 'commandes' : 'commande'} visible(s)
        </span>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((ord) => (
            <motion.div
              key={ord.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -30 }}
              transition={{ duration: 0.25 }}
              className={`bg-zinc-950/50 border rounded-2xl overflow-hidden shadow-sm flex flex-col ${
                ord.status === 'PENDING' ? 'border-amber-500/25 ring-1 ring-amber-500/5 bg-amber-500/[0.02]' :
                ord.status === 'PREPARING' ? 'border-blue-500/25 bg-blue-550/[0.02]' :
                ord.status === 'READY' ? 'border-emerald-555/25 bg-emerald-950/5' :
                'border-zinc-800 bg-[#0d0d0d]/40'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 bg-[#0d0d0d]/60 border-b border-zinc-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-extrabold text-zinc-200">{ord.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                    ord.type === 'DINE_IN' 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10' 
                      : 'bg-[#153448]/30 text-blue-400 border border-blue-500/10'
                  }`}>
                    {ord.type === 'DINE_IN' ? 'SUR PLACE' : 'LIVRAISON'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs font-medium flex items-center gap-1.5 font-sans">
                    <Clock size={12} />
                    {getRelativeTime(ord.createdAt)}
                  </span>
                  {getStatusBadge(ord.status)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 space-y-4">
                {/* List of items */}
                <div className="space-y-2">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <span className="font-extrabold text-emerald-450 font-mono text-[11px] bg-emerald-500/10 w-6 h-6 flex items-center justify-center rounded border border-emerald-500/20">
                          {item.quantity}x
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-zinc-400 font-mono font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing / total */}
                <div className="pt-3 border-t border-zinc-800/80 flex justify-between items-center bg-black/10">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-sans">Total Commande</span>
                  <span className="text-sm font-bold text-zinc-200 font-mono">{formatPrice(ord.totalPrice)}</span>
                </div>

                {/* Delivery details if any */}
                {ord.type === 'DELIVERY' && (
                  <div className="mt-3 p-3 bg-zinc-900/10 rounded-xl border border-zinc-800/60 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-zinc-400 font-medium">
                      <Smartphone size={13} className="text-emerald-500" />
                      <span>{ord.customerName || 'Client anonyme'} — </span>
                      <a href={`tel:${ord.whatsappNumber}`} className="hover:underline text-emerald-400 font-mono">{ord.whatsappNumber}</a>
                    </div>
                    {ord.deliveryAddress && (
                      <div className="flex items-start gap-2 text-zinc-400">
                        <MapPin size={13} className="text-emerald-550 mt-0.5 flex-shrink-0" />
                        <span className="leading-tight">{ord.deliveryAddress}</span>
                      </div>
                    )}
                    {ord.deliveryNotes && (
                      <div className="p-2 bg-zinc-950/40 rounded border border-zinc-900/40 text-[11px] text-amber-500 italic">
                        {'"'} {ord.deliveryNotes} {'"'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-zinc-950/30 border-t border-zinc-850 flex justify-end gap-2">
                {/* Pending -> Prepare */}
                {ord.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => updateOrderStatusOnServer(ord.id, 'CANCELLED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500/10 text-red-500 border border-zinc-800 hover:border-red-500/20 cursor-pointer transition-all"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => updateOrderStatusOnServer(ord.id, 'PREPARING')}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-550/20 hover:border-emerald-500/40 text-emerald-400 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      Lancer la préparation
                    </button>
                  </>
                )}

                {/* Preparing -> Ready */}
                {ord.status === 'PREPARING' && (
                  <>
                    <button
                      onClick={() => updateOrderStatusOnServer(ord.id, 'CANCELLED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500/10 text-red-500 border border-zinc-800 hover:border-red-500/20 cursor-pointer transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => updateOrderStatusOnServer(ord.id, 'READY')}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 flex items-center gap-1.5 cursor-pointer transition-all font-sans"
                    >
                      Marquer Prêt en cuisine
                    </button>
                  </>
                )}

                {/* Ready -> Complete */}
                {ord.status === 'READY' && (
                  <>
                    <button
                      onClick={() => updateOrderStatusOnServer(ord.id, 'COMPLETED')}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 flex items-center gap-1.5 cursor-pointer transition-all font-sans"
                    >
                      Encaisser & Compléter
                    </button>
                  </>
                )}

                {/* Completed / Cancelled -> Trash action */}
                {(ord.status === 'COMPLETED' || ord.status === 'CANCELLED') && (
                  <button
                    onClick={() => deleteOrderOnServer(ord.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500/15 text-red-400 flex items-center gap-1.5 border border-zinc-850 cursor-pointer transition-all"
                  >
                    <Trash2 size={12} />
                    {"Supprimer l'historique"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="col-span-1 xl:col-span-2 flex flex-col items-center justify-center py-20 bg-zinc-950/10 rounded-2xl border border-dashed border-zinc-800/80 text-center p-6">
            <ClipboardList className="text-zinc-700 mb-3" size={40} />
            <h3 className="text-zinc-300 font-semibold text-sm">Aucune commande trouvée</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm leading-relaxed">
              {"Vos commandes sur place ou en livraison apparaîtront ici dès qu'un client validera son panier de dégustation."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
