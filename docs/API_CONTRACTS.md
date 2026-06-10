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
- S'assurer que l'utilisateur possède l'autorisation (rôle adéquat) vis-à-vis du `restaurant_id` impacté.
