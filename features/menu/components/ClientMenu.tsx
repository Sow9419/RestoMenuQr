'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/features/cart/store/cart.store';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useOrderStore } from '@/features/order/store/order.store';
import { createOrder, getOrderTracker } from '@/features/order/actions/orderActions';
import MenuRenderer from '@/templates/engine/MenuRenderer';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  MapPin, 
  Clock, 
  X, 
  AlertCircle, 
  Smartphone, 
  Check, 
  WifiOff, 
  MessageSquare,
  ChevronLeft,
  Store,
  Compass,
  Info
} from 'lucide-react';
import { MenuItem, MenuCategory, Order, OrderStatus, OrderType } from '@/lib/restoTypes';
import { BACKGROUND_PRESETS, FONTS_LIST } from '@/lib/defaultData';
import { motion, AnimatePresence } from 'motion/react';

interface ClientMenuProps {
  isPreview?: boolean;
}

export default function ClientMenu({ isPreview = false }: ClientMenuProps) {
  // 1. Consume Zustand features stores
  const { config } = useMenuStore();
  const { orders, addOrder: pushOrderLocally } = useOrderStore();
  const cartStore = useCartStore();

  const style = config?.style || DEFAULT_STYLE;
  const isLight = style.displayMode === 'light';

  // Semantic styles for the Light Theme
  const colorBg = isLight ? 'bg-[#FAFAF9]' : 'bg-slate-900';
  const colorSurfaceBg = isLight ? 'bg-[#F5F5F4]' : 'bg-slate-950/40';
  const colorBorder = isLight ? 'border-[#E7E5E4]' : 'border-slate-800';
  const colorTextPrimary = isLight ? 'text-[#1C1917]' : 'text-slate-100';
  const colorTextSecondary = isLight ? 'text-[#78716C]' : 'text-slate-300';

  const currentPreset = BACKGROUND_PRESETS.find(p => p.id === style.backgroundImageUrl) || BACKGROUND_PRESETS[0];
  const currentFont = FONTS_LIST.find(f => f.id === style.fontFamily) || FONTS_LIST[0];

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clientStep, setClientStep] = useState<'MENU' | 'CART' | 'CHOOSE_MODE' | 'CONFIRM_DINE_IN' | 'FORM_DELIVERY' | 'OFFLINE_RECONNECTING' | 'DELIVERY_CONFIRMATION' | 'TRACKING'>('MENU');
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

  // Delivery form fields
  const [deliveryWhatsApp, setDeliveryWhatsApp] = useState('');
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Simulated Offline settings
  const isNetworkSimulatedOffline = false; // defaults
  const isWhatsAppSimulatedInstalled = true;
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  // Sync cart items with store availability on config change
  useEffect(() => {
    if (config) {
      cartStore.syncAvailability(config.items, config.isOpen);
    }
  }, [config, cartStore]);

  // Toast feedback duration
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 1500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!config) return;
    cartStore.addToCart(item, config.isOpen);
    triggerToast(`Ajouté : ${item.name} 🛒`);
  };

  const formatPrice = (val: number) => {
    const parts = val.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${parts.join(".")} ${style.currency}`;
  };

  // Address lookup / smart geolocation simulation
  const handleAutoFillAddress = () => {
    setDeliveryAddress('Corniche Ouest, Face Mosquée de la Divinité, Dakar (Simulé)');
    triggerToast('📍 Adresse intelligente remplie !');
  };

  // Order submission via Server Action
  const handlePlaceOrder = async (type: OrderType) => {
    if (!config) return;
    if (cartStore.items.length === 0) {
      triggerToast('Erreur : Panier vide (ERR_CART_EMPTY)');
      return;
    }

    if (!cartStore.isCartValid()) {
      triggerToast('Erreur : Certains articles ne sont plus disponibles (ERR_CART_ITEM_UNAVAILABLE)');
      return;
    }

    const orderPayload = {
      type,
      items: cartStore.items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })),
      totalPrice: cartStore.getTotalPrice(),
      customerName: type === 'DELIVERY' ? deliveryName : 'Dîneur sur Place',
      whatsappNumber: type === 'DELIVERY' ? deliveryWhatsApp : undefined,
      deliveryAddress: type === 'DELIVERY' ? deliveryAddress : undefined,
      deliveryNotes: type === 'DELIVERY' ? deliveryNotes : undefined
    };

    if (isNetworkSimulatedOffline) {
      setPendingOrderData(orderPayload);
      setRetryAttempt(1);
      setClientStep('OFFLINE_RECONNECTING');
      return;
    }

    await submitOrderPayload(orderPayload);
  };

  const submitOrderPayload = async (payload: any) => {
    if (!config?.id) return;
    try {
      const response = await createOrder(config.id, payload);
      if (response.success) {
        const validated = response.data;
        setTrackedOrderId(validated.id);
        pushOrderLocally(validated);
        cartStore.clearCart(); // Flush cart
        
        if (payload.type === 'DINE_IN') {
          setClientStep('TRACKING');
        } else {
          setClientStep('DELIVERY_CONFIRMATION');
        }
      } else {
        triggerToast(`Erreur: ${response.error.message}`);
      }
    } catch (err) {
      triggerToast('Une erreur interne est survenue');
    }
  };

  // Form validations for Delivery Flow
  const validateDeliveryForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!deliveryWhatsApp.trim()) {
      errors.push('Le numéro WhatsApp est requis pour la confirmation (ERR_INVALID_WHATSAPP)');
    }
    if (!deliveryAddress.trim()) {
      errors.push("L'adresse de livraison est obligatoire (ERR_ADDRESS_REQUIRED)");
    }
    if (deliveryNotes.length > 300) {
      errors.push('La note ne peut excéder 300 caractères (ERR_FORM_INCOMPLETE)');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      errors.forEach(err => triggerToast(err));
      return;
    }

    setValidationErrors([]);
    handlePlaceOrder('DELIVERY');
  };

  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const handleWhatsAppRedirection = () => {
    if (!trackedOrderId) return;
    const order = orders.find(o => o.id === trackedOrderId);
    if (!order) return;

    if (!isWhatsAppSimulatedInstalled) {
      triggerToast('Erreur : WhatsApp non installé (ERR_WHATSAPP_NOT_FOUND)');
      return;
    }
    setShowWhatsAppModal(true);
  };

  const currentlyTrackedOrder = orders.find(o => o.id === trackedOrderId);

  if (!config) return null;

  return (
    <div className={`h-full w-full flex flex-col relative select-none text-slate-800 ${currentFont.class} overflow-hidden`}>
      {/* Background visual selection */}
      {currentPreset.url ? (
        <div className="absolute inset-0 z-0">
          <img src={currentPreset.url} alt="background" className="w-full h-full object-cover" />
          <div 
            className={`absolute inset-0 ${isLight ? 'bg-[#FAFAF9]' : 'bg-slate-900'}`}
            style={{ opacity: isLight ? '100%' : `${style.overlayOpacity}%` }}
          />
        </div>
      ) : (
        <div className={`absolute inset-0 ${isLight ? 'bg-[#FAFAF9]' : currentPreset.class} z-0`} />
      )}

      {/* Dynamic colors injectors */}
      <style dangerouslySetInnerHTML={{__html: `
        .brand-accent-bg { background-color: ${style.accentColor} !important; }
        .brand-accent-text { color: ${style.accentColor} !important; }
        .brand-accent-border { border-color: ${style.accentColor} !important; }
      `}} />

      {/* Toast popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 inset-x-4 mx-auto max-w-[260px] bg-slate-950/95 text-white py-2.5 px-4 rounded-xl text-[11px] font-semibold text-center shadow-xl z-50 pointer-events-none flex items-center justify-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full brand-accent-bg shrink-0"></span>
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!config.isOpen && clientStep === 'MENU' && (
        <div className="bg-red-650 text-white font-bold text-center py-2 px-3 text-[10px] uppercase animate-pulse z-40 relative flex items-center justify-center gap-1.5 shrink-0">
          <AlertCircle size={12} />
          <span>Restaurant fermé — Consultation uniquement</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto relative z-10 flex flex-col">
        {clientStep === 'MENU' && (
          <div className="flex-1 flex flex-col pb-24">
            {config.sections.find(s => s.id === 'hero')?.enabled && (
              <div className="h-44 relative overflow-hidden flex-shrink-0">
                <img src={style.heroBannerUrl} alt="Hero" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 left-4 text-white">
                  <h1 className="text-xl font-extrabold truncate">{style.heroTitle || config.name}</h1>
                  <p className="text-[10px] text-slate-300 line-clamp-2 mt-1 leading-normal font-light">
                    {style.heroDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Search controls */}
            <div className="px-4 pt-4 shrink-0">
              <div className="relative">
                <Search className={`absolute left-3.5 top-3 ${isLight ? 'text-[#78716C]' : 'text-slate-500'}`} size={14} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un plat..."
                  className={`w-full text-xs rounded-2xl pl-9 pr-8 py-3 focus:outline-none focus:border-rose-500 transition-all ${
                    isLight 
                      ? 'bg-[#F5F5F4] border border-[#E7E5E4] text-[#1C1917] placeholder-[#A8A29E]' 
                      : 'bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Content Category tab selector */}
            {config.sections.find(s => s.id === 'categories')?.enabled && (
              <div className="px-4 pt-3.5 pb-1 shrink-0">
                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                  <button
                    onClick={() => setActiveCategory('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${
                      activeCategory === 'ALL' 
                        ? 'brand-accent-bg text-white shadow-md' 
                        : isLight ? 'bg-[#F5F5F4] text-[#78716C]' : 'bg-slate-950/50 text-slate-300'
                    }`}
                  >
                    Tout
                  </button>
                  {config.categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${
                        activeCategory === cat.id 
                          ? 'brand-accent-bg text-white shadow-md' 
                          : isLight ? 'bg-[#F5F5F4] text-[#78716C]' : 'bg-slate-950/50 text-slate-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Renderer Engine Component Integration */}
            {config.sections.find(s => s.id === 'menu')?.enabled && (
              <div className="px-4 mt-3 flex-1">
                <MenuRenderer 
                  config={config} 
                  activeCategory={activeCategory} 
                  setActiveCategory={setActiveCategory} 
                  searchTerm={searchTerm}
                  onAddItem={handleAddToCart}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CART / BASKET SUMMARY */}
        {clientStep === 'CART' && (
          <div className="flex-1 p-4 flex flex-col font-sans max-w-md mx-auto w-full relative z-10 pb-20">
            <div className={`flex items-center gap-2 pb-4 border-b ${isLight ? 'border-[#E7E5E4]' : 'border-slate-900'}`}>
              <button onClick={() => setClientStep('MENU')} className="p-1.5 hover:bg-[#E7E5E4] rounded-lg">
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-extrabold">Détail de mon Panier</h2>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cartStore.items.map((c) => (
                <div key={c.id} className="p-3.5 rounded-2xl flex justify-between items-center gap-3 bg-[#F5F5F4] border border-[#E7E5E4]">
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="text-xs font-bold truncate">{c.name}</h4>
                    <p className="text-[10px] font-mono mt-0.5">{formatPrice(c.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg p-0.5 border bg-white border-[#E7E5E4]">
                      <button onClick={() => cartStore.updateQuantity(c.id, -1)} className="w-5 h-5 flex items-center justify-center">
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold px-2">{c.quantity}</span>
                      <button onClick={() => cartStore.updateQuantity(c.id, 1)} className="w-5 h-5 flex items-center justify-center">
                        <Plus size={10} />
                      </button>
                    </div>
                    <button onClick={() => cartStore.removeFromCart(c.id)} className="text-slate-500 hover:text-red-400 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {cartStore.items.length === 0 && (
                <div className="py-24 text-center text-slate-550">Votre panier est vide.</div>
              )}
            </div>

            {cartStore.items.length > 0 && (
              <div className="pt-4 border-t space-y-4 border-[#E7E5E4]">
                <div className="p-4 bg-[#F5F5F4] border border-[#E7E5E4] rounded-2xl space-y-2 text-left">
                  <div className="flex justify-between text-xs">
                    <span>Quantité totale :</span>
                    <span>{cartStore.getTotalQuantity()}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-t border-[#E7E5E4] font-bold">
                    <span>Total :</span>
                    <span className="brand-accent-text text-base">{formatPrice(cartStore.getTotalPrice())}</span>
                  </div>
                </div>

                <button
                  onClick={() => setClientStep('CHOOSE_MODE')}
                  className="w-full py-3.5 rounded-xl brand-accent-bg text-white text-xs font-bold shadow-lg flex items-center justify-center gap-1.5"
                >
                  Passer la commande
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: CHOOSE_MODE */}
        {clientStep === 'CHOOSE_MODE' && (
          <div className="flex-1 p-5 flex flex-col max-w-sm mx-auto w-full justify-center relative z-10 space-y-6">
            <h3 className="text-base font-extrabold text-white text-center">Choisissez votre mode de service</h3>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setClientStep('CONFIRM_DINE_IN')}
                className="p-5 rounded-2xl bg-slate-950/60 border border-slate-900 text-left flex items-center gap-4 cursor-pointer"
              >
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                  <Store size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Sur Place</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Priorité cuisine, retrait comptoir.</p>
                </div>
              </button>

              <button
                onClick={() => setClientStep('FORM_DELIVERY')}
                className="p-5 rounded-2xl bg-slate-950/60 border border-slate-900 text-left flex items-center gap-4 cursor-pointer"
              >
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                  <Compass size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Livraison</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Envoi par WhatsApp et livraison express.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRM_DINE_IN */}
        {clientStep === 'CONFIRM_DINE_IN' && (
          <div className="flex-1 p-5 flex flex-col max-w-sm mx-auto w-full justify-center relative z-10 space-y-5">
            <div className="rounded-2xl p-5 border bg-slate-950/60 border-slate-950 space-y-4 text-left">
              <h3 className="text-sm font-extrabold text-center border-b border-slate-900 pb-2 text-slate-100">Résumé Sur Place</h3>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Total à valider :</span>
                <span className="font-mono brand-accent-text font-bold">{formatPrice(cartStore.getTotalPrice())}</span>
              </div>
            </div>
            <button onClick={() => handlePlaceOrder('DINE_IN')} className="w-full py-3.5 rounded-xl brand-accent-bg text-white text-xs font-bold">
              Valider ma commande sur place
            </button>
          </div>
        )}

        {/* STEP 5: FORM_DELIVERY */}
        {clientStep === 'FORM_DELIVERY' && (
          <form onSubmit={validateDeliveryForm} className="flex-1 p-4 flex flex-col max-w-md mx-auto w-full relative z-10 pb-20">
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">WhatsApp N°</label>
                <input 
                  type="tel" required placeholder="+221 77 123 45 67" 
                  value={deliveryWhatsApp} onChange={(e) => setDeliveryWhatsApp(e.target.value)}
                  className="w-full text-xs rounded-xl px-4 py-3 bg-slate-950/65 border border-slate-800 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Votre Nom</label>
                <input 
                  type="text" placeholder="Ex. Mamadou Sow" 
                  value={deliveryName} onChange={(e) => setDeliveryName(e.target.value)}
                  className="w-full text-xs rounded-xl px-4 py-3 bg-slate-950/65 border border-slate-800 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Adresse Complète</label>
                <textarea 
                  required rows={2} placeholder="Rue, Immeuble..." 
                  value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full text-xs rounded-xl px-4 py-3 bg-slate-950/65 border border-slate-800 text-slate-200"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 mt-6 rounded-xl brand-accent-bg text-white text-xs font-bold">
              Soumettre la livraison
            </button>
          </form>
        )}

        {/* STEP 7: DELIVERY_CONFIRMATION */}
        {clientStep === 'DELIVERY_CONFIRMATION' && currentlyTrackedOrder && (
          <div className="flex-1 p-5 flex flex-col max-w-sm mx-auto w-full justify-center text-center space-y-4 text-slate-300">
            <h3 className="text-base font-extrabold text-slate-100">Commande {currentlyTrackedOrder.ticketNumber} Enregistrée !</h3>
            <button onClick={() => setClientStep('TRACKING')} className="w-full py-3 rounded-xl brand-accent-bg text-white font-bold text-xs">
              Suivre ma commande →
            </button>
          </div>
        )}

        {/* STEP 8: TRACKING */}
        {clientStep === 'TRACKING' && currentlyTrackedOrder && (
          <div className="flex-1 p-4 flex flex-col max-w-sm mx-auto w-full justify-center text-center text-slate-300">
            <div className="bg-slate-950/60 rounded-3xl p-5 border border-slate-900 space-y-4">
              <h3 className="text-3xl font-black text-white font-mono">{currentlyTrackedOrder.ticketNumber}</h3>
              <p className="text-xs">Statut actuel : <span className="brand-accent-text font-bold">{currentlyTrackedOrder.status}</span></p>
            </div>
            <button onClick={() => { setClientStep('MENU'); setTrackedOrderId(null); }} className="w-full py-3 mt-4 rounded-xl bg-slate-900 border border-slate-800">
              Retourner au menu
            </button>
          </div>
        )}
      </div>

      {(clientStep === 'MENU' || clientStep === 'CART') && (
        <div className={`absolute bottom-0 inset-x-0 backdrop-blur-md border-t p-4 z-40 ${isLight ? 'bg-[#FAFAF9]/95 border-[#E7E5E4]' : 'bg-slate-950/90 border-slate-900'}`}>
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setClientStep('MENU')} className="flex flex-col items-center gap-1 py-1 px-3.5 text-slate-500">
                <Compass size={16} />
                <span className="text-[9px] font-bold">Le Menu</span>
              </button>
              <button onClick={() => setClientStep('CART')} className="flex flex-col items-center gap-1 py-1 px-3.5 text-slate-500 relative">
                <ShoppingBag size={16} />
                <span className="text-[9px] font-bold">Panier</span>
                {cartStore.getTotalQuantity() > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full brand-accent-bg text-white text-[9px] flex items-center justify-center font-bold">
                    {cartStore.getTotalQuantity()}
                  </span>
                )}
              </button>
            </div>

            {cartStore.getTotalQuantity() > 0 && clientStep === 'MENU' && (
              <button onClick={() => setClientStep('CART')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl brand-accent-bg text-white text-xs font-bold">
                <span>Commander ({cartStore.getTotalQuantity()})</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px]">
                  {formatPrice(cartStore.getTotalPrice())}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_STYLE = {
  displayMode: 'light' as const,
  accentColor: '#e11d48',
  fontFamily: 'font-sans',
  heroBannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400',
  heroTitle: 'Cuisine d\'Exception',
  heroDescription: 'Commandes sur place instantanées.',
  density: 'confortable' as const,
  backgroundImageUrl: 'slate',
  overlayOpacity: 10,
  glassmorphism: true,
  showCategoryIcons: true,
  currency: 'FCFA'
};
