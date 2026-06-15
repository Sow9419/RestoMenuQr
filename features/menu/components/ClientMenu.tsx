'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/features/cart/store/cart.store';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useOrderStore } from '@/features/order/store/order.store';
import { createOrder } from '@/features/order/actions/orderActions';
import MenuRenderer from '@/templates/engine/MenuRenderer';
import { MenuItem } from '@/features/menu/types';
import { OrderItem, Order } from '@/features/order/types';
import {
  ShoppingBag,
  X,
  ChevronRight,
  Minus,
  Plus,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ClientMenu() {
  const { config } = useMenuStore();
  const cartStore = useCartStore();
  const { addOrder } = useOrderStore();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [orderStatus, setOrderStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [pendingOrderData, setPendingOrderData] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalPrice = cartStore.getTotalPrice();
  const totalQuantity = cartStore.getTotalQuantity();

  // Sync availability
  useEffect(() => {
    if (config) {
      cartStore.syncAvailability(config.items, config.isOpen);
    }
  }, [config, cartStore]);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 1500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const handleAddItem = (item: MenuItem) => {
    if (config) {
      cartStore.addToCart(item, config.isOpen);
      setSelectedItem(null);
      setToastMessage(`${item.name} ajouté !`);
    }
  };

  const submitOrderPayload = async (payload: OrderItem[]) => {
    if (!config?.id) return;

    setOrderStatus('SENDING');

    // Simulate slight delay for premium feel
    await new Promise(r => setTimeout(r, 1200));

    const res = await createOrder(config.id, {
      type: 'DINE_IN',
      items: payload,
      totalPrice: totalPrice,
      customerName: 'Client Mobile',
    });

    if (res.success && res.data) {
      const newOrder = res.data as Order;
      setPendingOrderData(newOrder);
      addOrder(newOrder);
      setOrderStatus('SUCCESS');
      cartStore.clearCart();

      // Auto close success after 4s
      setTimeout(() => {
        setOrderStatus('IDLE');
        setIsCartOpen(false);
      }, 4000);
    } else {
      setOrderStatus('ERROR');
    }
  };

  if (!config) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-stone-50">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="font-serif italic text-stone-400">Signature du Chef...</p>
    </div>
  );

  const style = config.style;

  return (
    <div className="relative min-h-screen bg-bg overflow-x-hidden pb-20">

      {/* Background Layer (Parallax effect simulated with absolute) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-overlay">
        <Image
          src="https://picsum.photos/id/1081/1920/1080?blur=10"
          alt="background"
          fill
          className="object-cover"
        />
      </div>

      {/* Actual Menu Rendering */}
      <MenuRenderer
        config={config}
        onItemClick={(item) => setSelectedItem(item)}
      />

      {/* Floating Action Button (FAB) for Cart */}
      <AnimatePresence>
        {cartStore.items.length > 0 && !isCartOpen && (
          <motion.button
            initial={{ y: 100, scale: 0.8 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 100, scale: 0.8 }}
            onClick={() => setIsCartOpen(true)}
            aria-label="Voir le panier"
            className="fixed bottom-6 right-6 z-40 h-16 px-6 bg-stone-900 text-white rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-stone-900">
                {totalQuantity}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Voir le panier</p>
              <p className="text-sm font-bold tracking-tight">
                {totalPrice.toLocaleString()} {style.currency}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-white/10 flex items-center gap-2 whitespace-nowrap"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Details Sheet */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] cursor-pointer"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[40px] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="relative h-64 shrink-0">
                {selectedItem.imageUrl ? (
                  <Image
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-200">
                    <ShoppingBag className="w-16 h-16" />
                  </div>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  aria-label="Fermer"
                  className="absolute top-6 right-6 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/20 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 pb-12 flex-1 overflow-y-auto space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-3xl font-bold tracking-tight leading-tight">{selectedItem.name}</h2>
                  <span className="text-2xl font-black text-primary whitespace-nowrap">
                    {selectedItem.price.toLocaleString()} {style.currency}
                  </span>
                </div>

                <p className="text-stone-500 leading-relaxed text-lg italic font-serif">
                  {selectedItem.description || "Une création artisanale du chef préparée avec des ingrédients de saison sélectionnés pour leur fraîcheur."}
                </p>

                <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-900 font-bold text-sm">Produit disponible en cuisine</span>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleAddItem(selectedItem)}
                    className="w-full h-16 bg-stone-900 text-white rounded-2xl text-lg font-bold flex items-center justify-center gap-4 hover:bg-black transition-all shadow-xl cursor-pointer"
                  >
                    Ajouter au panier <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[60] shadow-2xl flex flex-col"
            >
              <header className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-xl tracking-tight">Ma Commande</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-900 transition cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {orderStatus === 'SUCCESS' && pendingOrderData ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold">C&apos;est en route !</h4>
                      <p className="text-stone-500 leading-relaxed px-8">
                        Votre commande <span className="font-bold text-stone-900">{pendingOrderData.ticketNumber}</span> a été transmise à la cuisine.
                      </p>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-2xl w-full border border-stone-100">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Status en direct</p>
                      <p className="font-bold text-primary">PRÉPARATION EN COURS</p>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {cartStore.items.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-4 opacity-40">
                        <ShoppingBag className="w-16 h-16 stroke-[1.5]" />
                        <p className="font-medium">Votre panier est vide</p>
                      </div>
                    ) : (
                      cartStore.items.map((item) => (
                        <div key={item.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex justify-between items-center group">
                          <div className="space-y-1">
                            <p className="font-bold text-sm">{item.name}</p>
                            <p className="text-primary font-bold text-xs">{item.price.toLocaleString()} {style.currency}</p>
                          </div>
                          <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-sm border border-stone-200/50">
                            <button
                              onClick={() => cartStore.updateQuantity(item.id, -1)}
                              aria-label="Moins"
                              className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => cartStore.updateQuantity(item.id, 1)}
                              aria-label="Plus"
                              className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>

              {cartStore.items.length > 0 && orderStatus !== 'SUCCESS' && (
                <footer className="p-8 bg-stone-50 border-t border-stone-100 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-stone-400 text-sm">
                      <span>Total à payer</span>
                      <span>{totalPrice.toLocaleString()} {style.currency}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black tracking-tight">
                      <span>Total</span>
                      <span className="text-primary">{totalPrice.toLocaleString()} {style.currency}</span>
                    </div>
                  </div>

                  {orderStatus === 'ERROR' && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2 border border-red-100">
                      <AlertCircle className="w-4 h-4" /> Échec de la commande. Veuillez réessayer.
                    </div>
                  )}

                  <button
                    disabled={orderStatus === 'SENDING'}
                    onClick={() => submitOrderPayload(cartStore.items)}
                    className="w-full h-16 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary-hover disabled:grayscale transition-all cursor-pointer"
                  >
                    {orderStatus === 'SENDING' ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>COMMANDER MAINTENANT <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-stone-400 font-medium px-8">
                    En validant, votre commande sera directement transmise à notre cuisine. Paiement à la réception.
                  </p>
                </footer>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Support Button (WhatsApp) */}
      <a
        href={`https://wa.me/${config.phone.replace(/\+/g, '')}`}
        target="_blank"
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-emerald-600 transition-all hover:scale-110 cursor-pointer"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}
