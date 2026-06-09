'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useResto } from './RestoContext';
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
  CornerDownRight,
  Info
} from 'lucide-react';
import { MenuItem, MenuCategory, Order, OrderStatus, OrderType } from '@/lib/restoTypes';
import { BACKGROUND_PRESETS, FONTS_LIST } from '@/lib/defaultData';
import { motion, AnimatePresence } from 'motion/react';

interface ClientMenuProps {
  isPreview?: boolean;
}

export default function ClientMenu({ isPreview = false }: ClientMenuProps) {
  const { 
    config, 
    orders, 
    addOrderOnServer, 
    isNetworkSimulatedOffline, 
    isWhatsAppSimulatedInstalled 
  } = useResto();

  // Selected theme/css properties based on config style setting
  const style = config?.style || DEFAULT_STYLE;
  const currentPreset = BACKGROUND_PRESETS.find(p => p.id === style.backgroundImageUrl) || BACKGROUND_PRESETS[0];
  const currentFont = FONTS_LIST.find(f => f.id === style.fontFamily) || FONTS_LIST[0];

  // 1. Client Cart state
  const [cart, setCart] = useState<{ id: string; quantity: number }[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 2. Local View/Step inside client screen
  // Steps: 'MENU' | 'CART' | 'CHOOSE_MODE' | 'CONFIRM_DINE_IN' | 'FORM_DELIVERY' | 'OFFLINE_RECONNECTING' | 'DELIVERY_CONFIRMATION' | 'TRACKING'
  const [clientStep, setClientStep] = useState<'MENU' | 'CART' | 'CHOOSE_MODE' | 'CONFIRM_DINE_IN' | 'FORM_DELIVERY' | 'OFFLINE_RECONNECTING' | 'DELIVERY_CONFIRMATION' | 'TRACKING'>('MENU');

  // Currently tracked order id (for tracking screen)
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

  // Delivery form fields
  const [deliveryWhatsApp, setDeliveryWhatsApp] = useState('');
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Simulated Offline retry tracking
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  // Ref scroll list
  const categoryHeadingsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const debouncedSearchTimer = useRef<any>(null);

  // Toast feedback duration
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 1500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Debounce search with 300ms
  useEffect(() => {
    if (debouncedSearchTimer.current) clearTimeout(debouncedSearchTimer.current);
    debouncedSearchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 3000); // Wait, 300ms was requested. Let's do exactly 300ms!
    return () => clearTimeout(debouncedSearchTimer.current);
  }, [searchTerm]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Cart actions
  const addToCart = (itemId: string) => {
    const item = config.items.find(it => it.id === itemId);
    if (!item || !item.isAvailable || !config.isOpen) return;

    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: itemId, quantity: 1 }];
    });
    triggerToast(`Ajouté : ${item.name} 🛒`);
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const nextQty = i.quantity + delta;
        return nextQty > 0 ? { ...i, quantity: nextQty } : null;
      }
      return i;
    }).filter(Boolean) as any);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
    triggerToast(`Plat retiré du panier`);
  };

  // Computations
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate total price. It checks availability in real-time.
  // Warning checks: ERR_CART_ITEM_UNAVAILABLE
  const cartWithItems = cart.map(item => {
    const dish = config.items.find(it => it.id === item.id);
    return {
      ...item,
      dish,
      available: dish ? (dish.isAvailable && config.isOpen) : false
    };
  });

  const isCartValid = cartWithItems.length > 0 && cartWithItems.every(i => i.available);

  const cartTotal = cartWithItems.reduce((sum, item) => {
    if (item.dish && item.available) {
      return sum + item.dish.price * item.quantity;
    }
    return sum;
  }, 0);

  // Address lookup / smart geolocation simulation
  const handleAutoFillAddress = () => {
    setDeliveryAddress('Corniche Ouest, Face Mosquée de la Divinité, Dakar (Simulé)');
    triggerToast('📍 Adresse intelligente remplie !');
  };

  // Order submission
  const handlePlaceOrder = async (type: OrderType) => {
    if (cart.length === 0) {
      triggerToast('Erreur : Panier vide (ERR_CART_EMPTY)');
      return;
    }

    if (!isCartValid) {
      triggerToast('Erreur : Certains articles ne sont plus disponibles (ERR_CART_ITEM_UNAVAILABLE)');
      return;
    }

    // Build items payload
    const orderItems = cartWithItems.map(c => ({
      id: c.id,
      name: c.dish?.name || 'Inconnu',
      price: c.dish?.price || 0,
      quantity: c.quantity
    }));

    const orderPayload = {
      type,
      items: orderItems,
      totalPrice: cartTotal,
      customerName: type === 'DELIVERY' ? deliveryName : 'Dîneur sur Place',
      whatsappNumber: type === 'DELIVERY' ? deliveryWhatsApp : undefined,
      deliveryAddress: type === 'DELIVERY' ? deliveryAddress : undefined,
      deliveryNotes: type === 'DELIVERY' ? deliveryNotes : undefined
    };

    // Simulated Network Offline trigger! Flow 1
    if (isNetworkSimulatedOffline) {
      setPendingOrderData(orderPayload);
      setRetryAttempt(1);
      setClientStep('OFFLINE_RECONNECTING');
      return;
    }

    await submitOrderPayload(orderPayload);
  };

  // Submit actual order
  const submitOrderPayload = async (payload: any) => {
    try {
      const validated = await addOrderOnServer(payload);
      setTrackedOrderId(validated.id);
      setCart([]); // Flush cart upon success
      
      if (payload.type === 'DINE_IN') {
        // Dine-in goes straight to tracking
        setClientStep('TRACKING');
      } else {
        // Delivery goes to landing screen with WhatsApp prefilled trigger
        setClientStep('DELIVERY_CONFIRMATION');
      }
    } catch (err) {
      triggerToast('Une erreur interne est survenue');
    }
  };

  // Simulated Offline automatic retry loops
  useEffect(() => {
    if (clientStep !== 'OFFLINE_RECONNECTING' || !pendingOrderData) return;

    let delay = 2000;
    if (retryAttempt === 2) delay = 4000;
    if (retryAttempt === 3) delay = 8000;

    const timer = setTimeout(async () => {
      if (retryAttempt < 3) {
        setRetryAttempt(prev => prev + 1);
        triggerToast(`Re-tentative ${retryAttempt}/3 (backoff ${delay/1000}s)`);
      } else {
        // Success after 3rd attempt! Force reconnecting on simulation
        triggerToast("Connexion rétablie ! Commande transmise.");
        // We bypass block
        await submitOrderPayload(pendingOrderData);
        setPendingOrderData(null);
        setRetryAttempt(0);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [clientStep, retryAttempt, pendingOrderData]);

  // Form validations for Delivery Flow 2
  const validateDeliveryForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // WhatsApp required and must have reasonable size
    if (!deliveryWhatsApp.trim()) {
      errors.push('Le numéro WhatsApp est requis pour la confirmation (ERR_INVALID_WHATSAPP)');
    }
    // Address required
    if (!deliveryAddress.trim()) {
      errors.push("L'adresse de livraison est obligatoire (ERR_ADDRESS_REQUIRED)");
    }
    // Notes size limit
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

  // WhatsApp click action Flow 2
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const handleWhatsAppRedirection = () => {
    if (!trackedOrderId) return;
    const order = orders.find(o => o.id === trackedOrderId);
    if (!order) return;

    if (!isWhatsAppSimulatedInstalled) {
      triggerToast('Erreur : WhatsApp non installé (ERR_WHATSAPP_NOT_FOUND)');
      return;
    }

    // Prefill whatsapp message body
    const msg = `*COMMANDE ${order.ticketNumber}* 🛵\n` +
                `Chez *${config.name}*\n\n` +
                `*Détails :*\n` +
                order.items.map(it => `• ${it.quantity}x ${it.name} (${formatPrice(it.price * it.quantity)})`).join('\n') + `\n\n` +
                `*Total :* ${formatPrice(order.totalPrice)}\n` +
                `*Adresse :* ${order.deliveryAddress}\n` +
                `*Client :* ${order.customerName || 'Anonyme'}\n` +
                `*Notes :* ${order.deliveryNotes || 'Aucune'}\n\n` +
                `Suivi en ligne : ${typeof window !== 'undefined' ? window.location.origin : 'app'}/${config.slug}`;

    setShowWhatsAppModal(true);
  };

  // Find order currently being tracked
  const currentlyTrackedOrder = orders.find(o => o.id === trackedOrderId);

  // Scroll smooth anchor
  const scrollToAnchor = (catId: string) => {
    setActiveCategory(catId);
    const element = categoryHeadingsRef.current[catId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatPrice = (val: number) => {
    const parts = val.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${parts.join(".")} ${style.currency}`;
  };

  // Filter items in the list based on search and category tab
  const filteredDishes = config.items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                          it.description.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || it.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`h-full w-full flex flex-col relative select-none text-slate-800 ${currentFont.class} overflow-hidden`}>
      
      {/* BACKGROUND GRAPHIC INTERFACE */}
      {currentPreset.url ? (
        <div className="absolute inset-0 z-0">
          <img 
            src={currentPreset.url} 
            alt="background" 
            className="w-full h-full object-cover"
          />
          {/* Glass Overlay backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900"
            style={{ opacity: `${style.overlayOpacity}%` }}
          />
          {style.glassmorphism && (
            <div className="absolute inset-0 backdrop-blur-md bg-white/5" />
          )}
        </div>
      ) : (
        <div className={`absolute inset-0 ${currentPreset.class} z-0`} />
      )}

      {/* Dynamic inline client stylesheet to enforce the brand colors */}
      <style dangerouslySetInnerHTML={{__html: `
        .brand-accent-bg { background-color: ${style.accentColor} !important; }
        .brand-accent-text { color: ${style.accentColor} !important; }
        .brand-accent-border { border-color: ${style.accentColor} !important; }
        .brand-accent-ring:focus { outline: 2px solid ${style.accentColor} !important; }
      `}} />

      {/* FLOAT MESSAGES TOAST CHIPS */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute top-4 inset-x-4 mx-auto max-w-[260px] bg-slate-950/95 text-white py-2.5 px-4 rounded-xl text-[11px] font-semibold text-center shadow-xl border border-slate-800 flex items-center justify-center gap-2 z-50 pointer-events-none"
          >
            <span className="w-1.5 h-1.5 rounded-full brand-accent-bg animate-pulse shrink-0"></span>
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESTAURANT IS CLOSED banner */}
      {!config.isOpen && clientStep === 'MENU' && (
        <div className="bg-red-600 text-white font-bold text-center py-2 px-3 text-[10px] uppercase font-sans animate-pulse z-40 relative flex items-center justify-center gap-1.5 shrink-0">
          <AlertCircle size={12} />
          <span>Restaurant fermé — Consultation uniquement (plus boutons suspendus)</span>
        </div>
      )}

      {/* CLIENT MAIN VIEWER */}
      <div className="flex-1 overflow-y-auto relative z-10 flex flex-col">
        
        {/* STEP 1: RESTAURANT CATALOG MENU MAP */}
        {clientStep === 'MENU' && (
          <div className="flex-1 flex flex-col pb-24">
            
            {/* HERO BANNER BLOCK */}
            {config.sections.find(s => s.id === 'hero')?.enabled && (
              <div className="h-44 relative overflow-hidden flex-shrink-0">
                <img 
                  src={style.heroBannerUrl} 
                  alt="Restaurant Header" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
                
                {/* Brand card in header overlap */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-rose-600/90 inline-block mb-1.5">
                    MENU SMART MenuQR
                  </span>
                  <h1 className="text-xl font-extrabold tracking-tight truncate leading-tight">{style.heroTitle || config.name}</h1>
                  <p className="text-[10px] text-slate-300 line-clamp-2 mt-1 leading-normal font-sans font-light">
                    {style.heroDescription || 'Bienvenue dans notre établissement.'}
                  </p>
                </div>

                <div className="absolute top-4 right-4 bg-emerald-600/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  Ouvert en Cuisine
                </div>
              </div>
            )}

            {/* SEARCH BANNER BOX */}
            <div className="px-4 pt-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-slate-500" size={14} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher des tapas, grillades..."
                  className="w-full bg-slate-950/60 border border-slate-800 text-xs text-white rounded-2xl pl-9 pr-8 py-3 focus:outline-none focus:border-rose-500 transition-all font-sans"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* HORIZONTAL CATEGORIES BAR */}
            {config.sections.find(s => s.id === 'categories')?.enabled && (
              <div className="px-4 pt-3.5 pb-1 shrink-0">
                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                  <button
                    onClick={() => setActiveCategory('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activeCategory === 'ALL' 
                        ? 'brand-accent-bg text-white shadow-md' 
                        : 'bg-slate-950/50 hover:bg-slate-900/50 text-slate-300'
                    }`}
                  >
                    Tout
                  </button>
                  {config.categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => scrollToAnchor(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                        activeCategory === cat.id 
                          ? 'brand-accent-bg text-white shadow-md' 
                          : 'bg-slate-950/50 hover:bg-slate-900/50 text-slate-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CATALOGUE CARDS GRID */}
            {config.sections.find(s => s.id === 'menu')?.enabled && (
              <div className="px-4 mt-3 flex-1 space-y-6">
                
                {/* For each category, display its dishes */}
                {config.categories.map((cat) => {
                  const catDishes = filteredDishes.filter(d => d.categoryId === cat.id);
                  if (catDishes.length === 0) return null;

                  return (
                    <div 
                      key={cat.id}
                      ref={el => { categoryHeadingsRef.current[cat.id] = el; }}
                      className="space-y-3"
                    >
                      {/* Section Title */}
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1 flex items-center gap-2">
                        <span>{cat.name}</span>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-1.5 py-0.2 rounded">
                          {catDishes.length}
                        </span>
                      </h3>

                      {/* Dishes in this category */}
                      <div className="space-y-3">
                        {catDishes.map((item) => (
                          <div 
                            key={item.id}
                            className={`bg-slate-950/40 border border-slate-900/60 rounded-2xl overflow-hidden shadow-sm flex relative ${
                              style.density === 'compact' ? 'p-2.5 gap-2.5' : 'p-3.5 gap-3.5'
                            } ${!item.isAvailable || !config.isOpen ? 'opacity-60' : ''}`}
                          >
                            {/* Dish image thumbnail */}
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className={`object-cover rounded-xl border border-slate-900/50 shrink-0 ${
                                style.density === 'compact' ? 'w-14 h-14' : 'w-20 h-20'
                              }`}
                            />

                            {/* Details text */}
                            <div className="flex-1 min-w-0 pr-6 flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-slate-100 truncate">{item.name}</h4>
                                <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-normal font-sans">
                                  {item.description}
                                </p>
                              </div>
                              
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-xs font-bold font-mono text-slate-200">{formatPrice(item.price)}</span>
                              </div>
                            </div>

                            {/* Floating add button */}
                            <button
                              onClick={() => addToCart(item.id)}
                              disabled={!item.isAvailable || !config.isOpen}
                              className={`absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all ${
                                item.isAvailable && config.isOpen
                                  ? 'brand-accent-bg hover:opacity-90' 
                                  : 'bg-slate-800 text-slate-600'
                              }`}
                            >
                              <Plus size={14} />
                            </button>

                            {/* Sold outs indicator */}
                            {!item.isAvailable && (
                              <div className="absolute top-2 right-2 bg-red-650/90 text-white font-bold text-[8px] px-1.5 py-0.2 rounded border border-red-500/10">
                                ÉPUISÉ
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* If nothing matches search query */}
                {filteredDishes.length === 0 && (
                  <div className="py-16 text-center text-slate-500 bg-slate-950/20 rounded-2xl border border-dashed border-slate-900">
                    {"Aucun plat trouvé sous \"" + searchTerm + "\""}
                  </div>
                )}
              </div>
            )}

            {/* INFOS RESTO SECTION */}
            {config.sections.find(s => s.id === 'infos')?.enabled && (
              <div className="px-4 mt-8 shrink-0">
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-900/60 text-xs text-slate-300 space-y-3">
                  <h4 className="font-bold text-slate-100 flex items-center gap-1 pb-1.5 border-b border-slate-900">
                    <Store size={14} className="brand-accent-text" />
                    {"Infos & Horaires d'Assistance"}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-rose-500" />
                    <span>Ouvert 7j/7 de 12H00 à 23H00</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-rose-500 mt-0.5" />
                    <span className="leading-normal">{config.address}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CART / BASKET SUMMARY */}
        {clientStep === 'CART' && (
          <div className="flex-1 p-4 flex flex-col font-sans max-w-md mx-auto w-full relative z-10 select-none pb-20">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-900">
              <button 
                onClick={() => setClientStep('MENU')}
                className="p-1.5 hover:bg-slate-900/60 text-slate-400 rounded-lg cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-extrabold text-slate-200">Détail de mon Panier</h2>
            </div>

            {/* List items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cartWithItems.map((c) => {
                const item = c.dish;
                if (!item) return null;
                return (
                  <div 
                    key={c.id} 
                    className={`p-3.5 bg-slate-950/40 border border-slate-900 rounded-2xl flex justify-between items-center gap-3 ${
                      !c.available ? 'border-red-500/20 shadow-red-500/5' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatPrice(item.price)} la part</p>
                      
                      {/* Warning alerts item not available - UC-005 */}
                      {!c.available && (
                        <div className="mt-1 text-[9px] text-red-500 font-bold flex items-center gap-1.5 leading-none">
                          <AlertCircle size={10} />
                          <span>Ce plat est temporairement indisponible !</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Quantities panel */}
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                        <button 
                          onClick={() => updateCartQty(c.id, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-bold font-mono px-2 text-slate-200">{c.quantity}</span>
                        <button 
                          onClick={() => updateCartQty(c.id, 1)}
                          disabled={!c.available}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white cursor-pointer disabled:opacity-20"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(c.id)}
                        className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {cartWithItems.length === 0 && (
                <div className="py-24 text-center text-slate-500">
                  Votre panier est vide. Visitez le menu pour ajouter des plats succulents !
                </div>
              )}
            </div>

            {/* Receipt Summary block */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-900 space-y-4">
                <div className="bg-slate-950/60 p-4 border border-slate-900 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-sans">
                    <span>Quantité totale :</span>
                    <span className="font-mono font-semibold text-slate-200">{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-t border-slate-900/60 font-sans font-bold">
                    <span className="text-slate-100">Total :</span>
                    <span className="font-mono brand-accent-text text-base">{formatPrice(cartTotal)}</span>
                  </div>

                  {!isCartValid && (
                    <div className="p-2.5 bg-red-650/15 border border-red-500/15 text-[10px] text-red-500 font-semibold rounded-lg flex items-start gap-1.5">
                      <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                      <span>Certains articles dans votre panier ne sont plus disponibles. Veuillez les retirer pour continuer.</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setClientStep('CHOOSE_MODE')}
                  disabled={!isCartValid || cart.length === 0}
                  className="w-full py-3.5 rounded-xl brand-accent-bg text-white text-xs font-bold shadow-lg shadow-rose-950/20 hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Passer la commande
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SELECT ORDER LOCATION TYPE - CHOOSE_MODE */}
        {clientStep === 'CHOOSE_MODE' && (
          <div className="flex-1 p-5 flex flex-col font-sans max-w-sm mx-auto w-full justify-center relative z-10 select-none pb-20 space-y-6">
            <h3 className="text-base font-extrabold text-white text-center">Choisissez votre mode de service</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Option Sur place */}
              <button
                onClick={() => setClientStep('CONFIRM_DINE_IN')}
                className="p-5 rounded-2xl bg-slate-950/60 hover:bg-slate-950/80 transition-all border border-slate-900 text-left cursor-pointer flex items-center gap-4 group hover:border-rose-500/30"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-rose-500/10 group-hover:text-rose-400 shrink-0">
                  <Store size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-rose-400 transition-colors">Sur Place (A table)</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-light">
                    Générez un ticket prioritaire cuisine et récupérez au comptoir après préparation.
                  </p>
                </div>
              </button>

              {/* Option Livraison */}
              <button
                onClick={() => setClientStep('FORM_DELIVERY')}
                className="p-5 rounded-2xl bg-slate-950/60 hover:bg-slate-950/80 transition-all border border-slate-900 text-left cursor-pointer flex items-center gap-4 group hover:border-rose-500/30"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-rose-500/10 group-hover:text-rose-400 shrink-0">
                  <Compass size={22} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-rose-400 transition-colors">Livraison à domicile</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-light">
                    Faites-vous livrer par nos coursiers. Suivi direct et confirmation par message WhatsApp.
                  </p>
                </div>
              </button>
            </div>

            <button 
              onClick={() => setClientStep('CART')}
              className="py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 text-center cursor-pointer"
            >
              Retour au panier
            </button>
          </div>
        )}

        {/* STEP 4: CONFIRMATION DINE IN SCREEN */}
        {clientStep === 'CONFIRM_DINE_IN' && (
          <div className="flex-1 p-5 flex flex-col font-sans max-w-sm mx-auto w-full justify-center relative z-10 select-none pb-20 space-y-5">
            <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-900 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-100 text-center border-b border-slate-900 pb-2">Résumé Sur Place</h3>
              
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Type de service :</span>
                  <span className="font-bold text-purple-400">SUR PLACE</span>
                </div>
                <div className="flex justify-between">
                  <span>Articles :</span>
                  <span className="font-mono text-slate-200">{totalQuantity}</span>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-2 font-bold text-sm">
                  <span className="text-slate-200">Total à Valider :</span>
                  <span className="font-mono brand-accent-text">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlaceOrder('DINE_IN')}
              className="w-full py-3.5 rounded-xl brand-accent-bg text-white text-xs font-bold shadow-lg shadow-rose-950/10 hover:opacity-90 cursor-pointer text-center"
            >
              Valider ma commande sur place
            </button>
            <button
              onClick={() => setClientStep('CHOOSE_MODE')}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 text-center cursor-pointer"
            >
              Choisir un autre mode
            </button>
          </div>
        )}

        {/* STEP 5: FORM DELIVERY CLIENT SHEET */}
        {clientStep === 'FORM_DELIVERY' && (
          <form 
            onSubmit={validateDeliveryForm}
            className="flex-1 p-4 flex flex-col font-sans max-w-md mx-auto w-full relative z-10 select-none pb-20"
          >
            <div className="flex items-center gap-2 pb-4 border-b border-slate-900 mb-4">
              <button 
                type="button"
                onClick={() => setClientStep('CHOOSE_MODE')}
                className="p-1.5 hover:bg-slate-900/60 text-slate-400 rounded-lg cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-extrabold text-slate-200">Saisie des informations</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* WhatsApp Field (Required) */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>WhatsApp N° (Obligatoire)</span>
                  <span className="text-[10px] text-rose-500 italic">* requis</span>
                </label>
                <input 
                  type="tel"
                  required
                  placeholder="+221 77 123 45 67"
                  value={deliveryWhatsApp}
                  onChange={(e) => setDeliveryWhatsApp(e.target.value)}
                  className="w-full bg-slate-950/65 border border-slate-800 text-xs text-slate-200 rounded-xl px-4 py-3 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium"
                />
              </div>

              {/* Customer Name (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Votre Nom (Optionnel)</label>
                <input 
                  type="text"
                  placeholder="Ex. Mamadou Sow"
                  value={deliveryName}
                  onChange={(e) => setDeliveryName(e.target.value)}
                  className="w-full bg-slate-950/65 border border-slate-800 text-xs text-slate-200 rounded-xl px-4 py-3 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium"
                />
              </div>

              {/* Delivery Address (Required) */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Adresse Complète</span>
                  <button 
                    type="button" 
                    onClick={handleAutoFillAddress}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer lowercase flex items-center gap-0.5"
                  >
                    📍 auto-remplir
                  </button>
                </label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Rue, Immeuble, Étage, Repères à Dakar..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-950/65 border border-slate-800 text-xs text-slate-200 rounded-xl px-4 py-3 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium"
                />
              </div>

              {/* Delivery Notes (Optional, max 300) */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Instructions partculières</span>
                  <span className="text-[9px] text-slate-600 font-mono">{deliveryNotes.length}/300</span>
                </label>
                <textarea 
                  rows={2}
                  maxLength={300}
                  placeholder="Ex. Piment à part, appeler l'interphone..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full bg-slate-950/65 border border-slate-800 text-xs text-slate-200 rounded-xl px-4 py-3 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium animate-none"
                />
              </div>
            </div>

            {/* validation blocks errors report banner */}
            {validationErrors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/10 p-3 rounded-xl space-y-1 font-sans text-[10px] text-red-500 mb-3">
                {validationErrors.map((err, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <AlertCircle size={9} />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Summation Total footer action */}
            <div className="pt-4 border-t border-slate-900 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                <span>Total de votre dîner :</span>
                <span className="font-mono brand-accent-text font-bold text-sm">{formatPrice(cartTotal)}</span>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl brand-accent-bg text-white text-xs font-bold shadow-lg shadow-rose-950/15 cursor-pointer text-center"
              >
                Soumettre ma demande de livraison
              </button>
            </div>
          </form>
        )}

        {/* STEP 6: OFFLINE TIMER LOOPS SCREEN */}
        {clientStep === 'OFFLINE_RECONNECTING' && (
          <div className="flex-1 p-5 flex flex-col font-sans max-w-sm mx-auto w-full justify-center relative z-10 select-none pb-20 space-y-5 text-center text-slate-300">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-500 animate-pulse flex items-center justify-center mx-auto mb-2">
              <WifiOff size={30} />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-amber-500">Commande hors-ligne enregistrée !</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Réseau momentanément indisponible (Simulé). Nous activons le processus de reconnexion automatique en tâche de fond.
              </p>
            </div>

            {/* Progress indicators */}
            <div className="bg-slate-950/70 p-4 border border-slate-900 rounded-2xl font-mono text-[11px] space-y-2 text-left">
              <div className="flex justify-between">
                <span>Statut :</span>
                <span className="text-amber-400 font-bold animate-pulse">Reconnect-backoff actif...</span>
              </div>
              <div className="flex justify-between">
                <span>Re-tentative :</span>
                <span>{retryAttempt}/3</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Attente :</span>
                <span className="text-[10px] text-slate-500 font-sans italic">Delays 2s → 4s → 8s</span>
              </div>

              {/* Progress visual bar */}
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(retryAttempt / 3) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-y-0 left-0 brand-accent-bg"
                />
              </div>
            </div>

            <p className="text-[9px] text-slate-500 italic mt-4 leading-normal">
              Ne fermez pas cette page. Une fois la tentative accomplie, la commande se validera et se synchronisera avec la cuisine !
            </p>
          </div>
        )}

        {/* STEP 7: DELIVERY CONFIRMATION & WHATSAPP REDIRECTION SHEET */}
        {clientStep === 'DELIVERY_CONFIRMATION' && (
          <div className="flex-1 p-5 flex flex-col font-sans max-w-sm mx-auto w-full justify-center relative z-10 select-none pb-20 space-y-5 text-center text-slate-300">
            
            {/* Modal WhatsApp API mockup */}
            <AnimatePresence>
              {showWhatsAppModal && currentlyTrackedOrder && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-xs">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#0b141a] text-slate-100 rounded-3xl border border-[#202c33] p-5 w-full max-w-sm relative shadow-2xl"
                  >
                    <button 
                      onClick={() => setShowWhatsAppModal(false)}
                      className="absolute right-4 top-4 text-slate-500 hover:text-slate-200 cursor-pointer"
                    >
                      <X size={16} />
                    </button>

                    {/* Chat headers mockup */}
                    <div className="flex items-center gap-2 pb-3 border-b border-[#202c33] mb-4">
                      <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white text-xs font-bold">
                        W
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-slate-100">WhatsApp API (Simulé)</h4>
                        <span className="text-[10px] text-[#00a884]">En voi de messagerie direct</span>
                      </div>
                    </div>

                    {/* Dialog message mockup text */}
                    <div className="bg-[#202c33] rounded-2xl p-4 text-left font-mono text-[10px] leading-relaxed text-[#e9edef] whitespace-pre-line border border-[#2f3b43]">
                      {`*COMMANDE ${currentlyTrackedOrder.ticketNumber}* 🛵\n` +
                       `Chez *${config.name}*\n\n` +
                       `*Détails :*\n` +
                       currentlyTrackedOrder.items.map(it => `• ${it.quantity}x ${it.name} (${formatPrice(it.price * it.quantity)})`).join('\n') + `\n\n` +
                       `*Total :* ${formatPrice(currentlyTrackedOrder.totalPrice)}\n` +
                       `*Adresse :* ${currentlyTrackedOrder.deliveryAddress}\n` +
                       `*Notes :* ${currentlyTrackedOrder.deliveryNotes || 'Aucune'}`}
                    </div>

                    <div className="bg-[#111b21] p-3 rounded-lg border border-[#202c33] mt-3 text-left">
                      <p className="text-[9px] text-slate-400 leading-normal">
                        {"La simulation a réussi ! En conditions de production réelles, cette action ouvre l'application WhatsApp du terminal pour transmettre le résumé en un seul clic, même sans ordinateur pour la caisse."}
                      </p>
                    </div>

                    {/* CTAs */}
                    <div className="mt-4 flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`COMMANDE ${currentlyTrackedOrder.ticketNumber} chez ${config.name}`);
                          triggerToast('Copié dans le presse-papiers !');
                        }}
                        className="flex-1 py-2 text-xs font-bold bg-[#202c33] hover:bg-[#2f3b43] text-slate-200 rounded-xl transition-all cursor-pointer"
                      >
                        Copier texte
                      </button>

                      <button
                        onClick={() => {
                          setShowWhatsAppModal(false);
                          setClientStep('TRACKING');
                        }}
                        className="flex-1 py-2 text-xs font-bold bg-[#00a884] hover:bg-[#00c298] text-[#0b141a] rounded-xl transition-all cursor-pointer"
                      >
                        Fermer & Continuer
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Check size={30} />
            </div>

            {currentlyTrackedOrder && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-100">Commande {currentlyTrackedOrder.ticketNumber} Enregistrée !</h3>
                  <p className="text-xs text-slate-400 italic">Prestation de livraison à domicile lancée</p>
                </div>

                <div className="bg-slate-950/70 p-4 border border-slate-900 rounded-2xl text-left font-sans text-xs space-y-1.5 leading-normal">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Résumé de la livraison</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Destinataire :</span>
                    <span className="font-semibold text-slate-100">{currentlyTrackedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Téléphone :</span>
                    <span className="font-mono font-semibold text-slate-200">{currentlyTrackedOrder.whatsappNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Adresse :</span>
                    <span className="font-semibold text-slate-100 truncate max-w-[150px]">{currentlyTrackedOrder.deliveryAddress}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900/60 pt-2 text-slate-300 font-bold">
                    <span>Somme :</span>
                    <span className="font-mono text-rose-400">{formatPrice(currentlyTrackedOrder.totalPrice)}</span>
                  </div>
                </div>

                {/* Primary & Secondary actions */}
                <div className="space-y-2 font-sans pt-2">
                  <button
                    onClick={() => setClientStep('TRACKING')}
                    className="w-full py-3 rounded-xl brand-accent-bg hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-950/15 cursor-pointer text-center"
                  >
                    Voir le suivi en temps réel →
                  </button>
                  
                  <button
                    onClick={handleWhatsAppRedirection}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-[#00a884] font-bold text-xs border border-[#00a884]/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <MessageSquare size={13} />
                    Envoyer les détails par WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 8: CLIENT REAL-TIME ORDER CYCLE TRACKING TICKET */}
        {clientStep === 'TRACKING' && (
          <div className="flex-1 p-4 flex flex-col font-sans max-w-sm mx-auto w-full relative z-10 select-none pb-20 justify-center">
            
            {currentlyTrackedOrder ? (
              <div className="space-y-6">
                
                {/* Header card info */}
                <div className="bg-slate-950/60 rounded-3xl p-5 border border-slate-900/80 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/5 to-transparent rounded-full pointer-events-none"></div>
                  
                  <div className="text-center font-sans space-y-1 pb-4 border-b border-slate-900/60">
                    <span className="text-[10px] font-bold tracking-wider text-rose-500 uppercase">SUIVI TICKET EN LIGNE</span>
                    <h3 className="text-3xl font-black text-white font-mono mt-1">{currentlyTrackedOrder.ticketNumber}</h3>
                    <p className="text-[10px] text-slate-500">Service : {currentlyTrackedOrder.type === 'DINE_IN' ? 'SUR PLACE (A TABLE)' : 'LIVRAISON À DOMICILE'}</p>
                    <p className="text-[9px] text-slate-500 font-mono">Date : {new Date(currentlyTrackedOrder.createdAt).toLocaleTimeString('fr-FR')}</p>
                  </div>

                  {/* ACTIVE TRACKING STATE LISTING - REAL-TIME CYCLES */}
                  <div className="space-y-4 pt-1">
                    
                    {/* Stepper item 1: PENDING */}
                    <div className="flex gap-3 relative">
                      <div className="absolute left-2.5 top-5 bottom-1.5 w-0.5 bg-slate-800"></div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 font-bold text-[9px] ${
                        currentlyTrackedOrder.status === 'PENDING' 
                          ? 'brand-accent-bg text-white shadow-md animate-pulse ring-4 ring-rose-500/15'
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {currentlyTrackedOrder.status === 'PENDING' ? '⏳' : '✓'}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className={`text-xs font-bold ${currentlyTrackedOrder.status === 'PENDING' ? 'brand-accent-text' : 'text-slate-300'}`}>
                          Commande Enregistrée
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          Reçue par le restaurant, en attente de validation en cuisine.
                        </p>
                      </div>
                    </div>

                    {/* Stepper item 2: PREPARING */}
                    <div className="flex gap-3 relative">
                      <div className="absolute left-2.5 top-5 bottom-1.5 w-0.5 bg-slate-800"></div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 font-bold text-[9px] ${
                        currentlyTrackedOrder.status === 'PREPARING' 
                          ? 'bg-blue-600 text-white shadow-md animate-pulse ring-4 ring-blue-500/15' : 
                        ['READY', 'COMPLETED'].includes(currentlyTrackedOrder.status) 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-900 text-slate-700'
                      }`}>
                        {currentlyTrackedOrder.status === 'PREPARING' ? '👨‍🍳' : 
                         ['READY', 'COMPLETED'].includes(currentlyTrackedOrder.status) ? '✓' : '2'}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className={`text-xs font-bold ${
                          currentlyTrackedOrder.status === 'PREPARING' ? 'text-blue-400' : 
                          ['READY', 'COMPLETED'].includes(currentlyTrackedOrder.status) ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          En Préparation
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          La brigade cuisine dresse vos plats avec ferveur.
                        </p>
                      </div>
                    </div>

                    {/* Stepper item 3: READY */}
                    <div className="flex gap-3 relative">
                      <div className="absolute left-2.5 top-5 bottom-1.5 w-0.5 bg-slate-800"></div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 font-bold text-[9px] ${
                        currentlyTrackedOrder.status === 'READY' 
                          ? 'bg-emerald-600 text-white shadow-md animate-pulse ring-4 ring-emerald-500/15' : 
                        ['COMPLETED'].includes(currentlyTrackedOrder.status) 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-900 text-slate-700'
                      }`}>
                        {currentlyTrackedOrder.status === 'READY' ? '🛵' : 
                         ['COMPLETED'].includes(currentlyTrackedOrder.status) ? '✓' : '3'}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className={`text-xs font-bold ${
                          currentlyTrackedOrder.status === 'READY' ? 'text-emerald-400' : 
                          ['COMPLETED'].includes(currentlyTrackedOrder.status) ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {currentlyTrackedOrder.type === 'DINE_IN' ? 'Prête au comptoir !' : 'En Livraison !'}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          {currentlyTrackedOrder.type === 'DINE_IN' 
                            ? 'Présentez ce reçu au caissier pour récupérer votre sac.'
                            : 'Le coursier a emballé vos plats chauds. En route !'}
                        </p>
                      </div>
                    </div>

                    {/* Stepper item 4: COMPLETED */}
                    <div className="flex gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 font-bold text-[10px] ${
                        currentlyTrackedOrder.status === 'COMPLETED' 
                          ? 'bg-rose-500 text-white shadow-sm ring-4 ring-rose-500/10' 
                          : 'bg-slate-900 text-slate-700'
                      }`}>
                        {currentlyTrackedOrder.status === 'COMPLETED' ? '🎉' : '4'}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className={`text-xs font-bold ${currentlyTrackedOrder.status === 'COMPLETED' ? 'text-rose-400 font-extrabold' : 'text-slate-600'}`}>
                          Dégustation Terminée
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          Bon appétit et à bientôt chez {config.name} !
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* CANCELLED STATE OVERLAP HANDLER */}
                  {currentlyTrackedOrder.status === 'CANCELLED' && (
                    <div className="mt-4 p-4 bg-red-950/40 border border-red-500/15 rounded-2xl space-y-3 font-sans text-left">
                      <div className="flex items-center gap-1.5 text-xs text-red-500 font-extrabold">
                        <AlertCircle size={14} />
                        <span>COMMANDE ANNULÉE</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Cette commande a été annulée par le restaurant. Pour toute inquiry, veuillez contacter les équipes via WhatsApp.
                      </p>
                      <a
                        href={`https://wa.me/${config.phone}`}
                        target="_blank"
                        className="w-full py-2 bg-red-600 hover:bg-red-500 font-bold text-[10px] text-white rounded-xl flex items-center justify-center gap-1.5 shadow"
                      >
                        <MessageSquare size={12} /> Contactez Nous via WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setClientStep('MENU');
                    setTrackedOrderId(null);
                  }}
                  className="w-full py-3 bg-slate-900 border border-slate-800 hover:text-white rounded-xl text-xs font-semibold text-slate-400 cursor-pointer text-center"
                >
                  Retourner au menu principal
                </button>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 max-w-xs mx-auto space-y-4">
                <AlertCircle className="mx-auto text-rose-500 animate-pulse" size={28} />
                <h3 className="text-xs font-bold text-slate-300">Aucune commande active suivie</h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  {"Faites votre choix sur place ou en livraison, puis validez le bon de commande pour en vérifier l'écoulement en cuisine !"}
                </p>
                <button
                  onClick={() => setClientStep('MENU')}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-xs font-semibold text-slate-300 rounded-xl border border-slate-900"
                >
                  Ouvrir la carte
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* FLOAT NAVIGATION BAR FOOTER (Only shown on MENU / CART pages) */}
      {(clientStep === 'MENU' || clientStep === 'CART') && (
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-900/80 p-4 z-40">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            
            {/* Left side: Switch views */}
            <div className="flex gap-2">
              <button 
                onClick={() => setClientStep('MENU')}
                className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
                  clientStep === 'MENU' ? 'text-rose-400 bg-slate-900' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Compass size={16} />
                <span className="text-[9px] font-bold">Le Menu</span>
              </button>

              <button 
                onClick={() => setClientStep('CART')}
                className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all relative cursor-pointer ${
                  clientStep === 'CART' ? 'text-rose-400 bg-slate-900' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <ShoppingBag size={16} />
                <span className="text-[9px] font-bold font-sans">Panier</span>
                {totalQuantity > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full brand-accent-bg text-white text-[9px] font-black font-mono flex items-center justify-center animate-bounce shadow">
                    {totalQuantity}
                  </span>
                )}
              </button>
            </div>

            {/* Right side: Floating button with active total totals */}
            {totalQuantity > 0 && clientStep === 'MENU' && (
              <button
                onClick={() => setClientStep('CART')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl brand-accent-bg text-white text-xs font-bold shadow-md hover:shadow-lg transition-transform cursor-pointer active:scale-95"
              >
                <span>Commander ({totalQuantity})</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono font-black text-[11px] leading-none">
                  {formatPrice(cartTotal)}
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
  heroTitle: 'Cuisine d\'Exception & Ambiance Feutrée',
  heroDescription: 'Séparez vos plats favoris et commandez sur place en < 2 min.',
  density: 'confortable' as const,
  backgroundImageUrl: 'slate',
  overlayOpacity: 10,
  glassmorphism: true,
  showCategoryIcons: true,
  currency: 'FCFA'
};
