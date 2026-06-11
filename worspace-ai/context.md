# AGENT_CONTEXT.md
> Contexte de mission pour agent développeur — Corrections docs + Feature Multi-Établissements
> Fichiers cibles : `/docs/*.md` uniquement. Aucun fichier de code à modifier dans cette mission.

---

## Mission

Deux tâches à exécuter dans cet ordre :
1. **Section A** — Corriger les 14 points résiduels identifiés dans l'audit `DOCS_AUDIT_V2.md`.
2. **Section B** — Intégrer la nouvelle fonctionnalité Multi-Établissements dans tous les docs impactés.

**Règles d'édition :**
- Modifier uniquement les lignes/sections concernées. Ne pas réécrire les fichiers entièrement.
- Respecter le style et le registre existant de chaque doc.
- Chaque correction est autonome et référencée par son code (R-001, etc.).

---

## SECTION A — 14 Corrections Résiduelles

---

### Fichier : `docs/DATABASE.md`

**R-001 — Ajouter le champ `icon` dans la table `categories`**

Localiser la section `### 3. categories` et ajouter la ligne suivante après `name` :

```sql
- `icon` (text, default: 'Utensils') — Nom de l'icône lucide-react associée à la catégorie (ex: 'Pizza', 'CupSoda', 'Beef').
```

---

**R-014 — Ajouter une section "Index SQL Recommandés" en fin de fichier**

Après la section `## Migrations`, ajouter :

```markdown
## Index SQL Recommandés

Les index suivants sont obligatoires dès la migration initiale pour garantir des performances acceptables à l'échelle :

```sql
CREATE INDEX idx_restaurants_slug         ON restaurants(slug);
CREATE INDEX idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX idx_products_category_id     ON products(category_id);
CREATE INDEX idx_page_settings_restaurant ON page_settings(restaurant_id);
CREATE INDEX idx_page_sections_restaurant ON page_sections(restaurant_id);
CREATE INDEX idx_orders_restaurant_id     ON orders(restaurant_id);
CREATE INDEX idx_orders_status            ON orders(status);
CREATE INDEX idx_order_items_order_id     ON order_items(order_id);
CREATE INDEX idx_profiles_user_id         ON profiles(user_id);
CREATE INDEX idx_profiles_restaurant_id   ON profiles(restaurant_id);
CREATE INDEX idx_invitations_token        ON invitations(token);
```
```

---

### Fichier : `docs/PLAN.md`

**R-002 — Corriger la checklist RLS (Phase 1-3, premier point)**

Localiser :
```markdown
- [ ] Activer RLS sur les tables : `restaurants`, `profiles`, `categories`, `products`, `orders`, `order_items`.
```

Remplacer par :
```markdown
- [ ] Activer RLS sur les tables : `restaurants`, `profiles`, `categories`, `products`, `page_settings`, `page_sections`, `invitations`, `orders`, `order_items`.
```

---

**R-003 — Corriger la référence à la mauvaise table (Phase 2-3, dernier point)**

Localiser :
```markdown
- [ ] Permettre la sauvegarde continue des modifications esthétiques dans les métadonnées de la table `restaurants`.
```

Remplacer par :
```markdown
- [ ] Permettre la sauvegarde atomique des modifications esthétiques dans la table `page_settings` et l'ordre des sections dans la table `page_sections` via la Server Action `updatePageSettings`.
```

---

### Fichiers : `docs/API_CONTRACTS.md` + `docs/TEMPLATE_ENGINE.md`

**R-004 — Séparer `updateRestaurantSettings` en deux Server Actions distinctes**

**Dans `docs/API_CONTRACTS.md`**, localiser la section `### 4. Feature : settings` et :

1. Renommer `updateRestaurantSettings` → `updateRestaurantProfile` avec le commentaire :
```typescript
* **`updateRestaurantProfile(restaurantId: string, data: unknown): Promise<ActionResponse<Restaurant>>`**
  * *Schéma :* `updateRestaurantProfileSchema` (name, phone, address, logo_url, is_open, currency).
  * *Cible DB :* Table `restaurants`.
```

