'use server';

import { getSupabaseServerClient } from '@/shared/lib/supabaseServer';
import { ActionResponse } from '@/shared/types/action';
import { RestaurantConfig, RestaurantSection, RestaurantStyle, MenuCategory, MenuItem } from '@/lib/restoTypes';

const DEFAULT_STYLE: RestaurantStyle = {
  displayMode: 'light',
  accentColor: '#C2410C',
  fontFamily: 'Playfair Display',
  heroBannerUrl: '',
  heroTitle: '',
  heroDescription: '',
  density: 'confortable',
  backgroundImageUrl: 'slate',
  overlayOpacity: 40,
  glassmorphism: false,
  showCategoryIcons: true,
  currency: 'FCFA',
};

const DEFAULT_SECTIONS: RestaurantSection[] = [
  { id: 'hero', name: 'hero', label: 'Bannière Hero', enabled: true },
  { id: 'categories', name: 'categories', label: 'Catégories', enabled: true },
  { id: 'menu', name: 'menu', label: 'Menu', enabled: true },
];

/**
 * Charge la configuration complète d'un restaurant par son slug.
 * Utilisé par la page publique [slug] côté client (via MenuInitializer).
 */
export async function getRestaurantConfigBySlug(
  slug: string
): Promise<ActionResponse<RestaurantConfig>> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('id, slug, name, phone, address, is_open')
      .eq('slug', slug.toLowerCase())
      .maybeSingle();

    if (restError || !restaurant) {
      return { success: false, error: { code: 'ERR_MENU_NOT_FOUND', message: 'Restaurant introuvable.' } };
    }

    // Load page settings (style)
    const { data: pageSettings } = await supabase
      .from('page_settings')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .maybeSingle();

    // Load sections
    const { data: sectionsData } = await supabase
      .from('page_sections')
      .select('section_key, label, is_enabled, sort_order')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order');

    // Load categories
    const { data: categoriesData, error: catError } = await supabase
      .from('categories')
      .select('id, name, icon, sort_order')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order');

    if (catError) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: catError.message } };
    }

    // Load products
    const categoryIds = (categoriesData || []).map((c) => c.id);
    let itemsData: any[] = [];
    if (categoryIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, category_id, name, description, price, image_url, is_available, sales_count, sort_order')
        .in('category_id', categoryIds)
        .order('sort_order');
      itemsData = products || [];
    }

    // Map style
    const style: RestaurantStyle = pageSettings
      ? {
          displayMode: (pageSettings.display_mode as 'light' | 'dark' | 'system') || DEFAULT_STYLE.displayMode,
          accentColor: pageSettings.accent_color || DEFAULT_STYLE.accentColor,
          fontFamily: pageSettings.font_family || DEFAULT_STYLE.fontFamily,
          heroBannerUrl: pageSettings.hero_banner_url || DEFAULT_STYLE.heroBannerUrl,
          heroTitle: pageSettings.hero_title || DEFAULT_STYLE.heroTitle,
          heroDescription: pageSettings.hero_description || DEFAULT_STYLE.heroDescription,
          density: (pageSettings.density as 'compact' | 'confortable') || DEFAULT_STYLE.density,
          backgroundImageUrl: pageSettings.background_image_url || DEFAULT_STYLE.backgroundImageUrl,
          overlayOpacity: pageSettings.overlay_opacity ?? DEFAULT_STYLE.overlayOpacity,
          glassmorphism: pageSettings.glassmorphism ?? DEFAULT_STYLE.glassmorphism,
          showCategoryIcons: pageSettings.show_category_icons ?? DEFAULT_STYLE.showCategoryIcons,
          currency: pageSettings.currency || DEFAULT_STYLE.currency,
        }
      : DEFAULT_STYLE;

    // Map sections
    const sections: RestaurantSection[] =
      sectionsData && sectionsData.length > 0
        ? sectionsData.map((s) => ({
            id: s.section_key,
            name: s.section_key,
            label: s.label,
            enabled: s.is_enabled,
          }))
        : DEFAULT_SECTIONS;

    // Map categories
    const categories: MenuCategory[] = (categoriesData || []).map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || 'Utensils',
      order: c.sort_order,
    }));

    // Map items
    const items: MenuItem[] = itemsData.map((p) => ({
      id: p.id,
      categoryId: p.category_id,
      name: p.name,
      description: p.description || '',
      price: Number(p.price),
      imageUrl: p.image_url || '',
      isAvailable: p.is_available,
      salesCount: p.sales_count || 0,
    }));

    const config: RestaurantConfig = {
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
      phone: restaurant.phone || '',
      address: restaurant.address || '',
      isOpen: restaurant.is_open,
      style,
      sections,
      categories,
      items,
    };

    return { success: true, data: config };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}

/**
 * Charge la configuration complète d'un restaurant par son ID.
 * Utilisé par l'admin layout (MenuInitializer côté admin).
 */
export async function getRestaurantConfigById(
  restaurantId: string
): Promise<ActionResponse<RestaurantConfig>> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('id, slug, name, phone, address, is_open')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restError || !restaurant) {
      return { success: false, error: { code: 'ERR_MENU_NOT_FOUND', message: 'Restaurant introuvable.' } };
    }

    // Delegate to the same logic via slug resolution
    return getRestaurantConfigBySlug(restaurant.slug);
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}
