# API_CONTRACTS.md

# Contrats d'API (Server Actions)

Toutes les interactions client/serveur utilisent les **Server Actions** de Next.js.
Aucune API Route `/api/...` traditionnelle ne doit être créée, à **l'unique exception** des terminaux (endpoints) destinés à une intégration tierce réclamant un appel HTTP POST nu, comme les Webhooks Stripe (ex: `app/api/webhooks/stripe/route.ts`).

## Format de Réponse Standard

Toute Server Action doit retourner une promesse typée `ActionResponse<T>` :

```typescript
type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

## Validation
Utilisation stricte de **Zod** pour valider les payloads avant toute opération de base de données.

```typescript
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  categoryId: z.string().uuid()
});
```

## Sécurité
- Vérifier l'authentification (`supabase.auth.getUser()`) dans le corps de chaque action.
- S'assurer que l'utilisateur possède l'autorisation (rôle adéquat) vis-à-vis du `restaurant_id` impacté (rattaché via `profiles.restaurant_id`).

---

## Catalogue Complet des Server Actions (Signatures de l'API)

Toutes les mutations et accès restreints passent par les fichiers Server Actions situés dans chaque feature `/features/<feature-name>/actions/`.

### 1. Feature : `menu` (`/features/menu/actions/`)
* **`createCategory(restaurantId: string, name: string): Promise<ActionResponse<MenuCategory>>`**
  * *Régles :* Interdire aux rôles autres que `OWNER`. Valider via Zod (`name.min(2)`).
* **`updateCategory(restaurantId: string, categoryId: string, name: string, sortOrder?: number): Promise<ActionResponse<MenuCategory>>`**
* **`deleteCategory(restaurantId: string, categoryId: string): Promise<ActionResponse<{ deletedId: string }>>`**
  * *Régles :* Retourne `ERR_CATEGORY_NOT_EMPTY` si la catégorie contient au moins un produit rattaché.
* **`createProduct(restaurantId: string, data: unknown): Promise<ActionResponse<Product>>`**
  * *Schéma d'entrée :* `createProductSchema` (nom, description, prix, image_url, categoryId).
* **`updateProduct(restaurantId: string, productId: string, data: unknown): Promise<ActionResponse<Product>>`**
* **`deleteProduct(restaurantId: string, productId: string): Promise<ActionResponse<{ deletedId: string }>>`**
* **`updatePageSettings(restaurantId: string, settings: unknown, sections: unknown): Promise<ActionResponse<{ settings: PageSettings; sections: PageSection[] }>>`**
  * *Schéma :* `updatePageSettingsSchema` (accent_color, font_family, hero_title, hero_description, hero_banner_url, display_mode, overlay_opacity, glassmorphism, density, template_layout) + tableau de sections ordonné.
  * *Règles :* Opération atomique : met à jour `page_settings` ET `page_sections` dans la même transaction.
  * *Cible DB :* Tables `page_settings` + `page_sections`.

### 2. Feature : `order` (`/features/order/actions/`)
* **`createOrder(restaurantId: string, orderPayload: unknown): Promise<ActionResponse<Order>>`**
  * *Régles :* Public. Le payload contient le panier complet. Retourne `ERR_ORDER_EMPTY` si panier vide, ou `ERR_CART_ITEM_UNAVAILABLE` si un produit est hors stock.
* **`updateOrderStatus(restaurantId: string, orderId: string, nextStatus: OrderStatus): Promise<ActionResponse<Order>>`**
  * *Régles :* Restreint au Staff. Valider la transition ordonnée (`PENDING -> CONFIRMED -> PREPARING -> READY -> COMPLETED`). Retourne `ERR_ORDER_CANCELLED_LOCKED` si la commande est désactivée.
* **`getOrderTracker(orderId: string): Promise<ActionResponse<OrderWithItems>>`**
  * *Régles :* Public (lecture seule filtrée sur ID de suivi).

### 3. Feature : `auth` (`/features/auth/actions/`)
* **`loginWithMagicLink(email: string): Promise<ActionResponse<{ sent: boolean }>>`**
  * *Régles :* Envoi d'un courriel via `supabase.auth.signInWithOtp()` sécurisé. Après connexion, l'utilisateur sans organisation/restaurant de rattachement est redirigé vers `/onboarding` pour l'initialisation automatique.
* **`acceptInvitation(token: string): Promise<ActionResponse<{ profileId: string }>>`**
  * *Régles :* Relie le profil d'authentification de l'invité au `restaurant_id` lié de l'invitation. Retourne `ERR_INVITATION_EXPIRED` ou `ERR_INVITATION_ALREADY_ACCEPTED`.

### 4. Feature : `settings` (`/features/settings/actions/`)
* **`updateRestaurantProfile(restaurantId: string, data: unknown): Promise<ActionResponse<Restaurant>>`**
  * *Schéma :* `updateRestaurantProfileSchema` (name, phone, address, logo_url, is_open, currency).
  * *Cible DB :* Table `restaurants`.
* **`inviteStaffMember(restaurantId: string, email: string, role: string): Promise<ActionResponse<Invitation>>`**
  * *Régles :* Limite stricte à 10 invitations en attente (`ERR_TOO_MANY_ACTIVE_INVITATIONS`). Expire sous 24h.

### 5. Feature : `onboarding` (`/features/auth/actions/`)

* **`createRestaurantWithOrg(data: unknown): Promise<ActionResponse<{ restaurant: Restaurant; organization: Organization }>>`**
  * *Usage :* Appelé uniquement depuis la page `/onboarding` post-Magic Link. Non exposé ailleurs.
  * *Schéma :* `onboardingSchema` (restaurant.name, restaurant.slug uniquement — l'org est créée automatiquement avec les mêmes valeurs).
  * *Comportement :* Crée atomiquement dans une transaction : 1 `organizations` + 1 `restaurants` + 1 `profiles` (role: OWNER) + 1 `page_settings` (defaults) + N `page_sections` (defaults). L'utilisateur ne voit jamais le concept d'organisation.
  * *Règles :* `ERR_SLUG_IMMUTABLE` si slug déjà pris. `ERR_VALIDATION` si schema invalide.

---

## Exemple d'Intégration Client (Hooks React)

Le client Next.js réactif consomme les Server Actions à travers `useTransition` pour gérer proprement les états de chargement sans polluer globalement l'interface :

```tsx
'use client';

