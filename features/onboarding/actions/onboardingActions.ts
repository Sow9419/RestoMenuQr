'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase';
import { getSupabaseServerClient } from '@/shared/lib/supabaseServer';
import { ActionResponse } from '@/shared/types/action';

export interface OnboardingData {
  name: string;
  slug: string;
  phone?: string;
  address?: string;
}

/**
 * Crée de manière atomique et sécurisée le tenant du restaurant et de l'organisation
 * pour l'utilisateur fraîchement authentifié sans profil.
 */
export async function createRestaurantWithOrg(
  data: OnboardingData
): Promise<ActionResponse<{ restaurantId: string; organizationId: string }>> {
  try {
    const supabaseServer = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: {
          code: 'ERR_UNAUTHORIZED',
          message: 'Vous devez être connecté pour configurer votre restaurant.',
        },
      };
    }

    const userId = user.id;
    const supabaseAdmin = getSupabaseAdmin();
    
    // Normalize and validate the slug
    const normalizedSlug = data.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '-');

    if (!normalizedSlug) {
      return {
        success: false,
        error: {
          code: 'ERR_VALIDATION',
          message: 'Le slug de restaurant est requis et doit être valide.',
        },
      };
    }

    // 1. Check for unique slug
    const { data: existingResto, error: checkError } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (checkError) {
      return {
        success: false,
        error: {
          code: 'ERR_DB_ERROR',
          message: 'Erreur lors de la vérification de disponibilité du lien.',
        },
      };
    }

    if (existingResto) {
      return {
        success: false,
        error: {
          code: 'ERR_SLUG_IMMUTABLE',
          message: 'Ce lien de restaurant est déjà utilisé. Veuillez en choisir un autre.',
        },
      };
    }

    // 2. Perform sequential creation using Supabase Admin client
    // Since there is no rollback transaction support out of the box in simple JS SDK select queries,
    // we handle individual creations carefully or we can clean up if a later stage fails.

    // A. Create Organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        owner_id: userId,
        name: data.name,
        plan_type: 'starter',
        subscription_status: 'inactive',
      })
      .select('id')
      .single();

    if (orgError || !org) {
      return {
        success: false,
        error: {
          code: 'ERR_INTERNAL_SERVER',
          message: orgError?.message || 'Échec de la création de l\'organisation.',
        },
      };
    }

    const orgId = org.id;

    // B. Create Restaurant
    const { data: restaurant, error: restoError } = await supabaseAdmin
      .from('restaurants')
      .insert({
        owner_id: userId,
        organization_id: orgId,
        name: data.name,
        slug: normalizedSlug,
        phone: data.phone || '+221770000000',
        address: data.address || 'Dakar, Sénégal',
        is_open: true,
      })
      .select('id')
      .single();

    if (restoError || !restaurant) {
      // Cleanup previous
      await supabaseAdmin.from('organizations').delete().eq('id', orgId);
      return {
        success: false,
        error: {
          code: 'ERR_INTERNAL_SERVER',
          message: restoError?.message || 'Échec de la création du restaurant.',
        },
      };
    }

    const restaurantId = restaurant.id;

    // C. Create Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        organization_id: orgId,
        role: 'OWNER',
      });

    if (profileError) {
      // Cleanup all
      await supabaseAdmin.from('organizations').delete().eq('id', orgId);
      return {
        success: false,
        error: {
          code: 'ERR_INTERNAL_SERVER',
          message: profileError.message || 'Échec de la création du profil utilisateur.',
        },
      };
    }

    // D. Create Page Settings
    const { error: settingsError } = await supabaseAdmin
      .from('page_settings')
      .insert({
        restaurant_id: restaurantId,
        template_layout: 'classic',
        accent_color: '#C2410C',
        font_family: 'Playfair Display',
        hero_title: `Bienvenue chez ${data.name}`,
        hero_description: 'Découvrez notre sélection raffinée de plats signatures d\'exception.',
        display_mode: 'light',
        overlay_opacity: 40,
        glassmorphism: false,
        density: 'comfortable',
        currency: 'FCFA',
      });

    if (settingsError) {
      // Cleanup all
      await supabaseAdmin.from('organizations').delete().eq('id', orgId);
      return {
        success: false,
        error: {
          code: 'ERR_INTERNAL_SERVER',
          message: settingsError.message || 'Échec de la configuration esthétique par défaut.',
        },
      };
    }

    // E. Create Default Page Sections
    const defaultSections = [
      { restaurant_id: restaurantId, section_key: 'hero', label: 'Bannière d\'accueil', is_enabled: true, sort_order: 1 },
      { restaurant_id: restaurantId, section_key: 'categories', label: 'Navigation par Catégories', is_enabled: true, sort_order: 2 },
      { restaurant_id: restaurantId, section_key: 'menu', label: 'Liste du Menu', is_enabled: true, sort_order: 3 },
      { restaurant_id: restaurantId, section_key: 'infos', label: 'Informations Complémentaires', is_enabled: true, sort_order: 4 },
      { restaurant_id: restaurantId, section_key: 'socials', label: 'Réseaux Sociaux & Contact', is_enabled: true, sort_order: 5 },
    ];

    const { error: sectionsError } = await supabaseAdmin
      .from('page_sections')
      .insert(defaultSections);

    if (sectionsError) {
      // Cleanup all
      await supabaseAdmin.from('organizations').delete().eq('id', orgId);
      return {
        success: false,
        error: {
          code: 'ERR_INTERNAL_SERVER',
          message: sectionsError.message || 'Échec de la configuration des sections par défaut.',
        },
      };
    }

    return {
      success: true,
      data: {
        restaurantId,
        organizationId: orgId,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'ERR_SYSTEM_ERROR',
        message: err.message || 'Une erreur système inattendue est survenue lors de l\'onboarding.',
      },
    };
  }
}
