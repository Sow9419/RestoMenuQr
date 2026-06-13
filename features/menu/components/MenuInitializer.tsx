'use client';

import { useEffect, useRef } from 'react';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { getRestaurantConfigBySlug, getRestaurantConfigById } from '@/features/menu/actions/getRestaurantConfig';

interface MenuInitializerProps {
  /** Initialise depuis le slug public (page [slug]) */
  slug?: string;
  /** Initialise depuis l'ID admin (layout admin) */
  restaurantId?: string;
}

/**
 * Composant invisible qui hydrate le store Zustand `useMenuStore`
 * en appelant la Server Action au premier montage.
 *
 * Règle : un seul de { slug | restaurantId } doit être fourni.
 * Ne re-fetch pas si le config est déjà chargé pour le même identifiant.
 */
export default function MenuInitializer({ slug, restaurantId }: MenuInitializerProps) {
  const { setConfig, setLoading, setError, config } = useMenuStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Évite double initialisation (StrictMode)
    if (initialized.current) return;

    // Évite re-fetch si config déjà chargée pour le même restaurant
    if (config) {
      if (slug && config.slug === slug) return;
      if (restaurantId && config.id === restaurantId) return;
    }

    initialized.current = true;
    setLoading(true);

    const load = async () => {
      try {
        let result;
        if (slug) {
          result = await getRestaurantConfigBySlug(slug);
        } else if (restaurantId) {
          result = await getRestaurantConfigById(restaurantId);
        } else {
          setError('MenuInitializer: aucun identifiant fourni (slug ou restaurantId requis).');
          return;
        }

        if (result.success) {
          setConfig(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (err: any) {
        setError(err?.message || 'Erreur de chargement de la configuration.');
      }
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, restaurantId]);

  // Composant purement side-effect — ne rend rien
  return null;
}
