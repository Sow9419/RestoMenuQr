'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect } from 'react';
import { use } from 'react';
import { RestoProvider, useResto } from '@/components/RestoContext';
import ClientMenu from '@/components/ClientMenu';
import { Coffee, SearchCode, ArrowRight, HelpCircle, Store } from 'lucide-react';
import { motion } from 'motion/react';

// Wrapper component to access context hooks under RestoProvider
function CustomerMenuPageContent({ slug }: { slug: string }) {
  const { config, isLoading } = useResto();

  // If loading metadata
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <div className="w-10 h-10 rounded-xl bg-rose-600 animate-spin flex items-center justify-center mb-4">
          <Coffee className="text-white" size={18} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Chargement du menu...</span>
      </div>
    );
  }

  // Check URL Slug matching Config Slug - UC-001 / ERR_MENU_NOT_FOUND
  const isSlugValid = config?.slug && config.slug.toLowerCase() === slug.toLowerCase();

  if (!isSlugValid) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 font-sans select-none">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-550 flex items-center justify-center mb-6 border border-red-500/10">
          <SearchCode size={30} />
        </div>

        <div className="space-y-2 max-w-sm">
          <span className="text-[10px] font-black tracking-widest text-[#ef4444] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/10">
            ❌ ERR_MENU_NOT_FOUND
          </span>
          <h1 className="text-2xl font-black text-white px-2">Menu Introuvable</h1>
          <p className="text-xs text-slate-500 leading-relaxed font-light">
            {"Le QR code ou le lien de restaurant auquel vous tentez d'accéder n'existe pas ou le menu associé a été dé-publié par le restaurateur."}
          </p>
        </div>

        {/* Suggestion to view the main active shop */}
        {config?.slug && (
          <div className="mt-8 space-y-3">
            <p className="text-[10px] text-slate-650 italic">{"Voulez-vous visiter l'établissement témoin ?"}</p>
            <a
              href={`/${config.slug}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 text-white text-xs font-semibold hover:opacity-95 shadow transition-all"
            >
              <Store size={14} />
              Accéder au menu de : {config.name}
              <ArrowRight size={13} />
            </a>
          </div>
        )}
      </div>
    );
  }

  // Display menu client
  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-between">
      <div className="w-full max-w-md h-full bg-slate-900 border-x border-slate-900 overflow-hidden shadow-2xl relative">
        <ClientMenu isPreview={false} />
      </div>
    </div>
  );
}

// NextJS Page Route mapping Params
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CustomerMenuPage({ params }: PageProps) {
  // Unwrap params using React.use() wrapper to comply with Next.js 15 requirements
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  return (
    <RestoProvider>
      <CustomerMenuPageContent slug={slug} />
    </RestoProvider>
  );
}
