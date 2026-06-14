'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useOrderStore } from '@/features/order/store/order.store';
import { createOrder } from '@/features/order/actions/orderActions';
import { MenuItem, OrderItem, Order } from '@/lib/restoTypes';
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

function generateCaisseTicket(paymentMethod: string) {
  const ticketPrefix = paymentMethod === 'CASH' ? 'C' : 'K';
  const num = Math.floor(Math.random() * 90) + 10;
  return {
    ticketNumber: `#${ticketPrefix}${num}`,
    fallbackId: `pos-${Date.now()}`,
    nowIso: new Date().toISOString()
  };
}

export default function CaissePage() {
  const { config } = useMenuStore();
  const { addOrder } = useOrderStore();

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [showReceipt, setShowReceipt] = useState<(Order & { paymentMethod: string; changeDue: number | null }) | null>(null);

  const categories = config?.categories || [];
  const allProducts = config?.items || [];

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item: MenuItem) => {
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
    }).filter(Boolean) as OrderItem[]);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const { ticketNumber, fallbackId, nowIso } = generateCaisseTicket(paymentMethod);

    if (!config?.id) {
      alert('Configuration restaurant non chargée.');
      return;
    }

    const response = await createOrder(config.id, {
      type: 'DINE_IN',
      items: cart,
      totalPrice,
      customerName: 'Dîneur sur Place',
    });

    let validatedOrder: Order;
    if (response.success) {
      validatedOrder = response.data as Order;
      addOrder(validatedOrder);
    } else {
      // Fallback receipt si server action échoue
      validatedOrder = {
        id: fallbackId,
        ticketNumber,
        createdAt: nowIso,
        type: 'DINE_IN',
        status: 'COMPLETED',
        items: cart,
        totalPrice,
        restaurantSlug: config?.slug || ''
      };
    }

    // Popup simulated receipt
    setShowReceipt({
      ...validatedOrder,
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
                aria-label="Fermer le reçu"
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center gap-2 mb-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                  <CircleCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-sans tracking-tight">Paiement Réussi</h3>
                <p className="text-slate-500 font-sans">Ticket ${showReceipt.ticketNumber}</p>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-4 space-y-2">
                {showReceipt.items.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.quantity}x {i.name}</span>
                    <span>{formatPrice(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-200 mt-4 pt-4 space-y-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL</span>
                  <span>{formatPrice(showReceipt.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Méthode</span>
                  <span>{showReceipt.paymentMethod === 'CASH' ? 'Espèces' : 'Carte Bancaire'}</span>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full mt-8 h-12 bg-slate-900 text-white rounded-xl font-sans font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimer le Reçu
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header / Search */}
        <header className="h-20 bg-white border-b border-stone-200 flex items-center px-6 gap-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher un plat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher un plat"
              className="w-full h-11 pl-11 pr-4 bg-stone-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-transparent focus:bg-white focus:border-primary/20"
            />
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="h-10 w-[1px] bg-stone-200 mx-2" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Terminal</p>
              <p className="text-sm font-semibold">Caisse Centrale #01</p>
            </div>
          </div>
        </header>

        {/* Grid Products */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => addToCart(product)}
                aria-label={`Ajouter ${product.name} au panier`}
                className="group bg-white p-3 rounded-2xl border border-stone-200 hover:border-primary/30 transition-all shadow-sm hover:shadow-md text-left flex flex-col h-full cursor-pointer"
              >
                <div className="aspect-square rounded-xl bg-stone-100 mb-3 overflow-hidden relative">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <Sparkles className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm z-10">
                    {formatPrice(product.price)}
                  </div>
                </div>
                <h4 className="font-semibold text-sm line-clamp-2 leading-snug flex-1">{product.name}</h4>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-[400px] bg-white border-l border-stone-200 flex flex-col shrink-0 shadow-2xl lg:shadow-none">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg tracking-tight">Panier Actuel</h2>
          </div>
          <span className="bg-stone-100 px-3 py-1 rounded-full text-[10px] font-bold text-stone-500 uppercase tracking-wider">
            {cart.length} Articles
          </span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false}>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-3 opacity-60">
                <Calculator className="w-12 h-12 stroke-[1.5]" />
                <p className="text-sm font-medium">Panier vide</p>
              </div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-stone-50 p-4 rounded-2xl border border-stone-100 group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-sm pr-4">{item.name}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Retirer ${item.name} du panier`}
                      className="text-stone-300 hover:text-error transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center bg-white rounded-xl border border-stone-200 p-1">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        aria-label="Diminuer la quantité"
                        className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 rounded-lg transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        aria-label="Augmenter la quantité"
                        className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 rounded-lg transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-sm text-primary">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer Payment */}
        <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-stone-500 text-sm">
              <span>Sous-total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-stone-200/50">
              <span>Total à payer</span>
              <span className="text-primary">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('CASH')}
              aria-label="Payer en espèces"
              className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                paymentMethod === 'CASH'
                ? 'bg-white border-2 border-primary shadow-md ring-4 ring-primary/5'
                : 'bg-white border border-stone-200 text-stone-400'
              }`}
            >
              <Coins className={`w-5 h-5 ${paymentMethod === 'CASH' ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Espèces</span>
            </button>
            <button
              onClick={() => setPaymentMethod('CARD')}
              aria-label="Payer par carte ou Wave"
              className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                paymentMethod === 'CARD'
                ? 'bg-white border-2 border-primary shadow-md ring-4 ring-primary/5'
                : 'bg-white border border-stone-200 text-stone-400'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${paymentMethod === 'CARD' ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Carte / Wave</span>
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full h-16 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:opacity-50 disabled:grayscale transition-all cursor-pointer"
          >
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <CircleCheck className="w-5 h-5" />
            </div>
            VALIDER L&apos;ENCAISSEMENT
          </motion.button>
        </div>
      </div>
    </div>
  );
}
