import { create } from 'zustand';
import { RestaurantConfig, MenuCategory, MenuItem, RestaurantSection, RestaurantStyle } from '@/lib/restoTypes';

interface MenuState {
  config: RestaurantConfig | null;
  isLoading: boolean;
  error: string | null;
  setConfig: (config: RestaurantConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Local optimistic edits helpers
  updateStyle: (style: Partial<RestaurantStyle>) => void;
  updateSections: (sections: RestaurantSection[]) => void;
  updateCategories: (categories: MenuCategory[]) => void;
  updateItems: (items: MenuItem[]) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  config: null,
  isLoading: true,
  error: null,

  setConfig: (config) => set({ config, isLoading: false, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),

  updateStyle: (styleUpdates) => set((state) => {
    if (!state.config) return {};
    return {
      config: {
        ...state.config,
        style: {
          ...state.config.style,
          ...styleUpdates,
        },
      },
    };
  }),

  updateSections: (sections) => set((state) => {
    if (!state.config) return {};
    return {
      config: {
        ...state.config,
        sections,
      },
    };
  }),

  updateCategories: (categories) => set((state) => {
    if (!state.config) return {};
    return {
      config: {
        ...state.config,
        categories,
      },
    };
  }),

  updateItems: (items) => set((state) => {
    if (!state.config) return {};
    return {
      config: {
        ...state.config,
        items,
      },
    };
  }),
}));