import { useTransition, useState } from 'react';
import { createCategory } from '@/features/menu/actions/createCategory';
import { useToast } from '@/shared/hooks/use-toast';

export function CategoryAddForm({ restaurantId }: { restaurantId: string }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      const response = await createCategory(restaurantId, name);
      
      if (response.success) {
        toast({ title: 'Succès', description: 'Catégorie créée' });
        setName('');
      } else {
        toast({ 
          title: 'Erreur', 
          description: response.error, 
          variant: 'destructive' 
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input 
        id="cat-name-input"
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        disabled={isPending}
        className="h-11 px-4 rounded-lg border"
        required
      />
      <button 
        id="cat-submit-btn"
        type="submit" 
        disabled={isPending}
        className="bg-primary h-11 px-6 rounded-lg text-white"
      >
        {isPending ? 'Enregistrement...' : 'Ajouter'}
      </button>
    </form>
  );
}
```

---

## Gestion de la Pagination (Pattern de Cursor)

Pour les listes lourdes (historique complet des réservations ou commandes d'un bar très fréquenté), les Server Actions implémentent la pagination par curseur temporel (`cursor` basé sur `created_at` décroissant) :

```typescript
type PaginatedResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};
```

---

## Pattern de Médias et Téléchargement d'Images (Supabase Storage)

1. **Génération de Signed URL / Accès d'Envoi :** L'action d'administration demande un token ou génère un chemin d'écriture sécurisé `restaurants/{id}/products/{slug_uuid}`.
2. **Transfert direct client :** Les images sont envoyées directement depuis le composant client grâce au client Supabase CDN pour décharger le serveur Next.js.
3. **Optimisation :** Redimensionnement client optionnel (`canvas`) ou utilisation de paramètres d'optimisation d'image intégrés pour n'enregistrer que des formats WebP ultra-légers inférieurs à 500 Ko.

