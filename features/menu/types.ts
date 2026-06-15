export interface RestaurantSection {
  id: string;
  name: string;
  label: string;
  enabled: boolean;
  section_key?: string;
}

export type DisplayMode = 'light' | 'dark' | 'system';

export type MenuDensity = 'compact' | 'comfortable';

export interface RestaurantStyle {
  templateLayout: 'classic' | 'card-grid' | 'premium';
  displayMode: DisplayMode;
  accentColor: string;
  fontFamily: string;
  heroBannerUrl: string;
  heroTitle: string;
  heroDescription: string;
  density: MenuDensity;
  backgroundImageUrl: string;
  overlayOpacity: number;
  glassmorphism: boolean;
  showCategoryIcons: boolean;
  currency: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  salesCount: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface RestaurantConfig {
  id?: string;
  slug: string;
  name: string;
  phone: string;
  address: string;
  isOpen: boolean;
  sections: RestaurantSection[];
  style: RestaurantStyle;
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface SyncData {
  config: RestaurantConfig;
  orders: import('@/features/order/types').Order[];
}
