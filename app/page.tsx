import React from 'react';
import { getSupabaseServerClient } from '@/shared/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { Database, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Route racine `/` — Redirige vers la destination correcte selon l'état auth.
 * - Non authentifié → /login (intercepté aussi par middleware)
 * - Authentifié sans restaurant → /onboarding
 * - Authentifié avec restaurant → /[restaurantId]/builder
 * 
 * En cas de configuration Supabase absente ou incomplète (par exemple, lors de la première compilation),
 * affiche une interface soignée guidant le déploiement plutôt que de faire crasher le serveur.
 */
export default async function RootPage() {
  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch (error) {
    // Rendement résilient en cas de variables d'environnement manquantes ou invalides
    return (
      <div className="min-h-screen w-screen bg-[#FAFAF9] flex items-center justify-center p-6 text-stone-900 font-sans relative overflow-hidden">
        {/* Background Subtle Gradient */}
        <div className="absolute inset-0 bg-radial-at-t from-[#FED7AA]/40 via-transparent to-transparent pointer-events-none" />
        
        <div className="w-full max-w-lg bg-white border border-[#E7E5E4] rounded-3xl p-8 md:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C2410C]">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mt-2">
              Service en cours d&apos;activation
            </h1>
            <p className="text-sm text-stone-500 leading-relaxed">
              Notre service de cartes digitales et de menus interactifs est en cours de configuration de sécurité et d&apos;initialisation. 
            </p>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3 text-stone-700">
            <AlertCircle className="w-5 h-5 text-[#C2410C] shrink-0 mt-0.5" />
            <div className="text-xs leading-normal">
              La plateforme s&apos;activera automatiquement dès que l&apos;initialisation de sécurité sera finalisée. Merci de repasser dans quelques instants.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Trouver le restaurant de l'utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .not('restaurant_id', 'is', null)
    .single();

  if (profile?.restaurant_id) {
    redirect(`/${profile.restaurant_id}/builder`);
  }

  redirect('/onboarding');
}
