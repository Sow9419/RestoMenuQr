import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from '@/features/menu/types';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  available: boolean;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: MenuItem, isOpen: boolean) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  syncAvailability: (menuItems: MenuItem[], isOpen: boolean) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalQuantity: () => number;
  isCartValid: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item, isOpen) => {
        if (!item.isAvailable || !isOpen) return;

        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                available: true,
              },
            ],
          };
        });
      },

      removeFromCart: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },

      updateQuantity: (itemId, delta) => {
        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.id === itemId) {
                const nextQty = i.quantity + delta;
                return nextQty > 0 ? { ...i, quantity: nextQty } : null;
              }
              return i;
            })
            .filter((i): i is CartItem => i !== null),
        }));
      },

      syncAvailability: (menuItems, isOpen) => {
        set((state) => ({
          items: state.items.map((cartItem) => {
            const dbItem = menuItems.find((mi) => mi.id === cartItem.id);
            return {
              ...cartItem,
              available: dbItem ? (dbItem.isAvailable && isOpen) : false,
            };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => {
          return item.available ? sum + item.price * item.quantity : sum;
        }, 0);
      },

      getTotalQuantity: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      isCartValid: () => {
        const items = get().items;
        return items.length > 0 && items.every((i) => i.available);
      },
    }),
    {
      name: 'qrmenu-cart-storage',
    }
  )
);
