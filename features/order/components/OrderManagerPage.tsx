'use client';

import React, { useState } from 'react';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useOrderStore } from '@/features/order/store/order.store';
import { createOrder, updateOrderStatus } from '@/features/order/actions/orderActions';
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
  const { config } = useMenuStore();
  const { orders, addOrder: pushOrderLocally, updateOrderStatus: updateLocalStatus, deleteOrder: deleteLocalOrder } = useOrderStore();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Generate a random mock order to help test the full synchronization flow instantly
  const handleCreateSimulatedOrder = async () => {
    if (!config?.id) return;
    const simulatedData = generateRandomMockOrder(config);
    if (!simulatedData) return;
    const response = await createOrder(config.id, simulatedData);
    if (response.success) {
      pushOrderLocally(response.data);
    }
  };

  // Filtering
  const filteredOrders = orders.filter(ord => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING') return ord.status === 'PENDING';
    if (filterStatus === 'CONFIRMED') return ord.status === 'CONFIRMED';
    if (filterStatus === 'PREPARING') return ord.status === 'PREPARING';
    if (filterStatus === 'READY') return ord.status === 'READY';
    if (filterStatus === 'ARCHIVED') return ord.status === 'COMPLETED' || ord.status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">⏳ En attente</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">🍊 Confirmée</span>;
      case 'PREPARING':
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">👨‍🍳 En Cuisine</span>;
      case 'READY':
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">📦 Prêt</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200 flex items-center gap-1">✅ Terminé</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-650 border border-red-200 flex items-center gap-1">❌ Annulé</span>;
    }
  };

  const formatPrice = (val: number) => {
    const parts = val.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${parts.join(".")} ${config?.style?.currency || 'FCFA'}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F5F4] p-6 md:p-8 space-y-6 select-none font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Cuisine ET Suivi Direct</span>
          <h1 className="text-3xl font-extrabold text-[#1C1917] tracking-tight flex items-center gap-2">
            Gestion Commande <ClipboardList className="text-emerald-500" size={24} />
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Gérez le flux de vos plats et changez les statuts en cuisine. Les clients sont avertis instantanément.
          </p>
        </div>

        <button
          onClick={handleCreateSimulatedOrder}
          className="flex items-center gap-2 px-5 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer"
        >
          <Sparkles size={14} />
          Simuler commande client
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E5E4] pb-2">
        <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'PENDING', label: 'En attente' },
            { id: 'CONFIRMED', label: 'Confirmées' },
            { id: 'PREPARING', label: 'En cuisine' },
            { id: 'READY', label: 'Prêtes' },
            { id: 'ARCHIVED', label: 'Archivées' }
          ].map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 h-9 rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-emerald-600 border border-[#E7E5E4] shadow-xs' 
                    : 'text-stone-500 hover:text-[#1C1917]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-stone-500 text-xs hidden sm:inline">
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
              className={`bg-white border rounded-2xl overflow-hidden shadow-xs flex flex-col ${
                ord.status === 'PENDING' ? 'border-amber-300 ring-2 ring-amber-500/5' :
                ord.status === 'CONFIRMED' ? 'border-orange-250 ring-2 ring-orange-500/5' :
                ord.status === 'PREPARING' ? 'border-blue-300' :
                ord.status === 'READY' ? 'border-emerald-300' :
                'border-[#E7E5E4]'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 bg-[#FAFAF9] border-b border-[#E7E5E4]/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-extrabold text-[#1C1917]">{ord.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide ${
                    ord.type === 'DINE_IN' 
                      ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {ord.type === 'DINE_IN' ? 'SUR PLACE' : 'LIVRAISON'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-xs font-semibold flex items-center gap-1.5 font-sans">
                    <Clock size={12} className="text-stone-400" />
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
                      <div className="flex items-center gap-2 text-stone-850">
                        <span className="font-extrabold text-emerald-650 font-mono text-[11px] bg-emerald-50 w-6 h-6 flex items-center justify-center rounded border border-emerald-100">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-[#1C1917]">{item.name}</span>
                      </div>
                      <span className="text-[#1C1917] font-mono font-semibold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing / total */}
                <div className="pt-3 border-t border-[#E7E5E4]/80 flex justify-between items-center bg-[#FAFAF9]/50 px-2 py-1.5 rounded-xl">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-sans">Total Commande</span>
                  <span className="text-sm font-bold text-[#1C1917] font-mono">{formatPrice(ord.totalPrice)}</span>
                </div>

                {/* Delivery details if any */}
                {ord.type === 'DELIVERY' && (
                  <div className="mt-3 p-3 bg-[#FAFAF9] rounded-xl border border-[#E7E5E4]/80 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-stone-600 font-bold">
                      <Smartphone size={13} className="text-emerald-500" />
                      <span>{ord.customerName || 'Client anonyme'} — </span>
                      <a href={`tel:${ord.whatsappNumber}`} className="hover:underline text-emerald-600 font-mono">{ord.whatsappNumber}</a>
                    </div>
                    {ord.deliveryAddress && (
                      <div className="flex items-start gap-2 text-stone-600 font-medium">
                        <MapPin size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="leading-tight">{ord.deliveryAddress}</span>
                      </div>
                    )}
                    {ord.deliveryNotes && (
                      <div className="p-2 bg-amber-50/50 rounded border border-amber-100 text-[11px] text-amber-700 font-medium italic">
                        {'"'} {ord.deliveryNotes} {'"'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-[#FAFAF9]/60 border-t border-[#E7E5E4] flex justify-end gap-2">
                {/* Pending -> Confirmed */}
                {ord.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                    if (!config?.id) return;
                    updateLocalStatus(ord.id, 'CANCELLED');
                    updateOrderStatus(config.id, ord.id, 'CANCELLED');
                  }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-red-50 text-red-650 border border-stone-200 hover:border-red-250 cursor-pointer transition-all"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => {
                    if (!config?.id) return;
                    updateLocalStatus(ord.id, 'CONFIRMED');
                    updateOrderStatus(config.id, ord.id, 'CONFIRMED');
                  }}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-orange-100/80 border border-orange-250 text-orange-600 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      Confirmer la commande
                    </button>
                  </>
                )}

                {/* Confirmed -> Preparing */}
                {ord.status === 'CONFIRMED' && (
                  <>
                    <button
                      onClick={() => {
                        if (!config?.id) return;
                        updateLocalStatus(ord.id, 'CANCELLED');
                        updateOrderStatus(config.id, ord.id, 'CANCELLED');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-red-50 text-red-650 border border-stone-200 hover:border-red-250 cursor-pointer transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                    if (!config?.id) return;
                    updateLocalStatus(ord.id, 'PREPARING');
                    updateOrderStatus(config.id, ord.id, 'PREPARING');
                  }}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-250 text-emerald-600 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      Lancer la préparation
                    </button>
                  </>
                )}

                {/* Preparing -> Ready */}
                {ord.status === 'PREPARING' && (
                  <>
                    <button
                      onClick={() => {
                        if (!config?.id) return;
                        updateLocalStatus(ord.id, 'CANCELLED');
                        updateOrderStatus(config.id, ord.id, 'CANCELLED');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-red-50 text-red-650 border border-stone-200 hover:border-red-250 cursor-pointer transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                    if (!config?.id) return;
                    updateLocalStatus(ord.id, 'READY');
                    updateOrderStatus(config.id, ord.id, 'READY');
                  }}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100/80 border border-blue-205 text-blue-600 flex items-center gap-1.5 cursor-pointer transition-all font-sans"
                    >
                      Marquer Prêt en cuisine
                    </button>
                  </>
                )}

                {/* Ready -> Complete */}
                {ord.status === 'READY' && (
                  <>
                    <button
                      onClick={() => {
                    if (!config?.id) return;
                    updateLocalStatus(ord.id, 'COMPLETED');
                    updateOrderStatus(config.id, ord.id, 'COMPLETED');
                  }}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-all font-sans"
                    >
                      Encaisser & Compléter
                    </button>
                  </>
                )}

                {/* Completed / Cancelled -> Trash action */}
                {(ord.status === 'COMPLETED' || ord.status === 'CANCELLED') && (
                  <button
                    onClick={() => deleteLocalOrder(ord.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-red-50 text-red-600 flex items-center gap-1.5 border border-[#E7E5E4] cursor-pointer transition-all"
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
          <div className="col-span-1 xl:col-span-2 flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-stone-200 text-center p-6 shadow-xs">
            <ClipboardList className="text-stone-300 mb-3" size={40} />
            <h3 className="text-[#1C1917] font-bold text-sm">Aucune commande trouvée</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm leading-relaxed">
              {"Vos commandes sur place ou en livraison apparaîtront ici dès qu'un client validera son panier de dégustation."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
