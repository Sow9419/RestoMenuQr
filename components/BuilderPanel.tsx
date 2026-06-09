'use client';

import React, { useState } from 'react';
import { useResto } from './RestoContext';
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
import { MenuCategory, MenuItem, RestaurantSection } from '@/lib/restoTypes';
import { motion, AnimatePresence } from 'motion/react';

export default function BuilderPanel() {
  const { config, updateConfigOnServer } = useResto();
  
  // Tab within Builder Panel: 'SECTIONS' | 'STYLE' | 'CONTENT' | 'PARTAGE'
  const [activeSubTab, setActiveSubTab] = useState<'SECTIONS' | 'STYLE' | 'CONTENT' | 'PARTAGE'>('SECTIONS');

  // Form states for Category CRUD
  const [showCatModal, setShowCatModal] = useState<any>(null); // { mode: 'add' } or { mode: 'edit', cat: ... }
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Coffee');

  // Form states for Dish CRUD
  const [showDishModal, setShowDishModal] = useState<any>(null); // { mode: 'add' } or { mode: 'edit', item: ... }
  const [dishName, setDishName] = useState('');
  const [dishCategoryId, setDishCategoryId] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishPrice, setDishPrice] = useState<number>(0);
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [dishIsAvailable, setDishIsAvailable] = useState(true);

  // General presets
  const availableIcons = ['Coffee', 'Pizza', 'Beef', 'CupSoda', 'Cake', 'Fish', 'Sparkles', 'Utensils'];
  
  const sampleDishesImages = [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=40&w=200',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=40&w=200',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=40&w=200',
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=40&w=200',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=40&w=200'
  ];

  // Helper sync
  const pushConfigUpdate = (updatedConfig: typeof config) => {
    updateConfigOnServer(updatedConfig);
  };

  // ----- SUB-SECTION 1: REORDER / TOGGLE SECTIONS -----
  const handleToggleSection = (sectionId: string) => {
    const updatedSections = config.sections.map(s => 
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    pushConfigUpdate({ ...config, sections: updatedSections });
  };

  const handleMoveSection = (index: number, direction: 'UP' | 'DOWN') => {
    const nextIndex = direction === 'UP' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= config.sections.length) return;

    const updatedSections = [...config.sections];
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[nextIndex];
    updatedSections[nextIndex] = temp;

    pushConfigUpdate({ ...config, sections: updatedSections });
  };

  // ----- SUB-SECTION 2: CUSTOM STYLE VALUES -----
  const handleStyleChange = (field: string, value: any) => {
    const updatedStyle = {
      ...config.style,
      [field]: value
    };
    pushConfigUpdate({ ...config, style: updatedStyle });
  };

  // Preset accent colors
  const ACCENT_COLORS = [
    { name: 'Slates Rose', color: '#e11d48' },
    { name: 'Warm Orange', color: '#ea580c' },
    { name: 'Forest Green', color: '#16a34a' },
    { name: 'Ocean Cyan', color: '#0284c7' },
    { name: 'Orchid Purple', color: '#9333ea' },
    { name: 'Amber Gold', color: '#d97706' },
  ];

  // ----- SUB-SECTION 3: CRUD CATEGORIES -----
  const handleOpenCatAdd = () => {
    setCatName('');
    setCatIcon('Coffee');
    setShowCatModal({ mode: 'add' });
  };

  const handleOpenCatEdit = (cat: MenuCategory) => {
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setShowCatModal({ mode: 'edit', cat });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    let updatedCategories = [...config.categories];

    if (showCatModal.mode === 'add') {
      const newCat: MenuCategory = {
        id: `cat-${Math.random().toString(36).substr(2, 9)}`,
        name: catName,
        icon: catIcon,
        order: config.categories.length
      };
      updatedCategories.push(newCat);
    } else {
      const target = showCatModal.cat;
      updatedCategories = updatedCategories.map(c => 
        c.id === target.id ? { ...c, name: catName, icon: catIcon } : c
      );
    }

    pushConfigUpdate({ ...config, categories: updatedCategories });
    setShowCatModal(null);
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette catégorie ? Tous les plats rattachés resteront mais perdront leur dossier de tri.')) {
      const updatedCategories = config.categories.filter(c => c.id !== catId);
      pushConfigUpdate({ ...config, categories: updatedCategories });
    }
  };

  // ----- SUB-SECTION 4: CRUD DISHES -----
  const handleOpenDishAdd = () => {
    setDishName('');
    setDishCategoryId(config.categories[0]?.id || '');
    setDishDescription('');
    setDishPrice(6500);
    setDishImageUrl(sampleDishesImages[0]);
    setDishIsAvailable(true);
    setShowDishModal({ mode: 'add' });
  };

  const handleOpenDishEdit = (item: MenuItem) => {
    setDishName(item.name);
    setDishCategoryId(item.categoryId);
    setDishDescription(item.description);
    setDishPrice(item.price);
    setDishImageUrl(item.imageUrl);
    setDishIsAvailable(item.isAvailable);
    setShowDishModal({ mode: 'edit', item });
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;

    let updatedItems = [...config.items];

    if (showDishModal.mode === 'add') {
      const newItem: MenuItem = {
        id: `item-${Math.random().toString(36).substr(2, 9)}`,
        categoryId: dishCategoryId,
        name: dishName,
        description: dishDescription,
        price: Number(dishPrice),
        imageUrl: dishImageUrl,
        isAvailable: dishIsAvailable,
        salesCount: 0
      };
      updatedItems.push(newItem);
    } else {
      const target = showDishModal.item;
      updatedItems = updatedItems.map(it => 
        it.id === target.id 
          ? { 
              ...it, 
              name: dishName, 
              categoryId: dishCategoryId, 
              description: dishDescription, 
              price: Number(dishPrice), 
              imageUrl: dishImageUrl,
              isAvailable: dishIsAvailable 
            } 
          : it
      );
    }

    pushConfigUpdate({ ...config, items: updatedItems });
    setShowDishModal(null);
  };

  const handleDeleteDish = (itemId: string) => {
    if (confirm('Voulez-vous supprimer ce plat de la carte client ?')) {
      const updatedItems = config.items.filter(it => it.id !== itemId);
      pushConfigUpdate({ ...config, items: updatedItems });
    }
  };

  const isLight = config?.style?.displayMode === 'light';

  return (
    <div className={`flex-1 flex flex-col font-sans relative overflow-hidden h-full transition-colors duration-200 ${
      isLight 
        ? 'bg-[#FAFAF9] text-[#1C1917]' 
        : 'bg-[#0a0a0a] text-zinc-300'
    }`}>

      {/* Sub tabs header */}
      <div className={`grid grid-cols-4 border-b shrink-0 transition-colors duration-200 ${
        isLight ? 'border-[#E7E5E4] bg-[#F5F5F4]' : 'border-zinc-800 bg-[#0d0d0d]'
      }`}>
        {[
          { id: 'SECTIONS', label: 'Sections', icon: Layers },
          { id: 'STYLE', label: 'Style', icon: Paintbrush },
          { id: 'CONTENT', label: 'Contenu', icon: ShoppingBasket },
          { id: 'PARTAGE', label: 'Partage', icon: QrCode }
        ].map((subTab) => {
          const isActive = activeSubTab === subTab.id;
          return (
            <button
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id as any)}
              className={`py-4 px-1.5 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-[11px] sm:text-xs font-extrabold border-b-2 cursor-pointer transition-all ${
                isActive 
                  ? isLight
                    ? 'border-emerald-500 text-emerald-600 bg-[#FAFAF9]'
                    : 'border-emerald-500 text-emerald-400 bg-zinc-950/40' 
                  : isLight
                    ? 'border-transparent text-stone-500 hover:text-stone-800'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <subTab.icon size={12} className={isActive ? 'text-emerald-500' : ''} />
              <span>{subTab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable controls list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* ======================================= */}
        {/* TAB 1: SECTION LIST ORDER AND SETTINGS */}
        {/* ======================================= */}
        {activeSubTab === 'SECTIONS' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Dispositions du Menu</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{"Activez, désactivez ou réordonnez l'importance des sections de votre carte client d'un clic."}</p>
            </div>

            <div className="space-y-2">
              {config.sections.map((section, idx) => (
                <div 
                  key={section.id} 
                  className={`bg-zinc-900/30 border rounded-2xl p-3.5 flex items-center justify-between gap-4 transition-all ${
                    section.enabled ? 'border-zinc-850' : 'border-zinc-900 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Status inline indicator LED */}
                    <span className={`w-2 h-2 rounded-full ${section.enabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}></span>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-zinc-200">{section.label}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono">ID: {section.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Move controls UP/DOWN */}
                    <button
                      onClick={() => handleMoveSection(idx, 'UP')}
                      disabled={idx === 0}
                      className="w-7 h-7 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-105 rounded-lg flex items-center justify-center cursor-pointer transition-colors disabled:opacity-20"
                      title="Monter la section"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => handleMoveSection(idx, 'DOWN')}
                      disabled={idx === config.sections.length - 1}
                      className="w-7 h-7 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-105 rounded-lg flex items-center justify-center cursor-pointer transition-colors disabled:opacity-20"
                      title="Descendre la section"
                    >
                      <ArrowDown size={12} />
                    </button>

                    {/* Enable ON/OFF slider */}
                    <button
                      onClick={() => handleToggleSection(section.id)}
                      className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md cursor-pointer transition-all ${
                        section.enabled 
                          ? 'bg-emerald-500/15 text-emerald-450 border border-emerald-500/20' 
                          : 'bg-zinc-900 text-zinc-550 border border-zinc-800'
                      }`}
                    >
                      {section.enabled ? 'VISIBLE' : 'MASQUÉ'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 2: GENERAL APP STYLING CONTROLLER */}
        {/* ======================================= */}
        {activeSubTab === 'STYLE' && (
          <div className="space-y-6">
            
            {/* Display Mode Theme selector */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-405 uppercase tracking-wider">Mode thématique global</label>
              <div className="grid grid-cols-2 gap-2">
                {['light', 'dark'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleStyleChange('displayMode', mode)}
                    className={`py-2 px-3 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                      config.style.displayMode === mode
                        ? 'bg-emerald-500/15 text-emerald-450 border-emerald-500/30'
                        : 'bg-zinc-900/50 text-zinc-500 border-transparent hover:text-zinc-200'
                    }`}
                  >
                    {mode === 'light' ? 'Mode Lumineux' : 'Mode Sombre'}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color picker */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{"Teinte d'Accentuation du Restaurant"}</label>
              <div className="flex flex-wrap gap-2.5">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.color}
                    onClick={() => handleStyleChange('accentColor', c.color)}
                    className="w-8 h-8 rounded-full border border-zinc-950 flex items-center justify-center relative cursor-pointer group shadow"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {config.style.accentColor === c.color && (
                      <Check size={14} className="text-white drop-shadow" />
                    )}
                  </button>
                ))}
                
                {/* Manual color picker */}
                <input 
                  type="color" 
                  value={config.style.accentColor}
                  onChange={(e) => handleStyleChange('accentColor', e.target.value)}
                  className="w-8 h-8 rounded-full border-0 bg-transparent cursor-pointer"
                />
              </div>
            </div>

            {/* Fonts Selection */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-405 uppercase tracking-wider">{"Police d'écriture Curatée"}</label>
              <select
                value={config.style.fontFamily}
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-xs rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-emerald-500 font-medium"
              >
                {FONTS_LIST.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Compact vs Comfortable spacing */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-zinc-405 uppercase tracking-wider">{"Densité d'Affichage des Plats"}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'compact', name: 'Compacted (Espace serré)' },
                  { id: 'confortable', name: 'Confort (Images larges)' }
                ].map(den => (
                  <button
                    key={den.id}
                    onClick={() => handleStyleChange('density', den.id)}
                    className={`py-2 px-3 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                      config.style.density === den.id
                        ? 'bg-emerald-500/15 text-emerald-450 border-emerald-500/30'
                        : 'bg-zinc-900/50 text-zinc-500 border-transparent hover:text-zinc-200'
                    }`}
                  >
                    {den.name}
                  </button>
                ))}
              </div>
            </div>

            {/* CURATED LIST of 20 BACKGROUNDS */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-zinc-405 uppercase tracking-wider">
                Arrière-Plan du Menu Client (20 Options)
              </label>
              <p className="text-[10px] text-zinc-500 leading-tight">{"Choisissez le fond de l'application parmi les 20 presets premium d'ambiance."}</p>
              
              <div className="grid grid-cols-5 gap-2 pt-1">
                {BACKGROUND_PRESETS.map((preset) => {
                  const isActive = config.style.backgroundImageUrl === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleStyleChange('backgroundImageUrl', preset.id)}
                      className={`aspect-video rounded-lg border flex items-center justify-center relative overflow-hidden transition-all cursor-pointer hover:scale-105 active:scale-95 shadow ${
                        isActive 
                          ? 'border-emerald-500 scale-105 ring-2 ring-emerald-500/20' 
                          : 'border-zinc-800'
                      }`}
                      style={{ background: preset.preview }}
                      title={preset.name}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <Check size={11} className="text-white font-bold" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Glassmorphism toggle and overlays */}
            <div className="space-y-4 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-300">Floutage Verre Dépoli (Glassmorphism)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 font-light font-sans">Ajoute un effet verrier satiné sophistiqué sur les cartes des plats.</p>
                </div>
                <button
                  onClick={() => handleStyleChange('glassmorphism', !config.style.glassmorphism)}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded bg-[#0d0d0d] border cursor-pointer ${
                    config.style.glassmorphism ? 'text-emerald-400 border-emerald-500/10' : 'text-zinc-500 border-zinc-800'
                  }`}
                >
                  {config.style.glassmorphism ? 'ACTIF' : 'INACTIF'}
                </button>
              </div>

              {/* Background cover transparency */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center text-xs text-zinc-400 font-sans">
                  <span>Densité du Voile de Fond</span>
                  <span className="font-mono">{config.style.overlayOpacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="90" 
                  value={config.style.overlayOpacity}
                  onChange={(e) => handleStyleChange('overlayOpacity', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-[#0d0d0d] rounded-lg appearance-none"
                />
              </div>
            </div>

          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: RESTAURANT INVENTORY CRUD DATA */}
        {/* ======================================= */}
        {activeSubTab === 'CONTENT' && (
          <div className="space-y-6">
            
            {/* CATEGORIES SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h4 className="text-xs font-extrabold text-zinc-300 uppercase tracking-widest">Catégories de Plats</h4>
                <button
                  onClick={handleOpenCatAdd}
                  className="px-2 py-1 bg-emerald-500/15 text-emerald-450 hover:bg-emerald-500/25 border border-emerald-500/20 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus size={11} /> Ajouter
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {config.categories.map(cat => (
                  <div key={cat.id} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-200">{cat.name}</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenCatEdit(cat)}
                        className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 cursor-pointer"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ITEMS/DISHES SECTION */}
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h4 className="text-xs font-extrabold text-zinc-300 uppercase tracking-widest">Catalogue des Plats</h4>
                <button
                  onClick={handleOpenDishAdd}
                  className="px-2 py-1 bg-emerald-500/15 text-emerald-450 hover:bg-emerald-500/25 border border-emerald-500/20 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus size={11} /> Ajouter un plat
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {config.items.map(item => {
                  const cat = config.categories.find(c => c.id === item.categoryId);
                  return (
                    <div key={item.id} className="bg-zinc-900/30 border border-zinc-800/80 p-3 rounded-2xl flex justify-between gap-4 items-center">
                      <div className="flex gap-3 items-center min-w-0">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-zinc-800"
                        />
                        <div className="text-left min-w-0 font-sans">
                          <h5 className="text-xs font-bold text-zinc-200 truncate">{item.name}</h5>
                          <span className="text-[9px] text-zinc-500 font-medium bg-zinc-950 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                            {cat?.name || 'Sans Catégorie'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-semibold text-zinc-305">{item.price.toString().split(".")[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ")} {config.style.currency}</span>
                        
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleOpenDishEdit(item)}
                            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 cursor-pointer"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDish(item.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ======================================= */}
        {/* TAB 4: PARTAGE & QR CODE GENERATION */}
        {/* ======================================= */}
        {activeSubTab === 'PARTAGE' && (
          <div className="space-y-6 text-left">
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-[#1C1917]' : 'text-slate-200'}`}>Partage & Code QR</h3>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>
                {"Diffusez votre carte digitale en direct auprès de vos clients."}
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${
              isLight ? 'bg-[#F5F5F4] border-[#E7E5E4]' : 'bg-zinc-900/30 border-zinc-800'
            } space-y-5`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/15 text-emerald-500 rounded-xl">
                  <QrCode size={18} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isLight ? 'text-[#1C1917]' : 'text-zinc-200'}`}>{"Votre Code QR à emporter"}</h4>
                  <p className={`text-[10px] ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>Imprimez-le sur vos tables ou comptoirs.</p>
                </div>
              </div>

              {/* QR Image Frame */}
              <div className={`bg-white p-4 rounded-3xl w-48 h-48 mx-auto flex items-center justify-center border ${
                isLight ? 'border-[#E7E5E4]' : 'border-zinc-805'
              } shadow-sm`}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/${config?.slug || 'le-palais-du-chef'}`
                      : `https://applet.local/${config?.slug || 'le-palais-du-chef'}`
                  )}`} 
                  alt="QR Code Menu" 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Dynamic URL Link section */}
              <div className="space-y-1.5 font-sans">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-[#78716C]' : 'text-zinc-500'}`}>Adresse Web Directe</label>
                <div className={`flex items-center gap-2 p-2 px-3 text-xs rounded-xl font-mono border ${
                  isLight ? 'bg-[#E7E5E4]/40 border-[#E7E5E4] text-stone-700' : 'bg-black/40 border-zinc-800 text-zinc-300'
                }`}>
                  <span className="truncate flex-1">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/${config?.slug || 'le-palais-du-chef'}`
                      : `https://applet.local/${config?.slug || 'le-palais-du-chef'}`}
                  </span>
                </div>
              </div>

              {/* Call-to-actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    const url = typeof window !== 'undefined'
                      ? `${window.location.origin}/${config?.slug || 'le-palais-du-chef'}`
                      : `https://applet.local/${config?.slug || 'le-palais-du-chef'}`;
                    navigator.clipboard.writeText(url);
                    alert('Lien recopié !');
                  }}
                  className={`py-3 px-4 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isLight 
                      ? 'bg-[#E7E5E4] border-[#E7E5E4] text-[#1C1917] hover:bg-stone-300' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-[#18181b]'
                  }`}
                >
                  <Share2 size={12} />
                  <span>Copier</span>
                </button>

                <a
                  href={
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/${config?.slug || 'le-palais-du-chef'}`
                      : `/${config?.slug || 'le-palais-du-chef'}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-4 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  <span>Tester live</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className={`p-4 border rounded-2xl flex gap-2.5 items-start ${
              isLight ? 'bg-emerald-50 border-emerald-200/50 text-emerald-800' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
            }`}>
              <Sparkles size={14} className="mt-0.5 shrink-0" />
              <p className="text-[10px] leading-relaxed">
                Ce QR code redirige vos clients sur leur smartphone directement sur votre carte digitale. Les commandes prises en salle y sont transmises directement et en direct sur l&apos;écran cuisine de votre caisse !
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ======================================= */}
      {/* DIALOG CHIPS: CATEGORY MODAL */}
      {/* ======================================= */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 text-zinc-100 rounded-2xl border border-zinc-800 p-5 max-w-sm w-full space-y-4 shadow-xl text-left"
          >
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h4 className="font-bold text-zinc-150">
                {showCatModal.mode === 'add' ? 'Créer une Catégorie' : 'Modifier la Catégorie'}
              </h4>
              <button onClick={() => setShowCatModal(null)} className="text-zinc-500 hover:text-zinc-200 cursor-pointer">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Intitulé de la catégorie</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex. Plats du jour, Pizza..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-zinc-800 text-xs text-zinc-200 rounded-xl px-4 py-3 placeholder-zinc-700 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Icône de regroupement</label>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {availableIcons.map((ic) => (
                    <button
                      type="button"
                      key={ic}
                      onClick={() => setCatIcon(ic)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                        catIcon === ic 
                          ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 font-extrabold' 
                          : 'border-zinc-800 hover:bg-zinc-90 w bg-zinc-900/60 text-zinc-400'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-black cursor-pointer shadow-lg shadow-emerald-950/25 active:scale-[0.98] transition-all text-center"
              >
                Enregistrer la catégorie
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ======================================= */}
      {/* DIALOG CHIPS: DISH/ITEM MODAL */}
      {/* ======================================= */}
      {showDishModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 text-zinc-100 rounded-2xl border border-zinc-800 p-5 max-w-sm w-full space-y-4 shadow-xl text-left max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h4 className="font-bold text-zinc-150">
                {showDishModal.mode === 'add' ? 'Ajouter un Plat' : 'Ajuster les caractéristiques'}
              </h4>
              <button onClick={() => setShowDishModal(null)} className="text-zinc-500 hover:text-zinc-200 cursor-pointer">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Dénomination du plat</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex. Smash Bacon Cheeseburger..."
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-zinc-800 text-xs text-zinc-200 rounded-xl px-4 py-3 placeholder-zinc-700 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Catégorie</label>
                  <select
                    value={dishCategoryId}
                    onChange={(e) => setDishCategoryId(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-zinc-800 text-xs rounded-xl px-3 py-3 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    {config.categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-zinc-950 text-zinc-200">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Tarif ({config.style.currency})</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    value={dishPrice || ''}
                    onChange={(e) => setDishPrice(Number(e.target.value))}
                    className="w-full bg-[#0d0d0d] border border-zinc-800 text-xs text-zinc-205 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 border-t border-zinc-800/60 pt-3">
                <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Texte de description du plat</label>
                <textarea 
                  rows={2}
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="Ingrédients délicats, épices, garnitures..."
                  className="w-full bg-[#0d0d0d] border border-zinc-800 text-xs text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Cover thumbnail selections */}
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">{"Photo d'illustration du plat"}</label>
                <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
                  {sampleDishesImages.map((img, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setDishImageUrl(img)}
                      className={`w-10 h-10 rounded-lg overflow-hidden border flex-shrink-0 cursor-pointer ${
                        dishImageUrl === img ? 'border-emerald-500 scale-105' : 'border-zinc-800'
                      }`}
                    >
                      <img src={img} alt="sample" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input 
                  type="text"
                  placeholder="Ou collez une URL Unsplash, Picsum..."
                  value={dishImageUrl}
                  onChange={(e) => setDishImageUrl(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-zinc-800 text-[10px] text-zinc-400 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Available ON / OFF select */}
              <div className="flex justify-between items-center p-3.5 bg-zinc-900/30 rounded-xl border border-zinc-800">
                <div className="text-left font-sans">
                  <h5 className="text-[11px] font-bold text-zinc-200">Disponibilité du plat</h5>
                  <p className="text-[9px] text-zinc-500 mt-0.5">{"S'il est inactif, les clients verront la mention 'ÉPUISÉ'."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDishIsAvailable(!dishIsAvailable)}
                  className={`px-3 py-1 font-extrabold rounded text-[10px] cursor-pointer transition-colors ${
                    dishIsAvailable ? 'bg-emerald-550/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-550/20'
                  }`}
                >
                  {dishIsAvailable ? 'DISEPO.' : 'ÉPUISÉ'}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-black cursor-pointer shadow-lg shadow-emerald-950/25 active:scale-[0.98] transition-all text-center"
              >
                {"Valider l'Inventaire du Plat"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
