# MIGRATION_AUDIT.md

> Audit de conformité — Codebase Actuel vs Vision Documentaire `/docs`
> Date : Juin 2026 | Scope : Migration complète vers architecture SaaS Production-Grade

---

## 1. Score de Conformité Global

| Domaine                     | Statut      | Conformité |
|-----------------------------|-------------|------------|
| Structure du projet         | 🔴 CRITIQUE | 0 %        |
| Persistance des données     | 🔴 CRITIQUE | 0 %        |
| Authentification & Sécurité | 🔴 CRITIQUE | 0 %        |
| Layer API / Server Actions  | 🔴 CRITIQUE | 5 %        |
| State Management            | 🔴 CRITIQUE | 10 %       |
| Temps Réel                  | 🔴 CRITIQUE | 0 %        |
| Multi-tenancy               | 🔴 CRITIQUE | 0 %        |
| Design System               | 🟡 MAJEUR   | 40 %       |
| Template Engine             | 🟡 MAJEUR   | 15 %       |
| RBAC                        | 🟡 MAJEUR   | 0 %        |
| Validation (Zod)            | 🟡 MAJEUR   | 0 %        |
| Séparation des concerns     | 🟡 MAJEUR   | 20 %       |
| Codes d'erreur              | 🟢 MINEUR   | 30 %       |
| Billing / Stripe            | ⬜ HORS MVP | —          |

**Score global estimé : ~8 % de conformité avec la vision docs.**
> Le prototype actuel est fonctionnel comme démo, mais aucun principe d'architecture production n'est respecté.

---

## 2. Violations CRITIQUES (Bloquantes production)

### 🔴 C-001 — Persistance inexistante (In-Memory Store)

**Fichier incriminé :** `app/api/sync/route.ts`

```typescript
// ❌ INTERDIT — État volatil en mémoire Node.js
let currentConfig: RestaurantConfig = { ...DEFAULT_CONFIG };
let ordersList: Order[] = [...];
```

**Impact :**
- Toutes les données sont perdues à chaque redémarrage du serveur (Cloud Run cold start, redeploy, crash).
- Il est impossible de supporter plusieurs restaurants simultanément (variable globale partagée entre tous les tenants).
- Incompatible avec le modèle SaaS multi-tenant décrit dans `DATABASE.md` et `PRODUCT.md`.

**Migration requise :**
- Supprimer `app/api/sync/route.ts` intégralement.
- Remplacer par des Server Actions Next.js appelant Supabase PostgreSQL.
- Implémenter les tables `restaurants`, `categories`, `products`, `orders`, `order_items` avec RLS.

---

### 🔴 C-002 — Absence totale d'authentification

**Fichier incriminé :** `app/page.tsx`, `app/[slug]/page.tsx`, tous les `components/`

Le tableau de bord marchand à `/` est accessible à n'importe qui sans session. Il n'existe aucun middleware de protection de route, aucune vérification de session, aucune table `profiles`.

**Impact :**
- N'importe quel utilisateur peut accéder au builder, modifier le menu, vider les commandes.
- Incompatible avec le modèle RBAC de `ROLES_AND_PERMISSIONS.md`.
- Incompatible avec l'isolement des tenants de `DATABASE.md`.

**Migration requise :**
- Implémenter Magic Link Auth via `supabase.auth` (conforme ADR décidé).
- Créer le middleware Next.js sur `(admin)/*` avec redirection vers `/login` si session absente.
- Créer la table `profiles` avec `(user_id, restaurant_id, role)`.
- Chaque Server Action doit appeler `supabase.auth.getUser()` en premier.

---

### 🔴 C-003 — API Route à la place de Server Actions

**Fichier incriminé :** `app/api/sync/route.ts`

```typescript
// ❌ INTERDIT selon API_CONTRACTS.md
export async function POST(req: NextRequest) { ... }
```

`API_CONTRACTS.md` est explicite : **aucune API Route pour les opérations internes**. Seul `app/api/webhooks/stripe/route.ts` est autorisé comme exception. Toutes les mutations doivent passer par des Server Actions typées `ActionResponse<T>`.

**Impact :**
- Pas de type-safety end-to-end entre client et serveur.
- Pas de validation Zod centralisée.
- Pas de vérification auth inline dans les actions.
- Pattern architecturalement deprecated pour un projet Next.js 15 App Router.

**Migration requise :**
- Créer `features/menu/actions/`, `features/order/actions/`, etc.
- Chaque action retourne `ActionResponse<T>` (voir `API_CONTRACTS.md`).
- Valider tous les inputs avec Zod avant toute écriture en base.

---