2. Ajouter une nouvelle action dans la section `### 2. Feature : menu` :
```typescript
* **`updatePageSettings(restaurantId: string, settings: unknown, sections: unknown): Promise<ActionResponse<{ settings: PageSettings; sections: PageSection[] }>>`**
  * *Schéma :* `updatePageSettingsSchema` (accent_color, font_family, hero_title, hero_description, hero_banner_url, display_mode, overlay_opacity, glassmorphism, density, template_layout) + tableau de sections ordonné.
  * *Règles :* Opération atomique : met à jour `page_settings` ET `page_sections` dans la même transaction.
  * *Cible DB :* Tables `page_settings` + `page_sections`.
```

**Dans `docs/TEMPLATE_ENGINE.md`**, localiser dans la section "Guide d'Entrée du Builder" :

Remplacer :
```
"Un bouton unique "Enregistrer les modifications" déclenche la Server Action `updateRestaurantSettings`"
```

Par :
```
"Un bouton unique "Enregistrer les modifications" déclenche la Server Action `updatePageSettings` qui persiste les modifications visuelles dans `page_settings` et l'ordonnancement des sections dans `page_sections` de façon atomique."
```

---

### Fichier : `docs/DESIGN_SYSTEM.md`

**R-005 — Ajouter le statut `confirmed` dans le color map**

Localiser dans la section `tailwind.config.ts` le bloc `status:` et ajouter l'entrée `confirmed` entre `pending` et `preparing` :

```typescript
confirmed: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' }, // blue-50/700/200 — plus clair que preparing
```

---

**R-006 — Corriger la référence vers `DOMAIN_MODEL.md`**

Localiser le commentaire :
```typescript
// — Order status (mapping visuel → DOMAIN_MODEL.md OrderStatus)
```

Remplacer par :
```typescript
// — Order status (mapping visuel → DATABASE.md orders.status + ARCHITECTURE.md workflow Orders)
```

---

### Fichier : `docs/TEMPLATE_ENGINE.md`

**R-007 — Standardiser `visible` → `is_enabled` dans l'exemple JSON**

Localiser le bloc JSON dans "Modèle de Configuration JSON" et remplacer toutes les occurrences de `"visible": true` par `"is_enabled": true` :

```json
{
  "version": "1.0",
  "theme": { "primaryColor": "#C2410C", "fontFamily": "Playfair Display" },
  "layout": "classic",
  "sections": [
    {
      "section_key": "hero",
      "is_enabled": true,
      "sort_order": 0,
      "props": { "title": "Notre Menu", "subtitle": "Découvrez nos spécialités" }
    },
    {
      "section_key": "category_list",
      "is_enabled": true,
      "sort_order": 1,
      "style": "horizontal_scroll"
    }
  ]
}
```

---

**R-009 — Documenter la stratégie hover color**

Localiser dans le `CustomThemeInjector` la ligne :
```typescript
--color-primary-hover: ${accentColor}dd;
```

Remplacer par :
```typescript
--color-primary-hover: color-mix(in srgb, ${accentColor} 80%, #000);
```
Et ajouter un commentaire juste après le bloc :
```typescript
// Note : color-mix() est supporté par tous les navigateurs modernes (Chrome 111+, Safari 16.2+, Firefox 113+).
// Pour les restaurants utilisant la couleur terracotta par défaut (#C2410C), la valeur exacte #9A3412 est appliquée via tailwind.config.ts.
```

---

### Fichier : `docs/USE_CASES.md`

**R-008 — Retirer la référence `?table=12` de UC-009 (décision MVP)**

Localiser la précondition de UC-009 :
```markdown
* **Préconditions :** Le QR Code ou le paramètre d'URL inclut un numéro de table (`?table=12`).
```

