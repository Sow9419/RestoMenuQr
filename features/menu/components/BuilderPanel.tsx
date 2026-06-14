'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { updatePageSettings } from '@/features/menu/actions/settingsActions';
import { createCategory, updateCategory, deleteCategory } from '@/features/menu/actions/categoryActions';
import { createProduct, updateProduct, deleteProduct } from '@/features/menu/actions/productActions';
import { MenuCategory, MenuItem } from '@/lib/restoTypes';
import {
  Layers,
  Paintbrush,
  ShoppingBasket,
  Trash2,
  Edit3,
  Plus,
  ArrowUp,
  ArrowDown,
  Check,
  Sparkles,
  Coins,
  Image as ImageIcon,
  CheckCircle,
  X,
  FilePlus,
  Compass,
  AlertCircle,
  QrCode,
  Share2,
  ExternalLink
} from 'lucide-react';
import { BACKGROUND_PRESETS, FONTS_LIST } from '@/lib/defaultData';
import { motion, AnimatePresence } from 'motion/react';

type SubTabId = 'SECTIONS' | 'STYLE' | 'CONTENT' | 'PARTAGE';

interface CategoryModalState {
  mode: 'add' | 'edit';
  cat?: MenuCategory;
}

interface DishModalState {
  mode: 'add' | 'edit';
  item?: MenuItem;
}