### 🔴 C-004 — Polling HTTP au lieu de Supabase Realtime

**Fichier incriminé :** `components/RestoContext.tsx`

```typescript
// ❌ INTERDIT — Polling 3s
const interval = setInterval(() => {
  if (!isNetworkSimulatedOffline) {
    refreshData(); // Appelle /api/sync en boucle
  }
}, 3000);
```

**Impact :**
- Latence de 0 à 3 secondes sur les mises à jour de statut de commande côté cuisine.
- Charge serveur inutile proportionnelle au nombre d'utilisateurs connectés (N restaurants × 1 requête/3s).
- Incompatible avec la promesse produit "Les clients sont avertis instantanément" (`OrderManagerPage.tsx`).
- `DECISIONS.md` (ADR-003), `ARCHITECTURE.md` et `PRODUCT.md` sont tous explicites sur Supabase Realtime.

**Migration requise :**
- Remplacer le polling par des subscriptions Supabase Realtime sur le canal `orders:restaurant_id=eq.{id}`.
- Implémenter dans le hook dédié `features/order/hooks/useOrdersRealtime.ts`.

---

### 🔴 C-005 — Absence de multi-tenancy

**Fichier incriminé :** `lib/defaultData.ts`, `app/api/sync/route.ts`

```typescript
// ❌ Restaurant unique hardcodé
slug: 'le-palais-du-chef',
```

Il n'existe qu'un seul restaurant dans l'application entière. Toutes les données sont partagées dans la même variable mémoire. Il n'y a aucune notion de `restaurant_id`, de `tenant_id`, ou d'isolation par `slug`.

**Impact :**
- L'application ne peut pas fonctionner comme SaaS multi-tenant.
- Incompatible avec toute la vision `PRODUCT.md` et `DATABASE.md`.

**Migration requise :**
- Chaque entité (catégories, produits, commandes) doit porter un `restaurant_id` (FK vers `restaurants`).
- RLS Supabase doit isoler les tenants via `auth.uid()` → `profiles.restaurant_id`.
- Le routing admin doit inclure le contexte tenant : `app/(admin)/[restaurantId]/...`.

---

## 3. Violations MAJEURES (Refonte significative)

### 🟡 M-001 — Structure du projet non conforme à Feature First

**État actuel :**
```
components/
├── BuilderPanel.tsx      # feature: menu/builder
├── CaissePage.tsx        # feature: pos
├── ClientMenu.tsx        # feature: menu/public + cart + checkout + tracking (!!)
├── CollapsibleSidebar.tsx # shared/ui
├── DashboardPage.tsx     # feature: dashboard
├── MobilePreview.tsx     # feature: menu/preview
├── OrderManagerPage.tsx  # feature: order
├── RestoContext.tsx      # ???  (tout)
└── SettingsPage.tsx      # feature: settings
```

**Structure requise (`ARCHITECTURE.md`) :**
```
src/
├── features/
│   ├── menu/
│   │   ├── components/   # BuilderPanel, MenuRenderer, CategoryList…
│   │   ├── hooks/        # useMenuData, useBuilderState
│   │   ├── actions/      # createCategory, updateProduct…
│   │   ├── store/        # builderStore.ts (Zustand)
│   │   ├── types.ts
│   │   └── validators.ts # schémas Zod
│   ├── order/
│   ├── cart/
│   ├── checkout/
│   ├── pos/
│   ├── dashboard/
│   ├── settings/
│   ├── auth/
│   └── billing/
├── templates/
│   ├── engine/           # MenuRenderer.tsx
│   ├── layouts/          # classic, card-grid, premium
│   ├── sections/         # HeroSection, CategoryList…
│   └── themes/
└── shared/
    ├── ui/               # Composants atomiques shadcn/ui
    ├── hooks/
    ├── lib/
    └── types/
```

**Interdit explicitement (`ARCHITECTURE.md`) :**
> `components/admin`, `components/public`, `components/forms` — organisé par type technique.

---

### 🟡 M-002 — `ClientMenu.tsx` est un God Component

`ClientMenu.tsx` (~700 lignes) mixe dans un seul composant :

| Responsabilité                   | Feature cible                  |
|----------------------------------|-------------------------------|
| Affichage du catalogue menu      | `templates/engine/MenuRenderer` |
| Gestion du panier (add/remove)   | `features/cart/store/`        |
| Étape CHOOSE_MODE                | `features/checkout/`          |
| Formulaire livraison             | `features/checkout/`          |
| Simulation réseau offline        | `features/order/hooks/`       |
| Modal WhatsApp                   | `features/order/components/`  |
| Écran de tracking                | `features/order/components/`  |