Remplacer par :
```markdown
* **Préconditions :** Le restaurant est ouvert (`is_open = true`). Le panier client contient au moins un article disponible.
* **Note MVP :** La notion de numéro de table physique est hors scope MVP. Le `ticket_number` généré (ex: `#A34`) suffit pour l'identification au comptoir. La gestion de tables numérotées sera traitée en post-MVP.
```

---

### Fichier : `docs/ROLES_AND_PERMISSIONS.md`

**R-010 — Ajouter les 3 lacunes manquantes**

Après le tableau de la matrice, ajouter 3 nouvelles sections :

```markdown
## Accès Client Public (Non-authentifié)

Le client final accédant au menu via QR Code n'est pas authentifié. Les accès publics autorisés sont :

| Table          | Opération autorisée                                      |
|----------------|----------------------------------------------------------|
| `restaurants`  | Lecture via `slug` uniquement                           |
| `categories`   | Lecture filtrée sur `restaurant_id` public              |
| `products`     | Lecture filtrée sur `restaurant_id` public              |
| `page_settings`| Lecture filtrée sur `restaurant_id` public              |
| `page_sections`| Lecture filtrée sur `restaurant_id` public              |
| `orders`       | Création uniquement. Lecture filtrée sur son propre `id` |

---

## Transitions de Statut Autorisées par Rôle

| Transition                         | OWNER | CASHIER | WAITER | KITCHEN |
|------------------------------------|-------|---------|--------|---------|
| `PENDING → CONFIRMED`              | ✅    | ✅      | ❌     | ✅      |
| `CONFIRMED → PREPARING`            | ✅    | ❌      | ❌     | ✅      |
| `PREPARING → READY`                | ✅    | ❌      | ❌     | ✅      |
| `READY → COMPLETED`                | ✅    | ✅      | ❌     | ❌      |
| `* → CANCELLED`                    | ✅    | ✅      | ❌     | ❌      |

---

## Cas Utilisateur Non Profilé

Un utilisateur authentifié sans entrée dans `profiles` (ex : nouveau compte Magic Link sans restaurant associé) est redirigé vers `/onboarding` pour créer ou rejoindre un restaurant. Aucun accès aux modules admin n'est accordé tant que ce profil est absent.
```

---

### Fichier : `docs/ARCHITECTURE.md`

**R-011 — Compléter l'arborescence App Router**

Localiser le bloc ```txt app/``` et remplacer par :

```txt
app/

├── page.tsx                          # Redirection → /login ou /(admin)

├── login/
│   └── page.tsx                      # Page Magic Link (email OTP)

├── invite/
│   └── [token]/
│       └── page.tsx                  # Acceptation invitation staff (UC-022)

├── onboarding/
│   └── page.tsx                      # Création restaurant post-inscription

├── (admin)/
│   ├── layout.tsx                    # Auth guard, sidebar, navigation
│   └── [restaurantId]/
│       ├── builder/page.tsx
│       ├── orders/page.tsx
│       ├── pos/page.tsx
│       ├── dashboard/page.tsx
│       └── settings/page.tsx

├── (public)/
│   ├── layout.tsx
│   └── [slug]/
│       ├── page.tsx
│       ├── checkout/page.tsx
│       └── tracking/
│           └── [orderId]/page.tsx

└── api/
    └── webhooks/
        └── stripe/
            └── route.ts              # Exception autorisée — Webhooks Stripe uniquement
