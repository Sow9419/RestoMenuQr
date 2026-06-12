'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendEmailOTP, verifyEmailOTP } from '@/features/auth/actions/authActions';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await sendEmailOTP(email);
    setIsSubmitting(false);

    if (res.success) {
      setStep('otp');
      setSuccessMsg(`Un code de vérification a été envoyé à ${email}.`);
    } else {
      setErrorMsg(res.error?.message || 'Impossible d\'envoyer le code de connexion.');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg('Veuillez saisir un code à 6 chiffres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await verifyEmailOTP(email, otpCode);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setSuccessMsg('Connexion réussie ! Redirection...');
      
      // Stock local session state ou reload pour que le middleware voie le cookie
      if (res.data.hasProfile && res.data.restaurantId) {
        // Déjà onboarded: rediriger vers l'admin ou le path d'origine
        router.push(redirectPath);
      } else {
        // Non onboarded: rediriger vers /onboarding
        router.push('/onboarding');
      }
    } else {
      setErrorMsg(res.error?.message || 'Le code saisi est invalide.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#FAFAF9] flex items-center justify-center p-6 text-stone-900 font-sans relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-radial-at-t from-[#F5F5F4]/40 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] relative z-10">
        
        {/* Brand/Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 bg-[#C2410C]/5 rounded-xl flex items-center justify-center text-[#C2410C] mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 font-serif">
            QRMenu Pro
          </h1>
          <p className="text-sm text-stone-500 mt-1.5">
            L'espace d'administration et d'expérience de commande
          </p>
        </div>

        {/* Global Notifications */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 mb-6"
              id="auth-error-banner"
            >
              {errorMsg}
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 mb-6"
              id="auth-success-banner"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label htmlFor="email-input" className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wider">
                Adresse e-mail professionnelle
              </label>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@restaurant.com"
                className="w-full h-11 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-[#C2410C] focus:bg-white transition"
              />
            </div>

            <button
              id="btn-send-otp"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-stone-900 hover:bg-[#C2410C] text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Recevoir mon code OTP'
              )}
            </button>
            
            <p className="text-center text-xs text-stone-400 mt-4">
              Aucun mot de passe requis. Nous vous enverrons un code de connexion unique par e-mail.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 mb-4 transition focus:outline-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                D'accord, utiliser une autre adresse
              </button>
              
              <label htmlFor="otp-input" className="block text-xs font-medium text-stone-600 mb-1.5 uppercase tracking-wider">
                Code de vérification (6 chiffres)
              </label>
              <input
                id="otp-input"
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full h-11 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-[#C2410C] focus:bg-white transition"
              />
            </div>

            <button
              id="btn-verify-otp"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-stone-900 hover:bg-[#C2410C] text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Valider et se connecter'
              )}
            </button>
            
            <p className="text-center text-xs text-stone-400 mt-4">
              Veuillez saisir les 6 chiffres reçus par email à l'adresse <strong>{email}</strong>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
