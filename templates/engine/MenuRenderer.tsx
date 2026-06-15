'use client';

import React from 'react';
import Image from 'next/image';
import { RestaurantConfig, MenuItem } from '@/features/menu/types';
import { motion } from 'motion/react';
import { Plus, Info, ChevronRight, Star } from 'lucide-react';

interface MenuRendererProps {
  config: RestaurantConfig;
  onItemClick?: (item: MenuItem) => void;
}

/**
 * MenuRenderer - Composant Unique de Rendu (ADR-003)
 * Ce moteur interprète le JSON de configuration pour produire l'UI du menu.
 * Utilisé pour : Menu Public, Builder Preview, Mobile Preview.
 */
export default function MenuRenderer({ config, onItemClick }: MenuRendererProps) {
  const { style, categories, items, sections } = config;

  // Filtrer les sections activées et triées
  const activeSections = [...sections]
    .filter(s => s.enabled)
    .sort((a, b) => (a as any).sortOrder - (b as any).sortOrder);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} ${style.currency || 'FCFA'}`;
  };

  return (
    <div
      className="min-h-full transition-colors duration-500 pb-24"
      style={{
        backgroundColor: style.displayMode === 'dark' ? '#0C0A09' : '#FAFAF9',
        fontFamily: style.fontFamily
      }}
    >
      {activeSections.map((section) => {
        switch (section.section_key as any) {
          case 'hero':
            return (
              <header key={section.id} className="relative h-[45vh] flex items-center justify-center overflow-hidden">
                {style.heroBannerUrl && (
                  <Image
                    src={style.heroBannerUrl}
                    alt={style.heroTitle || 'Restaurant Banner'}
                    fill
                    priority
                    className="object-cover"
                  />
                )}
                <div
                  className="absolute inset-0 z-10"
                  style={{ backgroundColor: `rgba(0,0,0,${style.overlayOpacity / 100})` }}
                />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-20 text-center px-6"
                >
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
                    {style.heroTitle}
                  </h1>
                  <p className="text-lg text-white/90 max-w-lg mx-auto leading-relaxed drop-shadow-md">
                    {style.heroDescription}
                  </p>
                </motion.div>
              </header>
            );

          case 'categories':
            return (
              <div key={section.id} className="sticky top-0 z-30 bg-inherit/80 backdrop-blur-md border-b border-stone-200/50 py-4 px-4 overflow-x-auto no-scrollbar flex gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className="whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all border border-stone-200 bg-white shadow-sm hover:shadow-md cursor-pointer"
                    style={{ color: style.accentColor }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            );

          case 'menu':
            return (
              <main key={section.id} className="p-6 max-w-4xl mx-auto space-y-12">
                {categories.map((cat) => {
                  const catItems = items.filter(i => i.categoryId === cat.id);
                  if (catItems.length === 0) return null;

                  return (
                    <section key={cat.id} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold tracking-tight">{cat.name}</h2>
                        <div className="h-[2px] flex-1 bg-stone-200/50 rounded-full" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {catItems.map((item) => (
                          <motion.div
                            key={item.id}
                            whileHover={{ y: -4 }}
                            onClick={() => onItemClick?.(item)}
                            className="group relative bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all p-4 flex gap-5 cursor-pointer"
                          >
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  sizes="96px"
                                  className="object-cover transition-transform group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                                  <Info className="w-6 h-6 text-stone-300" />
                                </div>
                              )}
                              {item.salesCount > 10 && (
                                <div className="absolute top-1 left-1 bg-primary text-white p-1 rounded-lg">
                                  <Star className="w-3 h-3 fill-current" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 flex flex-col py-1">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                  {item.name}
                                </h3>
                                <span className="font-bold text-primary shrink-0 ml-2">
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                              <p className="text-stone-400 text-sm line-clamp-2 leading-relaxed mb-3">
                                {item.description}
                              </p>
                              <div className="mt-auto flex justify-between items-center">
                                <button className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1">
                                  Détails <ChevronRight className="w-3 h-3" />
                                </button>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:rotate-90"
                                  style={{ backgroundColor: style.accentColor }}
                                >
                                  <Plus className="w-5 h-5" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </main>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