**Violation directe du Principe 3 de `ARCHITECTURE.md` :**
> "Le menu public, le builder preview et le mobile preview doivent utiliser le même renderer."
> Un composant `<MenuRenderer />` unique, utilisé partout.

Le `ClientMenu` actuel n'est pas un renderer — c'est une application complète encapsulée dans un composant.

---

### 🟡 M-003 — RestoContext viole 4 principes simultanément

**Fichier incriminé :** `components/RestoContext.tsx`

| Violation                          | Principe violé              |
|------------------------------------|-----------------------------|
| State global de tout (config, orders, tabs, UI flags) | ADR-002 — Zustand local à la feature |
| `activeTab` en contexte global     | UI state ≠ domain state     |
| Polling HTTP                       | ADR-003 — Supabase Realtime |
| Appels directs à `/api/sync`       | `API_CONTRACTS.md`          |
| Flags de simulation dans le contexte | Hors scope du contexte métier |

**Migration requise :**
- `CartStore` → `features/cart/store/cart.store.ts` (Zustand)
- `OrdersStore` → `features/order/store/orders.store.ts` + hook Realtime
- `BuilderStore` → `features/menu/store/builder.store.ts`
- Supprimer `RestoContext` dans sa forme actuelle.
- `activeTab` → état local de navigation (`app/(admin)/layout.tsx`).

---

### 🟡 M-004 — Design System partiellement non conforme

**État actuel (couleurs dominantes dans le code) :**
- CTA Principal : `bg-emerald-500`, `bg-rose-600`
- Accents : `text-emerald-600`, `text-rose-400`
- Fond Dashboard : `bg-[#FAFAF9]` ✅, `bg-[#F5F5F4]` ✅
- Textes : `text-[#1C1917]` ✅, `text-[#78716C]` ✅

**Design System requis (`DESIGN_SYSTEM.md`) :**
- CTA Principal : `#C2410C` (terracotta)
- Accent : `#F59E0B` (amber)
- Surfaces : `#FAFAF9`, `#F5F5F4` ✅ (déjà conformes)
- Textes : `#1C1917`, `#57534E`, `#78716C` ✅ (déjà conformes)

**Ce qui est conforme :** Les tokens de surfaces et textes sont bien alignés (excellente base).
**Ce qui doit changer :** Toutes les occurrences `emerald-*` et `rose-*` comme couleurs d'action doivent migrer vers terracotta `#C2410C`.

**`globals.css` actuel :**
```css
/* ❌ Uniquement ceci */
@import "tailwindcss";
```

**Requis :**
```css
/* Toutes les CSS Variables du DESIGN_SYSTEM.md doivent être déclarées ici */
:root {
  --color-primary: #C2410C;
  --color-primary-hover: #9A3412;
  /* ... 15+ variables */
}
```

---

### 🟡 M-005 — Types centralisés (interdit)

**Fichier incriminé :** `lib/restoTypes.ts`

`ARCHITECTURE.md` interdit explicitement :
> "`types/index.ts` géant et centralisé"

**Migration requise :**
- `OrderStatus`, `OrderType`, `Order`, `OrderItem` → `features/order/types.ts`
- `MenuItem`, `MenuCategory`, `RestaurantSection` → `features/menu/types.ts`
- `RestaurantStyle`, `RestaurantConfig` → `features/settings/types.ts` ou `shared/types/restaurant.ts`

---

### 🟡 M-006 — Aucune validation Zod

Aucune occurrence de `import { z } from 'zod'` dans la codebase. Les formulaires utilisent uniquement l'attribut HTML `required`.

**API_CONTRACTS.md** est explicite :
> "Utilisation stricte de **Zod** pour valider les payloads avant toute opération de base de données."

**Formulaires à couvrir en priorité :**
- Création/modification de catégorie (`BuilderPanel.tsx` → `features/menu/validators.ts`)
- Création/modification de plat (idem)
- Formulaire livraison (`ClientMenu.tsx` → `features/checkout/validators.ts`)
- Formulaire paramètres restaurant (`SettingsPage.tsx` → `features/settings/validators.ts`)
- Server Actions (chaque action doit parser avec `schema.parse(data)`)

---

### 🟡 M-007 — Absence de RBAC

**Fichier incriminé :** Toute l'application

La matrice de `ROLES_AND_PERMISSIONS.md` n'est nulle part implémentée. Le tableau de bord à `/` expose toutes les fonctionnalités sans aucune vérification de rôle.

**Migration requise :**
- Créer `features/auth/hooks/usePermissions.ts` exposant un helper `can(role, action)`.
- Masquer les éléments UI non autorisés selon le rôle de l'utilisateur connecté.
- Ajouter des guards dans chaque Server Action (`if (profile.role !== 'OWNER') throw ERR_FORBIDDEN`).
- RLS Supabase comme couche ultime de protection.