```

---

### Fichier : `docs/DECISIONS.md`

**R-012 — Fusionner ADR-002 et ADR-013**

Localiser ADR-013 et remplacer son contenu par une note de fusion :

```markdown
## 013 - (Consolidé avec ADR-002)
ADR-013 précisait l'organisation physique des stores Zustand en dossiers `/features/*/store/`.
Ce principe est désormais intégré directement dans ADR-002 en tant que règle d'implémentation.
Voir : `ARCHITECTURE.md` → section "Stores Zustand".
```

Puis dans ADR-002, ajouter après la phrase de raison :
```markdown
**Implémentation :** Chaque store Zustand est localisé dans le dossier `/features/[feature-name]/store/[name].store.ts`. Aucun répertoire global `stores/` n'est autorisé.
```

---

### Fichier : `docs/UI_GUIDELINES.md`

**R-013 — Aligner le timing de retry offline**

Localiser dans la section "1. Gestion du Mode Hors-ligne" :
```
toutes les 5, 10 puis 30 secondes
```

Remplacer par :
```
avec un backoff exponentiel de 2s → 4s → 8s (3 tentatives maximum). Au-delà, l'utilisateur est invité à relancer manuellement via un bouton "Réessayer" explicite.
```

---

---

## SECTION B — Feature Multi-Établissements (Schema-ready, Feature-gated)

### Stratégie appliquée

**"Schema-ready, Feature-gated"** : L'entité `organizations` est intégrée dans le schéma de base de données dès le Jour 1, mais elle est **totalement transparente pour l'utilisateur**. Aucune UI org n'est exposée. Quand le premier client "groupe" se présente, 80% du travail est déjà fait.

```
Jour 1 — Ce que l'utilisateur voit :        Jour 1 — Ce qui existe en base :
┌─────────────────────────┐                 organizations (1:1 auto-créée)
│ "Quel est le nom de     │    ──────────►       └── restaurants
│  votre restaurant ?"    │                           └── profiles
└─────────────────────────┘

Jour 100 — Feature flag activé :
┌─────────────────────────┐
│ Org Hub + Switcher +    │
│ Multi-restaurant UI     │
└─────────────────────────┘
```

**Ce qui est fait maintenant (80%) :** Schéma DB, auto-création transparente, Stripe au niveau org, rôle `ORG_OWNER` dormant, feature flag env.

**Ce qui attend le Jour 100 (20%) :** Org Hub UI, restaurant switcher, RLS cross-restaurant, dashboard agrégé.

---

### `docs/DATABASE.md` — Modifications

**1. Ajouter la table `organizations` en première position (avant `restaurants`)**

```markdown
### 0. `organizations`
Entité racine représentant un groupe de restaurants sous un abonnement unifié.
Créée automatiquement et silencieusement à chaque inscription — transparente pour l'utilisateur en mode single-restaurant.
- `id` (uuid, pk)
- `owner_id` (uuid, fk -> auth.users)
- `name` (text) — Nom du groupe ou du restaurant unique.
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)
- `subscription_status` (text, default: 'inactive') /* active, canceled, past_due, inactive */
- `plan_type` (text, default: 'starter') /* starter, premium */
- `max_restaurants` (int, default: 1) — Quota d'établissements autorisés par le plan. Vaut 1 pour tous les plans actuels. Sera augmenté lors de l'activation de la feature multi-établissements.
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())
```

**2. Modifier la table `restaurants`**

Supprimer les colonnes Stripe (migrées vers `organizations`) :
~~`stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `plan_type`~~

Ajouter :
```sql
- `organization_id` (uuid, fk -> organizations, not null) — Organisation propriétaire.
```

**3. Modifier la table `profiles`**

Ajouter :
```sql
- `organization_id` (uuid, fk -> organizations, not null) — Organisation de rattachement.
```

Étendre l'enum `role` pour inclure le rôle dormant :
```sql
- `role` (enum: ORG_OWNER, OWNER, WAITER, CASHIER, KITCHEN)
-- Note : ORG_OWNER est réservé à l'activation de la feature multi-établissements.
-- En mode single-restaurant actuel, tous les propriétaires ont le rôle OWNER.
```

**4. Modifier la table `invitations`**

Ajouter :
```sql
- `organization_id` (uuid, fk -> organizations, not null) — Organisation émettrice.
```

**5. Ajouter les nouveaux index**

Dans la section "Index SQL Recommandés", ajouter :
```sql
CREATE INDEX idx_restaurants_organization_id ON restaurants(organization_id);
CREATE INDEX idx_profiles_organization_id    ON profiles(organization_id);
CREATE INDEX idx_invitations_organization_id ON invitations(organization_id);
```

**6. Mettre à jour la section RLS**

