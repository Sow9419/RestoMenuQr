'use server';

import { getSupabase, getSupabaseAdmin } from '@/shared/lib/supabase';
import { ActionResponse } from '@/shared/types/action';

/**
 * Envoie un code de vérification OTP par courriel à l'adresse fournie.
 */
export async function sendEmailOTP(email: string): Promise<ActionResponse<{ sent: boolean }>> {
  try {
    const supabase = getSupabase();
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        success: false,
        error: {
          code: 'ERR_OTP_SEND_FAILED',
          message: error.message,
        },
      };
    }

    return {
      success: true,
      data: { sent: true },
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'ERR_SYSTEM_ERROR',
        message: err.message || 'Une erreur système inattendue est survenue.',
      },
    };
  }
}

/**
 * Vérifie le code OTP de 6 chiffres saisi par l'utilisateur.
 * Vérifie également si un profil utilisateur ou un restaurant est déjà associé.
 */
export async function verifyEmailOTP(
  email: string,
  token: string
): Promise<
  ActionResponse<{
    verified: boolean;
    userId: string;
    hasProfile: boolean;
    restaurantId: string | null;
    organizationId: string | null;
  }>
> {
  try {
    const supabase = getSupabase();
    
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: {
          code: 'ERR_OTP_INVALID',
          message: authError?.message || 'Le code saisi est incorrect ou a expiré.',
        },
      };
    }

    const userId = authData.user.id;

    // Use admin client to check for base profiles to guarantee bypass of any premature RLS restrictions
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('restaurant_id, organization_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      return {
        success: false,
        error: {
          code: 'ERR_DB_ERROR',
          message: 'Impossible de récupérer le profil utilisateur.',
        },
      };
    }

    return {
      success: true,
      data: {
        verified: true,
        userId,
        hasProfile: !!profile,
        restaurantId: profile?.restaurant_id || null,
        organizationId: profile?.organization_id || null,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'ERR_SYSTEM_ERROR',
        message: err.message || 'Une erreur système inattendue est survenue.',
      },
    };
  }
}
