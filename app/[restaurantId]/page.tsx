'use client';

export const dynamic = 'force-dynamic';

import { use } from 'react';
import MenuInitializer from '@/features/menu/components/MenuInitializer';
import { useMenuStore } from '@/features/menu/store/menu.store';
import ClientMenu from '@/components/ClientMenu';
import { Coffee, SearchCode, ArrowRight, Store } from 'lucide-react';

// ─── Inner Content ────────────────────────────────────────────────────────────

function CustomerMenuPageContent({ restaurantId }: { restaurantId: string }) {
  const { config, isLoading, error } = useMenuStore();

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <div className="w-10 h-10 rounded-xl bg-rose-600 animate-spin flex items-center justify-center mb-4">
          <Coffee className="text-white" size={18} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Chargement du menu...
        </span>
      </div>
    );
  }

  // ERR_MENU_NOT_FOUND — slug invalide ou menu dépublié
  const isMatch = config && (config.slug.toLowerCase() === restaurantId.toLowerCase() || config.id === restaurantId);
  if (error || !config || !isMatch) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 font-sans select-none">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/10">
          <SearchCode size={30} className="text-red-400" />
        </div>

        <div className="space-y-2 max-w-sm">
          <span className="text-[10px] font-black tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/10">
            ❌ ERR_MENU_NOT_FOUND
          </span>
          <h1 className="text-2xl font-black text-white px-2">Menu Introuvable</h1>
          <p className="text-xs text-slate-500 leading-relaxed font-light">
            {
              "Le QR code ou le lien de restaurant auquel vous tentez d'accéder n'existe pas ou le menu associé a été dé-publié par le restaurateur."
            }
          </p>
        </div>
      </div>
    );
  }

  // Valid slug — afficher le menu client
  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-between">
      <div className="w-full max-w-md h-full bg-slate-900 border-x border-slate-900 overflow-hidden shadow-2xl relative">
        <ClientMenu isPreview={false} />
      </div>
    </div>
  );
}

// ─── Page Entry ───────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ restaurantId: string }>;
}

export default function CustomerMenuPage({ params }: PageProps) {
  const { restaurantId } = use(params);

  return (
    <>
      {/* Hydrate le store Zustand depuis Supabase via Server Action */}
      <MenuInitializer slug={restaurantId} />
      <CustomerMenuPageContent restaurantId={restaurantId} />
    </>
  );
}