Ajouter après les politiques existantes :
```markdown
- **Organizations** : Lecture/écriture uniquement par le `owner_id` correspondant à `auth.uid()`. Aucun accès public.
- **Note Feature-gated** : Les politiques RLS cross-restaurant (permettant à un ORG_OWNER d'accéder à plusieurs restaurants) ne sont pas implémentées à ce stade. En mode actuel, chaque `organization` contient exactement 1 `restaurant` — la politique restaurant-level est donc suffisante. Les politiques org-level seront ajoutées lors de l'activation de la feature.
```

---

### `docs/PRODUCT.md` — Modifications

**1. Ajouter dans la section "Hors Scope MVP"**

```markdown
* gestion multi-établissements (UI Org Hub, restaurant switcher — feature-gated, activable post-PMF)
```

**2. Mettre à jour la section Business Model — note transparence**

Après le bloc des tiers d'abonnement, ajouter :
```markdown
> **Note d'implémentation :** La facturation Stripe est techniquement rattachée à l'entité `organizations` dès le Jour 1, même pour les utilisateurs single-restaurant. Cette décision d'architecture permet d'activer la feature multi-établissements sans migration de données Stripe lorsque le besoin se présente.
```

---

### `docs/ARCHITECTURE.md` — Modifications

**1. Ne pas ajouter `features/organization/`** dans la liste des features pour l'instant.

**2. Ajouter une note de feature-gate après la liste des features**

```markdown
> **Feature-gated — Multi-Établissements :** L'entité `organizations` est présente en base de données et auto-créée à chaque inscription (1:1 avec `restaurants`). La feature `features/organization/` (Org Hub UI, switcher, dashboard agrégé) sera ajoutée lors de l'activation. Aucun routing `/(admin)/org/[orgId]/` n'est exposé actuellement.
```

**3. L'arborescence App Router reste inchangée** — pas de route `org/` à ajouter maintenant.

---

### `docs/DECISIONS.md` — Ajout de 2 ADRs

Ajouter à la fin du fichier :

```markdown
## 014 - Stratégie Schema-ready pour le Multi-Établissements
**Décision** : Introduire la table `organizations` et ses FKs dans le schéma dès le Jour 1, avec création automatique et transparente d'une organisation 1:1 à chaque inscription. La facturation Stripe est rattachée à `organizations`. Aucune UI multi-restaurant n'est exposée à ce stade.
**Raison** : Évite une migration de données coûteuse le jour où la feature est activée (ajouter `organization_id` sur des tables avec des millions de lignes est un risque opérationnel majeur). Le coût de l'intégrer proprement dès le début est de ~0.5 sprint vs 3-4 sprints en retrofit.

## 015 - Rôle ORG_OWNER Dormant dans l'Enum
**Décision** : Inclure `ORG_OWNER` dans l'enum `profiles.role` dès la création du schéma, sans l'exposer dans l'UI ou les permissions actuelles.
**Raison** : Modifier un enum PostgreSQL sur une table en production avec des données existantes nécessite un verrou de table et peut causer des indisponibilités. L'inclure dès le départ coûte zéro.
```

---

### `docs/ROLES_AND_PERMISSIONS.md` — Modification minimale

Ajouter uniquement une note en bas du fichier, sans modifier la matrice :

```markdown
## Rôle Réservé (Feature-gated)

- **ORG_OWNER** : Rôle présent dans l'enum `profiles.role` mais non activé dans l'UI ni dans la matrice de permissions actuelle. Sera exposé lors de l'activation de la feature multi-établissements. Sa permission : accès total en lecture sur tous les restaurants de son `organization_id`, gestion de l'abonnement Stripe groupe.
```

---

### `docs/API_CONTRACTS.md` — Modification minimale

Dans la section `### 3. Feature : auth`, modifier l'action `loginWithMagicLink` pour documenter la création transparente d'org :

Ajouter une nouvelle action interne dans `### 2. Feature : menu` (ou créer une section `### 5. Feature : onboarding`) :

