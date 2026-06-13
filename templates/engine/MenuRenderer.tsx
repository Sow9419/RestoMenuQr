'use client';

import React from 'react';
import { RestaurantConfig, MenuItem, MenuCategory } from '@/lib/restoTypes';
import { Plus } from 'lucide-react';

interface MenuRendererProps {
  config: RestaurantConfig;
  activeCategory: string;
  setActiveCategory: (catId: string) => void;
  searchTerm: string;
  onAddItem?: (item: MenuItem) => void;
  categoryHeadingsRef?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

export default function MenuRenderer({
  config,
  activeCategory,
  setActiveCategory,
  searchTerm,
  onAddItem,
  categoryHeadingsRef,
}: MenuRendererProps) {
  const style = config.style;
  const isLight = style.displayMode === 'light';

  // Apply layout class
  const isCompact = style.density === 'compact';

  // Filter items in the list based on search and category tab
  const filteredDishes = config.items.filter((it) => {
    const matchesSearch =
      it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || it.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (val: number) => {
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${parts.join('.')} ${style.currency}`;
  };

  return (
    <div className="space-y-6">
      {config.categories.map((cat) => {
        const catDishes = filteredDishes.filter((d) => d.categoryId === cat.id);
        if (catDishes.length === 0) return null;

        return (
          <div
            key={cat.id}
            ref={(el) => {
              if (categoryHeadingsRef && categoryHeadingsRef.current) {
                categoryHeadingsRef.current[cat.id] = el;
              }
            }}
            className="space-y-3"
          >
            {/* Section Title */}
            <h3
              className={`text-xs font-bold uppercase tracking-widest border-b pb-1 flex items-center gap-2 ${
                isLight ? 'text-[#78716C] border-[#E7E5E4]' : 'text-slate-400 border-slate-900'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isLight ? 'text-[#78716C] bg-[#E7E5E4]' : 'text-slate-650 bg-slate-950'
                }`}
              >
                {catDishes.length}
              </span>
            </h3>

            {/* Dishes in this category */}
            <div className="space-y-3">
              {catDishes.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl overflow-hidden shadow-sm flex relative transition-colors ${
                    isLight
                      ? 'bg-[#F5F5F4] border border-[#E7E5E4]'
                      : 'bg-slate-950/40 border border-slate-900/60'
                  } ${isCompact ? 'p-2.5 gap-2.5' : 'p-3.5 gap-3.5'} ${
                    !item.isAvailable || !config.isOpen ? 'opacity-60' : ''
                  }`}
                >
                  {/* Dish image thumbnail */}
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={`object-cover rounded-xl shrink-0 border ${
                        isLight ? 'border-[#E7E5E4]' : 'border-slate-900/50'
                      } ${isCompact ? 'w-14 h-14' : 'w-20 h-20'}`}
                    />
                  )}

                  {/* Details text */}
                  <div className="flex-1 min-w-0 pr-6 flex flex-col justify-between">
                    <div>
                      <h4 className={`text-xs font-bold truncate ${isLight ? 'text-[#1C1917]' : 'text-slate-100'}`}>
                        {item.name}
                      </h4>
                      <p
                        className={`text-[10px] line-clamp-2 mt-0.5 leading-normal font-sans ${
                          isLight ? 'text-[#78716C]' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-xs font-bold font-mono ${isLight ? 'text-[#1C1917]' : 'text-slate-200'}`}>
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  </div>

                  {/* Floating add button */}
                  {onAddItem && (
                    <button
                      onClick={() => onAddItem(item)}
                      disabled={!item.isAvailable || !config.isOpen}
                      className={`absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all ${
                        item.isAvailable && config.isOpen
                          ? 'brand-accent-bg hover:opacity-90'
                          : isLight
                          ? 'bg-[#E7E5E4] text-[#A8A29E]'
                          : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      <Plus size={14} />
                    </button>
                  )}

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
          {"Aucun plat trouvé."}
        </div>
      )}
    </div>
  );
}
