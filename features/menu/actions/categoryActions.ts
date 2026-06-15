'use server';

import { getSupabaseServerClient } from '@/shared/lib/supabaseServer';
import { getSupabaseAdmin } from '@/shared/lib/supabase';
import { ActionResponse } from '@/shared/types/action';
import { MenuCategory } from '@/features/menu/types';
import { createCategorySchema, updateCategorySchema } from '../validators';

/**
 * Crée une catégorie dans le menu du restaurant cible.
 * Restreint aux profils OWNER ou ORG_OWNER rattachés au restaurant.
 */
export async function createCategory(
  restaurantId: string,
  name: string
): Promise<ActionResponse<MenuCategory>> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: { code: 'ERR_UNAUTHORIZED', message: 'Non authentifié.' } };
    }

    // Check staff permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!profile || !['OWNER', 'ORG_OWNER'].includes(profile.role)) {
      return { success: false, error: { code: 'ERR_FORBIDDEN', message: 'Droits insuffisants (OWNER requis).' } };
    }

    // Validate payload
    const parsed = createCategorySchema.safeParse({ name });
    if (!parsed.success) {
      return { success: false, error: { code: 'ERR_VALIDATION', message: parsed.error.issues[0].message } };
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        restaurant_id: restaurantId,
        name: parsed.data.name,
        icon: parsed.data.icon,
        sort_order: parsed.data.sortOrder,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: error.message } };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        icon: data.icon,
        order: data.sort_order,
      },
    };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}

/**
 * Met à jour une catégorie existante.
 */
export async function updateCategory(
  restaurantId: string,
  categoryId: string,
  name: string,
  sortOrder?: number
): Promise<ActionResponse<MenuCategory>> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { code: 'ERR_UNAUTHORIZED', message: 'Non authentifié.' } };
    }

    // Check staff permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!profile || !['OWNER', 'ORG_OWNER'].includes(profile.role)) {
      return { success: false, error: { code: 'ERR_FORBIDDEN', message: 'Droits insuffisants.' } };
    }

    const parsed = updateCategorySchema.safeParse({ id: categoryId, name, sortOrder });
    if (!parsed.success) {
      return { success: false, error: { code: 'ERR_VALIDATION', message: parsed.error.issues[0].message } };
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: parsed.data.name,
        sort_order: parsed.data.sortOrder,
      })
      .eq('id', categoryId)
      .eq('restaurant_id', restaurantId)
      .select()
      .single();

    if (error) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: error.message } };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        icon: data.icon,
        order: data.sort_order,
      },
    };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}

/**
 * Supprime une catégorie. Empêche la suppression si elle contient encore des produits.
 */
export async function deleteCategory(
  restaurantId: string,
  categoryId: string
): Promise<ActionResponse<{ deletedId: string }>> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { code: 'ERR_UNAUTHORIZED', message: 'Non authentifié.' } };
    }

    // Check staff permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!profile || !['OWNER', 'ORG_OWNER'].includes(profile.role)) {
      return { success: false, error: { code: 'ERR_FORBIDDEN', message: 'Droits insuffisants.' } };
    }

    // Check if category has products
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (countError) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: countError.message } };
    }

    if (count && count > 0) {
      return {
        success: false,
        error: {
          code: 'ERR_CATEGORY_NOT_EMPTY',
          message: 'Impossible de supprimer cette catégorie car elle contient des produits.',
        },
      };
    }

    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('restaurant_id', restaurantId);

    if (deleteError) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: deleteError.message } };
    }

    return { success: true, data: { deletedId: categoryId } };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}