---

### 🟡 M-008 — Template Engine inexistant

**API actuelle de styling (approche courante) :**
```typescript
// Injection inline CSS directe dans le composant
<style dangerouslySetInnerHTML={{__html: `
  .brand-accent-bg { background-color: ${style.accentColor} !important; }
`}} />
```

**Requis (`TEMPLATE_ENGINE.md`) :**
```typescript
// JSON config → Renderer
<MenuRenderer config={templateJson} data={menuData} />
```

Le Template Engine doit :
1. Définir un schéma JSON strict pour la configuration visuelle.
2. Exposer 3 layouts : `classic`, `card-grid`, `premium`.
3. Composer des sections typées : `hero`, `category_list`, `featured-items`, `footer`.
4. Le Builder génère ce JSON — il ne modifie jamais directement les composants React.

---

### 🟡 M-009 — `OrderStatus` incomplet

**Fichier incriminé :** `lib/restoTypes.ts`

```typescript
// ❌ Actuel
type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
```

```typescript
// ✅ Requis selon DATABASE.md et PRODUCT.md
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
```

Le statut `CONFIRMED` est manquant. Le workflow `PENDING → CONFIRMED → PREPARING → READY → COMPLETED` décrit dans `ARCHITECTURE.md` (section Orders) n'est pas implémentable.

---

### 🟡 M-010 — Route structure non conforme à App Router

**Actuel :**
```
app/
├── page.tsx          # Dashboard marchand (sans auth !)
└── [slug]/page.tsx   # Menu public
```

**Requis (`ARCHITECTURE.md`) :**
```
app/
├── (admin)/
│   ├── layout.tsx              # Auth guard, sidebar, navigation
│   └── [restaurantId]/
│       ├── builder/page.tsx
│       ├── orders/page.tsx
│       ├── pos/page.tsx
│       ├── dashboard/page.tsx
│       └── settings/page.tsx
├── (public)/
│   ├── layout.tsx
│   └── [slug]/
│       ├── page.tsx            # Menu public
│       ├── checkout/page.tsx
│       └── tracking/[orderId]/page.tsx
├── login/page.tsx
└── invite/[code]/page.tsx
```

Le checkout et le tracking sont actuellement des "étapes" (`clientStep`) internes à `ClientMenu.tsx` — ils doivent être des routes dédiées avec leur propre URL (pour le partage de lien de tracking, le retour arrière natif du navigateur, etc.).

---

## 4. Violations MINEURES (Améliorations ciblées)

### 🟢 m-001 — Codes d'erreur partiellement implémentés en UX seulement

Des codes comme `ERR_MENU_NOT_FOUND`, `ERR_CART_EMPTY`, `ERR_WHATSAPP_NOT_FOUND` apparaissent dans les chaînes UI mais ne sont pas retournés par des Server Actions comme `ActionResponse<T>`. Ils ne sont pas exploitables programmatiquement.

**Migration :** Les Server Actions doivent retourner `{ success: false, error: "ERR_ORDER_EMPTY" }` de façon typée. L'UI consomme ce code pour afficher le bon message i18n.

---

### 🟢 m-002 — `app/layout.tsx` — Metadata non conforme

```typescript
// ❌ Actuel
export const metadata: Metadata = {
  title: 'My Google AI Studio App', // Vestige de la génération initiale
  description: 'My Google AI Studio App',
};
```

Doit être remplacé par les vraies métadonnées produit + configuration PWA (`manifest.json`, `theme-color`, icônes).

---

### 🟢 m-003 — Debounce search hardcodé à 3000ms

**Fichier incriminé :** `components/ClientMenu.tsx`

```typescript
// ❌ Le commentaire dit 300ms mais le code dit 3000ms !
debouncedSearchTimer.current = setTimeout(() => {
  setDebouncedSearch(searchTerm);
}, 3000); // Wait, 300ms was requested. Let's do exactly 300ms!
```

Bug fonctionnel : la recherche attend 3 secondes avant de filtrer.

---

### 🟢 m-004 — `shadcn/ui` non intégré

`UI_GUIDELINES.md` impose shadcn/ui comme bibliothèque de base. Actuellement, tous les composants sont custom Tailwind depuis zéro. Les composants Dialog, Select, Form, Toast, etc. devraient étendre les primitives shadcn/ui.

---

### 🟢 m-005 — Accès Supabase direct depuis composants (futur)

