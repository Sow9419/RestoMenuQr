'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/shared/lib/supabase';
import { createRestaurantWithOrg } from '@/features/onboarding/actions/onboardingActions';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles, UtensilsCrossed, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check auth on load
  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login?redirect=/onboarding');
        } else {
          setUserId(user.id);
        }
      } catch (err) {
        console.error('Error checking auth', err);
        router.push('/login?redirect=/onboarding');
      } finally {
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, [router]);

  // Autogenerate slug from restaurant name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    
    // Auto generate clean slug
    const generatedSlug = value
      .toLowerCase()
      .normalize('NFD') // remove accents
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '') // remove special chars
      .trim()
      .replace(/\s+/g, '-') // spaces to hyphens
      .replace(/-+/g, '-'); // collapse multiple hyphens
    
    setSlug(generatedSlug);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');
    setSlug(cleanValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !userId) {
      setErrorMsg('Veuillez remplir les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await createRestaurantWithOrg(userId, {
      name,
      slug,
      phone: phone || undefined,
      address: address || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Votre restaurant et son espace ont été créés avec succès !');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } else {
      setErrorMsg(res.error?.message || 'Une erreur est survenue lors de la création.');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-screen bg-[#FAFAF9] flex items-center justify-center text-stone-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C2410C]" />
          <p className="text-sm text-stone-500">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#FAFAF9] flex items-center justify-center p-6 text-stone-900 font-sans relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-radial-at-t from-[#F5F5F4]/40 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-lg bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] relative z-10">
        
        {/* Step Indicator */}
        <div className="flex items-center gap-1 text-xs font-semibold text-[#C2410C] tracking-wide uppercase mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Étape Finale d'Onboarding</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-stone-950 font-serif mb-2">
          Créez votre premier restaurant
        </h1>
        <p className="text-stone-500 text-sm mb-8 leading-relaxed">
          Saisissez les informations clés pour modéliser votre menu numérique interactif et votre espace d'encaissement unifié.
        </p>

        {/* Global Notifications */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 mb-6"
              id="onboarding-error-banner"
            >
              {errorMsg}
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2 mb-6"
              id="onboarding-success-banner"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            {/* Restaurant Name */}
            <div>
              <label htmlFor="restaurant-name" className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
                Nom du Restaurant *
              </label>
              <input
                id="restaurant-name"
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="Le Palais du Chef"
                className="w-full h-11 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-[#C2410C] focus:bg-white transition"
              />
            </div>

            {/* Custom Slug / URL Link */}
            <div>
              <label htmlFor="restaurant-slug" className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
                Lien personnalisé du Menu *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-stone-400 font-mono select-none">
                  qrmenu.pro/
                </span>
                <input
                  id="restaurant-slug"
                  type="text"
                  required
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="le-palais-du-chef"
                  className="w-full h-11 pl-[90px] pr-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm font-mono focus:outline-none focus:border-[#C2410C] focus:bg-white transition"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1.5 leading-normal">
                C'est l'adresse unique que vos clients scanneront pour accéder directement à votre carte de plats.
              </p>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="restaurant-phone" className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
                  Numéro de Téléphone (Optionnel)
                </label>
                <input
                  id="restaurant-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221770000000"
                  className="w-full h-11 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-[#C2410C] focus:bg-white transition"
                />
              </div>

              <div>
                <label htmlFor="restaurant-address" className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
                  Adresse Physique (Optionnel)
                </label>
                <input
                  id="restaurant-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dakar, Sénégal"
                  className="w-full h-11 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-[#C2410C] focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <button
            id="btn-submit-onboarding"
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-stone-900 hover:bg-[#C2410C] text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création en cours de votre espace...
              </>
            ) : (
              <>
                <span>Créer et Accéder à mon Espace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
