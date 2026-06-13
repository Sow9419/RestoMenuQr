import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface UIStoreState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  displayMode: 'light' | 'dark';
  setDisplayMode: (mode: 'light' | 'dark') => void;
}

/**
 * UI Store - Zustand & Persist
 * Justification d'usage Zustand local (ADR-009) :
 * Ce store gère l'état graphique volatil du client (toasts éphémères) et les préférences utilisateur
 * légères côté navigateur (displayMode). La persistance hybride via localstorage n'est utilisée
 * ICI que pour stocker temporairement le displayMode afin d'éviter le flicker au chargement,
 * ce qui constitue une exception valide aux règles de stockage persistant cloud centralisé.
 */
export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      toasts: [],
      displayMode: 'light',
      
      addToast: (message, type = 'success', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        
        set((state) => ({
          toasts: [...state.toasts, { id, message, type, duration }],
        }));

        if (duration > 0) {
          setTimeout(() => {
            set((state) => ({
              toasts: state.toasts.filter((t) => t.id !== id),
            }));
          }, duration);
        }
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      setDisplayMode: (mode) => {
        set({ displayMode: mode });
        // Set the HTML standard attribute as well for the theme-reactive CSS variables to kick in
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', mode);
        }
      },
    }),
    {
      name: 'qrmenu-ui-store',
      // Only persist selected keys (like displayMode) and omit temporary items (like toasts)
      partialize: (state) => ({
        displayMode: state.displayMode,
      }),
    }
  )
);

/**
 * Convenience hooks for component-level toast raising.
 */
export const toast = {
  success: (msg: string, duration?: number) => useUIStore.getState().addToast(msg, 'success', duration),
  error: (msg: string, duration?: number) => useUIStore.getState().addToast(msg, 'error', duration),
  warning: (msg: string, duration?: number) => useUIStore.getState().addToast(msg, 'warning', duration),
  info: (msg: string, duration?: number) => useUIStore.getState().addToast(msg, 'info', duration),
};