Actuellement, il n'y a pas de Supabase. Mais lors de la migration, il faudra s'assurer qu'aucun composant n'importe directement le client Supabase. `ARCHITECTURE.md` interdit :
```typescript
// ❌ Interdit dans les composants
const { data } = await supabase.from('orders').select(...)
```
Seuls les services, hooks métier et Server Actions peuvent accéder à Supabase.

---

## 5. Ce qui peut être réutilisé (Actifs à conserver)

Malgré les violations, plusieurs éléments du prototype constituent une base solide :

| Actif                                | Valeur                                          | Action              |
|--------------------------------------|-------------------------------------------------|---------------------|
| `BACKGROUND_PRESETS`, `FONTS_LIST`   | Liste de presets bien construite                | Migrer dans `features/menu/constants.ts` |
| `defaultData.ts` — données de seed   | Données de démo riches et réalistes             | Migrer en fixtures de seed Supabase |
| Tokens couleurs light (`#FAFAF9`, `#F5F5F4`, `#1C1917`) | Parfaitement alignés avec `DESIGN_SYSTEM.md` | Déjà conformes — à garder |
| Logique de `formatPrice()`           | Utilitaire propre                               | Migrer dans `shared/utils/formatters.ts` |
| UX multi-step du checkout            | Flux client bien pensé (MENU→CART→MODE→LIVRAISON→TRACKING) | Réarchitecturer comme routes dédiées |
| Simulation offline / retry backoff   | Démo pertinente pour l'UX mobile africain       | Extraire en hook `useOrderSubmitWithRetry` |
| `CollapsibleSidebar` structure       | Navigation admin bien pensée                    | Migrer dans `shared/ui/` ou `features/layout/` |
| `OrderManagerPage` — workflow statuts | Logique métier correcte                        | Migrer dans `features/order/` |
| `generateTicketNumber()` helper      | Logique propre, extractible                     | Migrer dans `features/order/utils.ts` |

---

## 6. Roadmap de Migration Recommandée

### Phase M-0 : Fondations (Blocker absolu avant tout)
1. Initialiser Supabase project + créer le schéma SQL complet (`DATABASE.md`)
2. Activer RLS sur toutes les tables
3. Configurer Magic Link Auth + middleware Next.js
4. Créer `globals.css` avec toutes les CSS Variables du Design System
5. Restructurer les dossiers vers `features/` + `shared/` + `templates/`
6. Décomposer et déclarer le type `ActionResponse<T>` dans `shared/types/`

### Phase M-1 : Layer Données
1. Écrire les Server Actions CRUD pour `features/menu/actions/`
2. Écrire les Server Actions CRUD pour `features/order/actions/`
3. Valider tous les inputs avec Zod (`features/*/validators.ts`)
4. Supprimer `app/api/sync/route.ts`

### Phase M-2 : State + Realtime
1. Créer `features/cart/store/cart.store.ts` (Zustand)
2. Créer `features/order/hooks/useOrdersRealtime.ts` (Supabase Realtime)
3. Supprimer `RestoContext.tsx`

### Phase M-3 : Template Engine
1. Définir le schéma JSON complet dans `templates/engine/types.ts`
2. Créer `<MenuRenderer />` dans `templates/engine/`
3. Créer les layouts `classic`, `card-grid`, `premium`
4. Migrer `ClientMenu.tsx` pour consommer `<MenuRenderer />`
5. Migrer `MobilePreview.tsx` pour consommer le même `<MenuRenderer />`

### Phase M-4 : Routing + RBAC + Auth UI
1. Créer les route groups `(admin)/` et `(public)/`
2. Extraire checkout et tracking comme routes dédiées
3. Implémenter `usePermissions()` + masquage UI
4. Intégrer shadcn/ui progressivement dans `shared/ui/`

### Phase M-5 : Billing (Stripe) — Post-MVP Core
1. Suivre Phase 5 du `PLAN.md` intégralement

---

## 7. Synthèse Décisionnelle

| Question                              | Réponse                                                    |
|---------------------------------------|------------------------------------------------------------|
| Peut-on migrer incrémentalement ?     | **Non** pour les fondations (C-001 à C-005 sont bloquants). Oui pour les phases M-2 à M-5. |
| Quelle est la première action ?       | Supabase schema + RLS + Auth. Tout le reste en dépend.   |
| Combien de fichiers survivent tels quels ? | ~3 (`use-mobile.ts`, `lib/utils.ts`, `defaultData.ts` comme seed) |
| Le prototype est-il un risque ?       | Non — il reste une référence UX/produit valide. Sa logique doit être réarchitecturée, pas réinventée. |
| Durée estimée de la migration complète ? | 4 à 6 sprints de développement pour un dev senior solo. |
