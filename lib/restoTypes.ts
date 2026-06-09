export interface RestaurantSection {
  id: string;
  name: string;
  label: string;
  enabled: boolean;
}

export type DisplayMode = 'light' | 'dark' | 'system';

export type MenuDensity = 'compact' | 'confortable';

export interface RestaurantStyle {
  displayMode: DisplayMode;
  accentColor: string;
  fontFamily: string;
  heroBannerUrl: string;
  heroTitle: string;
  heroDescription: string;
  density: MenuDensity;
  backgroundImageUrl: string;
  overlayOpacity: number; // 0 to 100
  glassmorphism: boolean;
  showCategoryIcons: boolean;
  currency: string; // e.g. "FCFA" or "€"
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
  icon: string; // lucide icon name
  order: number;
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type OrderType = 'DINE_IN' | 'DELIVERY';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  ticketNumber: string; // e.g. #A12
  createdAt: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  totalPrice: number;
  restaurantSlug: string;
  // Delivery details
  whatsappNumber?: string;
  customerName?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
}

export interface RestaurantConfig {
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
  orders: Order[];
}