```markdown
### 5. Feature : `onboarding` (`/features/auth/actions/`)

* **`createRestaurantWithOrg(data: unknown): Promise<ActionResponse<{ restaurant: Restaurant; organization: Organization }>>`**
  * *Usage :* Appelé uniquement depuis la page `/onboarding` post-Magic Link. Non exposé ailleurs.
  * *Schéma :* `onboardingSchema` (restaurant.name, restaurant.slug uniquement — l'org est créée automatiquement avec les mêmes valeurs).
  * *Comportement :* Crée atomiquement dans une transaction : 1 `organizations` + 1 `restaurants` + 1 `profiles` (role: OWNER) + 1 `page_settings` (defaults) + N `page_sections` (defaults). L'utilisateur ne voit jamais le concept d'organisation.
  * *Règles :* `ERR_SLUG_IMMUTABLE` si slug déjà pris. `ERR_VALIDATION` si schema invalide.
```

---

### `docs/ERROR_CATALOG.md` — Modification minimale

Ajouter uniquement l'erreur utile maintenant (quota futur) :

```markdown
## Codes Réservés — Multi-Établissements (Feature-gated)

Ces codes existent dans le catalogue pour préparation mais ne sont pas retournés par l'application actuelle.

- `ERR_RESTAURANT_LIMIT_REACHED` : Le groupe a atteint le quota `max_restaurants` de son plan. Activé lors de l'ouverture de la feature multi-établissements.
- `ERR_NOT_ORGANIZATION_MEMBER` : Accès refusé — le restaurant cible n'appartient pas à l'organisation de l'utilisateur.
```

---

### `docs/USE_CASES.md` — Modifications

**1. Modifier UC-002** — titre et flux pour refléter la création transparente

Remplacer le titre par :
`UC-002 : Onboarding — Création du premier Restaurant (Organisation auto-créée)`

Remplacer le flux nominal :
```markdown
* **Flux nominal :**
  1. Post-Magic Link, l'Owner est redirigé vers `/onboarding`.
  2. Saisit uniquement le **nom** et le **slug** de son restaurant.
  3. Le système crée atomiquement en arrière-plan : une `organizations` (même nom, même slug), le `restaurants`, un `profiles` (role: OWNER), un `page_settings` (valeurs par défaut) et les `page_sections` initiales.
  4. L'utilisateur est redirigé vers `/(admin)/[restaurantId]/builder`.
* **Note :** L'organisation est créée silencieusement. L'utilisateur ne la voit pas. Elle sera exposée lors de l'activation de la feature multi-établissements.
* **Codes d'erreur :** `ERR_SLUG_IMMUTABLE`, `ERR_VALIDATION`
```

**2. Ajouter UC-024 et UC-025 en section "Post-MVP / Feature-gated"**

```markdown
---

## Use Cases Feature-gated (Multi-Établissements — Post-PMF)

> Ces use cases sont documentés pour préparation mais **non implémentés** dans la version actuelle. Ils seront activés via feature flag lorsque le premier client "groupe" se présentera.

### UC-024 : Ajout d'un Établissement au Groupe
* **Acteur :** Organization Owner (rôle ORG_OWNER activé)
* **Préconditions :** Feature multi-établissements activée. Plan Premium ou Enterprise.
* **Flux nominal :**
  1. Depuis l'Org Hub (nouvelle route `/(admin)/org/[orgId]/`), cliquer "Ajouter un établissement".
  2. Saisir nom + slug du nouveau restaurant.
  3. Vérification du quota `max_restaurants`.
  4. Création atomique : `restaurants` + `page_settings` + `page_sections` defaults.
* **Codes d'erreur :** `ERR_RESTAURANT_LIMIT_REACHED`, `ERR_SLUG_IMMUTABLE`

### UC-025 : Sélection et Bascule d'Établissement Actif
* **Acteur :** Organization Owner
* **Flux nominal :**
  1. Sélectionner un restaurant dans le switcher de la sidebar.
  2. Navigation vers `/(admin)/[restaurantId]/dashboard` de l'établissement choisi.
```

**3. Mettre à jour UC-018** — ajouter la note Stripe org-level

```markdown
* **Note architecture :** La session Stripe Checkout est créée pour l'`organization_id`, pas le `restaurant_id`. Ce comportement est actif dès le Jour 1 (même pour les utilisateurs single-restaurant, de façon transparente).
```