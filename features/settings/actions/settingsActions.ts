'use server';

import { getSupabaseServerClient } from '@/shared/lib/supabaseServer';
import { ActionResponse } from '@/shared/types/action';

interface UpdateRestaurantProfilePayload {
  name: string;
  phone: string;
  address: string;
  isOpen: boolean;
  currency: string;
  logoUrl?: string;
}

export async function updateRestaurantProfile(
  restaurantId: string,
  data: UpdateRestaurantProfilePayload
): Promise<ActionResponse<{ updated: boolean }>> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { code: 'ERR_UNAUTHORIZED', message: 'Non authentifie.' } };
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

    const updateData: Record<string, unknown> = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      is_open: data.isOpen,
      updated_at: new Date().toISOString(),
    };

    if (data.logoUrl !== undefined) {
      updateData.logo_url = data.logoUrl;
    }

    const { error: restoError } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', restaurantId);

    if (restoError) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: restoError.message } };
    }

    const { error: settingsError } = await supabase
      .from('page_settings')
      .update({ currency: data.currency })
      .eq('restaurant_id', restaurantId);

    if (settingsError) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: settingsError.message } };
    }

    return { success: true, data: { updated: true } };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}
