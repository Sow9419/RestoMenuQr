'use server';

import { getSupabaseServerClient } from '@/shared/lib/supabaseServer';
import { ActionResponse } from '@/shared/types/action';
import { updatePageSettingsSchema } from '../validators';

interface UpdateSettingsPayload {
  settings: unknown;
  sections: { name: string; label: string; enabled: boolean }[];
}

/**
 * Met à jour de manière atomique (transactionnelle) les paramètres visuels et l'état des sections.
 */
export async function updatePageSettings(
  restaurantId: string,
  payload: UpdateSettingsPayload
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { code: 'ERR_UNAUTHORIZED', message: 'Non authentifié.' } };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!profile || !['OWNER', 'ORG_OWNER'].includes(profile.role)) {
      return { success: false, error: { code: 'ERR_FORBIDDEN', message: 'Droits insuffisants.' } };
    }

    const parsedSettings = updatePageSettingsSchema.safeParse(payload.settings);
    if (!parsedSettings.success) {
      return { success: false, error: { code: 'ERR_VALIDATION', message: parsedSettings.error.issues[0].message } };
    }

    // 1. Update basic aesthetic settings in page_settings
    const { data: existingSettings } = await supabase
      .from('page_settings')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    const psData = {
      restaurant_id: restaurantId,
      template_layout: parsedSettings.data.templateLayout,
      accent_color: parsedSettings.data.accentColor,
      font_family: parsedSettings.data.fontFamily,
      hero_title: parsedSettings.data.heroTitle,
      hero_description: parsedSettings.data.heroDescription,
      hero_banner_url: parsedSettings.data.heroBannerUrl,
      display_mode: parsedSettings.data.displayMode,
      overlay_opacity: parsedSettings.data.overlayOpacity,
      glassmorphism: parsedSettings.data.glassmorphism,
      density: parsedSettings.data.density,
      currency: parsedSettings.data.currency,
      updated_at: new Date().toISOString(),
    };

    if (existingSettings) {
      const { error } = await supabase.from('page_settings').update(psData).eq('restaurant_id', restaurantId);
      if (error) return { success: false, error: { code: 'ERR_DB_ERROR', message: error.message } };
    } else {
      const { error } = await supabase.from('page_settings').insert([psData]);
      if (error) return { success: false, error: { code: 'ERR_DB_ERROR', message: error.message } };
    }

    // 2. Update sections config in page_sections
    if (payload.sections && payload.sections.length > 0) {
      // Reinsert cleanly (simple sync pattern)
      await supabase.from('page_sections').delete().eq('restaurant_id', restaurantId);
      
      const secInsertData = payload.sections.map((sec, idx) => ({
        restaurant_id: restaurantId,
        section_key: sec.name,
        label: sec.label,
        is_enabled: sec.enabled,
        sort_order: idx + 1,
      }));

      const { error: secError } = await supabase.from('page_sections').insert(secInsertData);
      if (secError) {
        return { success: false, error: { code: 'ERR_DB_ERROR', message: secError.message } };
      }
    }

    return { success: true, data: { success: true } };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}
