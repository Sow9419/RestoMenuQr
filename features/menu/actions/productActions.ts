'use server';

import { getSupabaseServerClient } from '@/shared/lib/supabaseServer';
import { ActionResponse } from '@/shared/types/action';
import { MenuItem } from '@/lib/restoTypes';
import { createProductSchema, updateProductSchema } from '../validators';

/**
 * Crée un produit.
 */
export async function createProduct(
  restaurantId: string,
  payload: unknown
): Promise<ActionResponse<MenuItem>> {
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

    const parsed = createProductSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: { code: 'ERR_VALIDATION', message: parsed.error.issues[0].message } };
    }

    // Verify category belongs to this restaurant
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('id', parsed.data.categoryId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!cat) {
      return { success: false, error: { code: 'ERR_VALIDATION', message: 'Catégorie introuvable pour ce restaurant.' } };
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        category_id: parsed.data.categoryId,
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        image_url: parsed.data.imageUrl || null,
        is_available: parsed.data.isAvailable,
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
        categoryId: data.category_id,
        name: data.name,
        description: data.description || '',
        price: Number(data.price),
        imageUrl: data.image_url || '',
        isAvailable: data.is_available,
        salesCount: data.sales_count || 0,
      },
    };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}

/**
 * Met à jour un produit existant.
 */
export async function updateProduct(
  restaurantId: string,
  productId: string,
  payload: unknown
): Promise<ActionResponse<MenuItem>> {
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

    const parsed = updateProductSchema.safeParse({ ...((payload as any) || {}), id: productId });
    if (!parsed.success) {
      return { success: false, error: { code: 'ERR_VALIDATION', message: parsed.error.issues[0].message } };
    }

    // Verify product belongs to a category of this restaurant
    const { data: prodCheck } = await supabase
      .from('products')
      .select('*, categories!inner(restaurant_id)')
      .eq('id', productId)
      .eq('categories.restaurant_id', restaurantId)
      .maybeSingle();

    if (!prodCheck) {
      return { success: false, error: { code: 'ERR_FORBIDDEN', message: 'Accès interdit ou produit introuvable.' } };
    }

    const updateData: any = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.price !== undefined) updateData.price = parsed.data.price;
    if (parsed.data.imageUrl !== undefined) updateData.image_url = parsed.data.imageUrl || null;
    if (parsed.data.isAvailable !== undefined) updateData.is_available = parsed.data.isAvailable;
    if (parsed.data.sortOrder !== undefined) updateData.sort_order = parsed.data.sortOrder;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: error.message } };
    }

    return {
      success: true,
      data: {
        id: data.id,
        categoryId: data.category_id,
        name: data.name,
        description: data.description || '',
        price: Number(data.price),
        imageUrl: data.image_url || '',
        isAvailable: data.is_available,
        salesCount: data.sales_count || 0,
      },
    };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}

/**
 * Supprime un produit.
 */
export async function deleteProduct(
  restaurantId: string,
  productId: string
): Promise<ActionResponse<{ deletedId: string }>> {
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

    const { data: prodCheck } = await supabase
      .from('products')
      .select('id, categories!inner(restaurant_id)')
      .eq('id', productId)
      .eq('categories.restaurant_id', restaurantId)
      .maybeSingle();

    if (!prodCheck) {
      return { success: false, error: { code: 'ERR_FORBIDDEN', message: 'Accès interdit ou produit introuvable.' } };
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: error.message } };
    }

    return { success: true, data: { deletedId: productId } };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}
