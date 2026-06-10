'use client';

import React, { useState } from 'react';
import { useResto } from './RestoContext';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Search, 
  Coins, 
  Calculator, 
  Printer, 
  Sparkles, 
  CreditCard,
  CircleCheck,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function generateCaisseTicket(paymentMethod: string): string {
  const ticketPrefix = paymentMethod === 'CASH' ? 'C' : 'K';
  const num = Math.floor(Math.random() * 90) + 10;
  return `#${ticketPrefix}${num}`;
}

export default function CaissePage() {
  const { config, addOrderOnServer } = useResto();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  
  // Receipt printable overlay state
  const [showReceipt, setShowReceipt] = useState<any>(null);

  // Filters
  const categories = config?.categories || [];
  const items = config?.items || [];

  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          it.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || it.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && it.isAvailable;
  });

  const addToCart = (item: any) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const nextQty = i.quantity + delta;
        return nextQty > 0 ? { ...i, quantity: nextQty } : null;
      }
      return i;
    }).filter(Boolean) as any);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Create completed order on server using outer pure generator
    const ticketNumber = generateCaisseTicket(paymentMethod);

    const orderData = {
      type: 'DINE_IN' as any,
      items: cart,
      totalPrice: totalPrice,
      status: 'COMPLETED' as any,
      ticketNumber
    };

    const validatedOrder = await addOrderOnServer(orderData);
    
    // Popup simulated receipt
    setShowReceipt({
      ...validatedOrder,
      items: cart,
      paymentMethod,
      changeDue: paymentMethod === 'CASH' ? 0 : null
    });

    // Reset cart
    setCart([]);
  };

  const formatPrice = (val: number) => {
    const parts = val.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${parts.join(".")} ${config?.style?.currency || 'FCFA'}`;
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#F5F5F4] select-none overflow-hidden h-[calc(100vh-1px)]">
      
      {/* Receipts Drawer Overlays */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full font-mono text-xs border border-slate-200 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowReceipt(null)}
                className="absolute right-4 top-4 hover:bg-slate-100 p-1.5 rounded-full cursor-pointer text-slate-500"
              >
                <X size={16} />
              </button>

              {/* Printable design style */}
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-800 font-sans font-bold">
                  POS
                </div>
                <h3 className="font-sans font-bold text-base mt-2">{config?.name || 'Le Palace'}</h3>
                <p className="text-[10px] text-slate-500">{config?.address}</p>
                <p className="text-[10px] text-slate-500">{config?.phone}</p>
              </div>

              {/* Ticket No / Time */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>TICKET :</span>
                  <span className="font-bold">{showReceipt.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE :</span>
                  <span>{new Date(showReceipt.createdAt).toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>CAISSIER :</span>
                  <span>Gérant Resto</span>
                </div>
                <div className="flex justify-between">
                  <span>MODE :</span>
                  <span>{showReceipt.paymentMethod === 'CASH' ? 'ESPÈCES' : 'CARTE COMMERCIALE.'}</span>
                </div>
              </div>

              {/* Items listing */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
                {showReceipt.items.map((item: any, id: number) => (
                  <div key={id} className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="font-bold">{item.name}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    <div className="text-slate-500 flex justify-between text-[10px]">
                      <span>{item.quantity} x {formatPrice(item.price)}</span>
                      <span>TVA 18% Incl.</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-3 space-y-1 text-sm font-bold">
                <div className="flex justify-between">
                  <span>SOUS-TOTAL :</span>
                  <span>{formatPrice(showReceipt.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-base border-t border-slate-200 pt-2 text-emerald-600 font-sans">
                  <span>TOTAL :</span>
                  <span>{formatPrice(showReceipt.totalPrice)}</span>
                </div>
              </div>

              {/* Success stamp */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center mt-4">
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-bold font-sans">
                  <CircleCheck size={14} />
                  <span>TRANSACTION COMPLÉTÉE</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1 leading-normal font-sans">
                  {"Merci de votre d'achat! Digitalisé avec RestoMenu en < 20 min."}
                </p>
              </div>

              {/* Buttons */}
              <div className="mt-5 flex gap-2 font-sans">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300/30"
                >
                  <Printer size={13} /> Imprimer
                </button>
                <button
                  onClick={() => setShowReceipt(null)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-center cursor-pointer"
                >
                  Nouveau reçu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid Zone */}
      <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-5 flex flex-col h-full bg-[#F5F5F4]">
        {/* Search & Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider font-sans">Caisse Physique Comptoir</span>
            <h1 className="text-2xl font-extrabold text-[#1C1917] tracking-tight flex items-center gap-2 font-sans">
              Module Caisse POS <Calculator className="text-emerald-500" size={20} />
            </h1>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-stone-400" size={15} />
            <input 
              type="text"
              placeholder="Rechercher un plat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E7E5E4] text-xs rounded-xl pl-9 pr-4 py-2.5 text-[#1C1917] placeholder-stone-400 focus:outline-none focus:border-emerald-500 transition-all font-sans shadow-xs"
            />
          </div>
        </div>

        {/* Categories Tab scrolling */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer font-sans border ${
              selectedCategory === 'ALL' 
                ? 'bg-white text-emerald-600 border-[#E7E5E4] shadow-xs' 
                : 'text-stone-500 hover:text-[#1C1917] border-transparent hover:bg-white/50'
            }`}
          >
            Tous les plats
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer font-sans border ${
                selectedCategory === cat.id 
                  ? 'bg-white text-emerald-600 border-[#E7E5E4] shadow-xs' 
                  : 'text-stone-500 hover:text-[#1C1917] border-transparent hover:bg-white/50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(item)}
                className="bg-white hover:bg-[#FAFAF9] transition-all border border-[#E7E5E4] rounded-2xl p-3 flex gap-3 cursor-pointer items-center relative overflow-hidden group hover:border-emerald-300 shadow-xs"
              >
                {/* Product thumbnail */}
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-[#E7E5E4] group-hover:scale-105 transition-transform"
                />

                {/* Product Label */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-extrabold text-[#1C1917] truncate font-sans">{item.name}</h4>
                  <p className="text-[11px] text-stone-700 font-semibold font-mono mt-0.5">{formatPrice(item.price)}</p>
                  <p className="text-[10px] text-stone-450 truncate font-sans">{item.description}</p>
                </div>

                {/* Micro badge indicator */}
                <div className="w-6 h-6 rounded-lg bg-[#F5F5F4] flex items-center justify-center text-stone-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 border border-[#E7E5E4] group-hover:border-emerald-250 select-none transition-all">
                  <Plus size={12} />
                </div>
              </motion.div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-1 sm:col-span-2 xl:col-span-3 py-16 text-center text-stone-500 font-sans">
                Aucun plat disponible ne correspond aux critères de recherche.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Sidebar panel */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-[#E7E5E4] p-5 flex flex-col shrink-0">
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-emerald-600" size={18} />
            <span className="font-bold text-sm text-[#1C1917] font-sans">{"Panier d'Enregistrement"}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#F5F5F4] text-emerald-600 border border-emerald-200">
            {cart.reduce((sum, i) => sum + i.quantity, 0)} plats
          </span>
        </div>

        {/* Scrollable list of selected items */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-3 flex justify-between items-center gap-3 font-sans">
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-[#1C1917] truncate">{item.name}</h5>
                <span className="text-[10px] text-stone-500 font-mono italic">{formatPrice(item.price)} la part</span>
              </div>

              {/* Adjust qty panel */}
              <div className="flex items-center bg-white border border-[#E7E5E4] rounded-lg p-0.5">
                <button 
                  onClick={() => updateQty(item.id, -1)}
                  className="w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-[#1C1917] cursor-pointer"
                >
                  <Minus size={10} />
                </button>
                <span className="text-xs font-mono font-bold px-2 text-[#1C1917]">{item.quantity}</span>
                <button 
                  onClick={() => updateQty(item.id, 1)}
                  className="w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-[#1C1917] cursor-pointer"
                >
                  <Plus size={10} />
                </button>
              </div>

              {/* Delete */}
              <button 
                onClick={() => removeFromCart(item.id)}
                className="text-stone-400 hover:text-red-600 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 font-sans">
              <Calculator className="text-stone-300 mb-2" size={32} />
              <span className="text-xs font-bold text-stone-750">Panier comptoir vide</span>
              <p className="text-[10px] text-stone-400 mt-1 max-w-[200px]">Cliquez sur les plats de la grille pour les ajouter directement au ticket.</p>
            </div>
          )}
        </div>

        {/* Payment selector and totals */}
        {cart.length > 0 && (
          <div className="pt-4 border-t border-[#E7E5E4] space-y-4">
            <div className="space-y-1.5 font-sans">
              <label className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Moyen de paiement</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    paymentMethod === 'CASH'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-300 font-bold shadow-xs'
                      : 'bg-[#F5F5F4] text-stone-505 border-transparent hover:bg-[#E7E5E4] hover:text-[#1C1917]'
                  }`}
                >
                  <Coins size={12} /> Espèces
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2 px-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    paymentMethod === 'CARD'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-300 font-bold shadow-xs'
                      : 'bg-[#F5F5F4] text-stone-505 border-transparent hover:bg-[#E7E5E4] hover:text-[#1C1917]'
                  }`}
                >
                  <CreditCard size={12} /> Carte
                </button>
              </div>
            </div>

            {/* Total count details */}
            <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-3.5 space-y-1.5 shadow-xs">
              <div className="flex justify-between items-center text-xs text-stone-505 font-sans">
                <span>{"Nombre d'articles :"}</span>
                <span className="font-mono font-semibold">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-stone-505 font-sans">
                <span>TVA (18%) :</span>
                <span className="font-mono font-semibold">{formatPrice(Math.round(totalPrice * 0.18))} (incluse)</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E7E5E4]/80 font-sans">
                <span className="text-xs font-bold text-stone-700">Total à payer :</span>
                <span className="text-base font-extrabold text-[#1C1917] font-mono">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Main checkout trigger */}
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs tracking-wide shadow-xs hover:shadow transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2 font-sans"
            >
              <Sparkles size={14} />
              Encaisser et Facturer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