export default function BuilderPanel() {
  const { config, updateStyle, updateSections, updateCategories, updateItems } = useMenuStore();

  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('SECTIONS');

  const [showCatModal, setShowCatModal] = useState<CategoryModalState | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Coffee');

  const [showDishModal, setShowDishModal] = useState<DishModalState | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishCategoryId, setDishCategoryId] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishPrice, setDishPrice] = useState<number>(0);
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [isDishAvailable, setIsDishAvailable] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  if (!config) return <div className="p-12 text-center text-stone-400">Chargement du Builder...</div>;

  const handleStyleChange = (field: string, value: string | number | boolean) => {
    updateStyle({ [field]: value });
  };

  const onSaveStyle = async () => {
    if (!config?.id) return;
    setIsSaving(true);
    await updatePageSettings(config.id, {
      settings: {
        templateLayout: config.style.templateLayout,
        accentColor: config.style.accentColor,
        fontFamily: config.style.fontFamily,
        heroTitle: config.style.heroTitle,
        heroDescription: config.style.heroDescription,
        heroBannerUrl: config.style.heroBannerUrl,
        displayMode: config.style.displayMode as any,
        overlayOpacity: config.style.overlayOpacity,
        glassmorphism: config.style.glassmorphism,
        density: config.style.density as any,
        currency: config.style.currency,
      },
      sections: config.sections.map(s => ({
        name: (s as any).section_key || s.name,
        label: s.label,
        enabled: s.enabled
      }))
    });
    setIsSaving(false);
  };

  const openCatModal = (mode: 'add' | 'edit', cat?: MenuCategory) => {
    setCatName(cat?.name || '');
    setCatIcon(cat?.icon || 'Coffee');
    setShowCatModal({ mode, cat });
  };

  const handleCatSubmit = async () => {
    if (!config?.id) return;
    setIsSaving(true);
    if (showCatModal?.mode === 'add') {
      const res = await createCategory(config.id, catName);
      if (res.success && res.data) {
        updateCategories([...config.categories, res.data as MenuCategory]);
      }
    } else if (showCatModal?.mode === 'edit' && showCatModal.cat) {
      const res = await updateCategory(config.id, showCatModal.cat.id, catName);
      if (res.success) {
        updateCategories(config.categories.map(c => c.id === showCatModal.cat?.id ? { ...c, name: catName, icon: catIcon } : c));
      }
    }
    setShowCatModal(null);
    setIsSaving(false);
  };

  const openDishModal = (mode: 'add' | 'edit', item?: MenuItem) => {
    setDishName(item?.name || '');
    setDishCategoryId(item?.categoryId || config?.categories[0]?.id || '');
    setDishDescription(item?.description || '');
    setDishPrice(item?.price || 0);
    setDishImageUrl(item?.imageUrl || '');
    setIsDishAvailable(item?.isAvailable ?? true);
    setShowDishModal({ mode, item });
  };

  const handleDishSubmit = async () => {
    if (!config?.id) return;
    setIsSaving(true);
    const payload = {
      categoryId: dishCategoryId,
      name: dishName,
      description: dishDescription,
      price: dishPrice,
      imageUrl: dishImageUrl,
      isAvailable: isDishAvailable
    };

    if (showDishModal?.mode === 'add') {
      const res = await createProduct(config.id, payload);
      if (res.success && res.data) {
        updateItems([...config.items, res.data as MenuItem]);
      }
    } else if (showDishModal?.mode === 'edit' && showDishModal.item) {
      const res = await updateProduct(config.id, showDishModal.item.id, payload);
      if (res.success && res.data) {
        const updatedItem = res.data as MenuItem;
        updateItems(config.items.map(i => i.id === updatedItem.id ? updatedItem : i));
      }
    }
    setShowDishModal(null);
    setIsSaving(false);
  };

  const toggleSection = (id: string) => {
    updateSections(config.sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const isLight = config.style.displayMode === 'light';

  const subTabs: { id: SubTabId; label: string; icon: any }[] = [
    { id: 'SECTIONS', label: 'Structure', icon: Layers },
    { id: 'STYLE', label: 'Apparence', icon: Paintbrush },
    { id: 'CONTENT', label: 'Catalogue', icon: ShoppingBasket },
    { id: 'PARTAGE', label: 'Partage', icon: QrCode },
  ];

  const sampleDishesImages = [
    'https://picsum.photos/id/292/400/400',
    'https://picsum.photos/id/429/400/400',
    'https://picsum.photos/id/493/400/400',
    'https://picsum.photos/id/635/400/400'
  ];

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-[#E7E5E4] px-4 gap-2 bg-[#FAFAF9] sticky top-0 z-20">
        {subTabs.map(subTab => (
          <button
            key={subTab.id}
            onClick={() => setActiveSubTab(subTab.id)}
            aria-label={`Onglet ${subTab.label}`}
            className={`flex items-center gap-2 px-5 py-4 text-xs font-bold uppercase tracking-widest transition-all relative cursor-pointer ${
              activeSubTab === subTab.id
                ? 'text-primary'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <subTab.icon className={`w-4 h-4 ${activeSubTab === subTab.id ? 'text-primary' : 'text-stone-300'}`} />
            {subTab.label}
            {activeSubTab === subTab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
        {/* SECTIONS CONTENT */}
        {activeSubTab === 'SECTIONS' && (
          <div className="space-y-6">
            <header>
              <h2 className="text-xl font-bold tracking-tight mb-1">Architecture du Menu</h2>
              <p className="text-sm text-stone-500">Activez et ordonnez les blocs visibles par vos clients.</p>
            </header>

            <div className="space-y-3">
              {config.sections.map((section, idx) => (
                <div key={section.id} className="group bg-white border border-[#E7E5E4] p-4 rounded-2xl flex items-center justify-between hover:border-primary/20 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#F5F5F4] rounded-xl flex items-center justify-center text-stone-400 group-hover:text-primary transition-colors">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{section.label}</h4>
                      <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Position #{idx + 1}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSection(section.id)}
                    aria-label={`Basculer la section ${section.label}`}
                    className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 cursor-pointer ${
                      section.enabled ? 'bg-primary' : 'bg-stone-200'
                    }`}
                  >
                    <motion.div
                      animate={{ x: section.enabled ? 24 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-900 leading-relaxed">
                <strong>Conseil :</strong> Gardez le Hero et les Catégories activés pour une meilleure conversion sur mobile.
              </p>
            </div>
          </div>
        )}

        {/* STYLE CONTENT */}
        {activeSubTab === 'STYLE' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold tracking-tight mb-1">Identité Visuelle</h2>
                <p className="text-sm text-stone-500">Personnalisez l&apos;ambiance de votre établissement.</p>
              </div>
              <button
                onClick={onSaveStyle}
                disabled={isSaving}
                className="h-11 px-6 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Enregistrement...' : 'Publier'}
              </button>
            </header>

            {/* Layout Grid */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Mise en page</label>
              <div className="grid grid-cols-3 gap-3">
                {['classic', 'card-grid', 'premium'].map(l => (
                  <button
                    key={l}
                    onClick={() => handleStyleChange('templateLayout', l)}
                    aria-label={`Disposition ${l}`}
                    className={`p-4 rounded-2xl border transition-all text-center cursor-pointer ${
                      config.style.templateLayout === l
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-[#E7E5E4] hover:border-stone-300 text-stone-500'
                    }`}
                  >
                    <div className="w-8 h-8 mx-auto mb-2 opacity-50"><Layers className="w-full h-full" /></div>
                    <span className="text-[10px] font-bold uppercase">{l}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color & Theme */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Couleur d&apos;accent</label>
                <div className="flex gap-3">
                  {['#C2410C', '#0891B2', '#4F46E5', '#059669', '#E11D48'].map(c => (
                    <button
                      key={c}
                      onClick={() => handleStyleChange('accentColor', c)}
                      aria-label={`Couleur ${c}`}
                      className={`w-10 h-10 rounded-xl transition-transform hover:scale-110 cursor-pointer ${
                        config.style.accentColor === c ? 'ring-4 ring-offset-2 ring-primary/20 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Mode d&apos;affichage</label>
                <div className="flex bg-[#F5F5F4] p-1 rounded-xl">
                  <button
                    onClick={() => handleStyleChange('displayMode', 'light')}
                    className={`flex-1 h-11 rounded-lg text-xs font-bold transition cursor-pointer ${config.style.displayMode === 'light' ? 'bg-white shadow-sm' : 'text-stone-400'}`}
                  >
                    Clair
                  </button>
                  <button
                    onClick={() => handleStyleChange('displayMode', 'dark')}
                    className={`flex-1 h-11 rounded-lg text-xs font-bold transition cursor-pointer ${config.style.displayMode === 'dark' ? 'bg-zinc-900 text-white shadow-sm' : 'text-stone-400'}`}
                  >
                    Sombre
                  </button>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Typographie</label>
              <select
                value={config.style.fontFamily}
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                className="w-full h-12 px-4 bg-white border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {FONTS_LIST.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {/* Hero Banner */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Bannière principale</label>
              <div className="relative h-40 rounded-3xl overflow-hidden group border border-[#E7E5E4]">
                <Image
                  src={config.style.heroBannerUrl || 'https://picsum.photos/id/1081/1920/1080?blur=10'}
                  alt="Banner"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="h-11 px-5 bg-white text-black rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
                    <ImageIcon className="w-4 h-4" /> Changer l&apos;image
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={config.style.heroTitle}
                onChange={(e) => handleStyleChange('heroTitle', e.target.value)}
                placeholder="Titre d'accueil..."
                className="w-full h-12 px-4 bg-white border border-[#E7E5E4] rounded-xl text-sm font-bold"
              />
            </div>
          </div>
        )}

        {/* CONTENT (Catalogue) */}
        {activeSubTab === 'CONTENT' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">

            {/* Categories */}
            <div className="space-y-4">
              <header className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Catégories</h3>
                <button
                  onClick={() => openCatModal('add')}
                  className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-md hover:bg-primary-hover transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </header>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {config.categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => openCatModal('edit', cat)}
                    className="whitespace-nowrap px-4 h-11 bg-white border border-[#E7E5E4] rounded-xl text-xs font-bold flex items-center gap-2 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <span className="text-stone-300">#</span> {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products / Items List */}
            <div className="space-y-4">
              <header className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Plats & Boissons</h3>
                <button
                  onClick={() => openDishModal('add')}
                  className="h-11 px-5 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-stone-800 transition shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Ajouter un plat
                </button>
              </header>

              <div className="space-y-3">
                {config.items.length === 0 ? (
                  <div className="py-12 bg-[#F5F5F4] rounded-3xl border border-dashed border-[#E7E5E4] text-center">
                    <ShoppingBasket className="w-12 h-12 text-stone-300 mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-stone-400 font-medium">Aucun plat configuré.</p>
                  </div>
                ) : (
                  config.items.map(item => {
                    const cat = config.categories.find(c => c.id === item.categoryId);
                    return (
                      <div key={item.id} className="bg-[#F5F5F4] border border-[#E7E5E4] p-3 rounded-2xl flex justify-between gap-4 items-center">
                        <div className="flex gap-3 items-center min-w-0">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#E7E5E4]">
                            <Image
                              src={item.imageUrl || 'https://picsum.photos/id/292/400/400'}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="text-left min-w-0 font-sans">
                            <h4 className="font-bold text-sm truncate">{item.name}</h4>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{cat?.name || 'Sans catégorie'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-primary">{item.price} {config.style.currency}</span>
                          <button
                            onClick={() => openDishModal('edit', item)}
                            className="p-2 text-stone-400 hover:text-stone-900 transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* PARTAGE CONTENT */}
        {activeSubTab === 'PARTAGE' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 text-center py-6">
            <div className="max-w-sm mx-auto space-y-6">
              <header>
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-2">Prêt à servir ?</h2>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Générez votre menu interactif et partagez-le instantanément avec vos clients.
                </p>
              </header>

              {/* QR Image Frame */}
              <div className={`bg-white p-4 rounded-3xl w-48 h-48 mx-auto flex items-center justify-center border ${
                isLight ? 'border-[#E7E5E4]' : 'border-zinc-805'
              } shadow-sm relative`}>
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/${config?.slug || 'le-palais-du-chef'}`
                      : `https://applet.local/${config?.slug || 'le-palais-du-chef'}`
                  )}`}
                  alt="QR Menu"
                  width={180}
                  height={180}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button className="h-12 bg-white border border-[#E7E5E4] rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:border-primary/30 transition cursor-pointer">
                  <Share2 className="w-4 h-4" /> Partager
                </button>
                <a
                  href={`/${config.slug}`}
                  target="_blank"
                  className="h-12 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" /> Aperçu live
                </a>
              </div>
            </div>

            <div className="max-w-sm mx-auto bg-[#F5F5F4] p-5 rounded-3xl border border-[#E7E5E4] flex gap-4 text-left">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold">Lien Direct</h4>
                <p className="text-[11px] text-stone-500 font-medium break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/${config.slug}` : `/${config.slug}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CATEGORY MODAL */}
      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowCatModal(null)}
                aria-label="Fermer le modal"
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                {showCatModal.mode === 'add' ? <Plus className="w-6 h-6 text-primary" /> : <Edit3 className="w-6 h-6 text-primary" />}
                {showCatModal.mode === 'add' ? 'Nouvelle Catégorie' : 'Modifier la Catégorie'}
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Nom complet</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Ex: Entrées Gourmandes"
                    className="w-full h-14 px-5 bg-[#F5F5F4] rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCatModal(null)}
                    className="flex-1 h-14 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold hover:bg-stone-200 transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCatSubmit}
                    disabled={isSaving || !catName}
                    className="flex-2 h-14 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Traitement...' : 'Enregistrer'}
                  </button>
                </div>

                {showCatModal.mode === 'edit' && (
                  <button
                    onClick={async () => {
                      if (showCatModal.cat && config?.id) {
                        setIsSaving(true);
                        const res = await deleteCategory(config.id, showCatModal.cat.id);
                        if (res.success) {
                          updateCategories(config.categories.filter(c => c.id !== showCatModal.cat?.id));
                          setShowCatModal(null);
                        }
                        setIsSaving(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-500 pt-4 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer définitivement
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISH MODAL */}
      <AnimatePresence>
        {showDishModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button
                onClick={() => setShowDishModal(null)}
                aria-label="Fermer le modal"
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                {showDishModal.mode === 'add' ? <FilePlus className="w-6 h-6 text-primary" /> : <Edit3 className="w-6 h-6 text-primary" />}
                {showDishModal.mode === 'add' ? 'Nouveau Plat' : 'Détails du Plat'}
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Nom du plat</label>
                    <input
                      type="text"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      placeholder="Pizza Burrata..."
                      className="w-full h-12 px-4 bg-[#F5F5F4] rounded-xl text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Prix (${config.style.currency})</label>
                    <input
                      type="number"
                      value={dishPrice}
                      onChange={(e) => setDishPrice(Number(e.target.value))}
                      className="w-full h-12 px-4 bg-[#F5F5F4] rounded-xl text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Catégorie rattachée</label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {config.categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setDishCategoryId(cat.id)}
                        className={`whitespace-nowrap px-4 h-11 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          dishCategoryId === cat.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-[#E7E5E4]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Description / Ingrédients</label>
                  <textarea
                    value={dishDescription}
                    onChange={(e) => setDishDescription(e.target.value)}
                    placeholder="Décrivez les saveurs, les allergènes..."
                    rows={3}
                    className="w-full p-4 bg-[#F5F5F4] rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Image d&apos;illustration</label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {sampleDishesImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setDishImageUrl(img)}
                        className={`relative w-10 h-10 rounded-lg overflow-hidden border flex-shrink-0 cursor-pointer ${
                          dishImageUrl === img ? 'border-emerald-500 scale-105' : 'border-[#E7E5E4]'
                        }`}
                      >
                        <Image src={img} alt="sample" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={dishImageUrl}
                    onChange={(e) => setDishImageUrl(e.target.value)}
                    placeholder="Ou collez un lien d'image..."
                    className="w-full h-11 px-4 bg-[#F5F5F4] rounded-xl text-[10px] text-stone-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 ${isDishAvailable ? 'text-emerald-500' : 'text-stone-300'}`} />
                    <span className="text-xs font-bold">Disponible immédiatement</span>
                  </div>
                  <button
                    onClick={() => setIsDishAvailable(!isDishAvailable)}
                    className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 cursor-pointer ${
                      isDishAvailable ? 'bg-emerald-500' : 'bg-stone-200'
                    }`}
                  >
                    <motion.div animate={{ x: isDishAvailable ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>

                <div className="flex gap-4 pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setShowDishModal(null)}
                    className="flex-1 h-14 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold hover:bg-stone-200 transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDishSubmit}
                    disabled={isSaving || !dishName}
                    className="flex-2 h-14 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Traitement...' : 'Valider'}
                  </button>
                </div>

                {showDishModal.mode === 'edit' && (
                  <button
                    onClick={async () => {
                      if (showDishModal.item && config?.id) {
                        setIsSaving(true);
                        const res = await deleteProduct(config.id, showDishModal.item.id);
                        if (res.success) {
                          updateItems(config.items.filter(i => i.id !== showDishModal.item?.id));
                          setShowDishModal(null);
                        }
                        setIsSaving(false);
                      }
                    }}
                    className="w-full text-center text-xs font-bold text-red-500 hover:underline pt-2 cursor-pointer"
                  >
                    Retirer ce plat de la carte
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
