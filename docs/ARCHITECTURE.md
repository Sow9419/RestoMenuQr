# ARCHITECTURE.md

# Vision Architecture

QRMenu est une application SaaS multi-tenant de gestion de restaurant.

Le système est construit autour de :

* Next.js App Router
* TypeScript
* Supabase
* Zustand
* TailwindCSS
* shadcn/ui

L'architecture doit rester :

* simple
* explicite
* maintenable
* scalable

Toute implémentation doit privilégier la lisibilité avant l'abstraction.

---

# Principes Non Négociables

## 1. Feature First

Le code est organisé par domaine métier.

Ne jamais organiser le projet principalement par type technique.

Interdit :

```txt
components/admin
components/public
components/forms
components/modals
```

Autorisé :

```txt
features/menu
features/order
features/checkout
features/pos
features/settings
features/dashboard
```

---

## 2. Source Unique de Vérité

Chaque donnée possède une seule source de vérité.

Exemples :

* CartStore → panier
* Supabase → persistance
* Template JSON → structure visuelle

La duplication d'état est interdite.

---

## 3. Renderer Unique

Le menu public, le builder preview et le mobile preview doivent utiliser le même renderer.

Interdit :

```tsx
AdminPreviewMenu.tsx
PublicMenu.tsx
MobilePreview.tsx
```

avec des implémentations différentes.

Autorisé :

```tsx
<MenuRenderer />
```

utilisé partout.

---

## 4. Aucun Accès Direct à Supabase depuis les Composants

Interdit :

```tsx
const { data } = await supabase
.from(...)
.select(...)
```

dans un composant React.

Les composants doivent consommer :

* services
* hooks métier
* server actions

uniquement.

---

# Structure du Projet

```txt
├── app/                  # Points d'accès Next.js App Router (pages et routing)

├── features/             # Architecture modulaire "Feature First" (autonomes)
│   ├── menu/             # Logique du menu, édition plats et catégories
│   ├── order/            # Cycle de vie et suivi des commandes
│   ├── checkout/         # Formulaires de finalisation panier (Dine-in / Delivery)
│   ├── cart/             # Gestion du panier d'achat local (Zustand store client)
│   ├── pos/              # Module d'encaissement et de caisse enregistreuse
│   ├── settings/         # Configuration restaurant et invitations d'équipe
│   ├── dashboard/        # Analyse d'activité et calcul des KPI
│   ├── auth/             # Logique d'onboarding par code OTP Email et RBAC
│   └── billing/          # Abonnement SaaS et portail d'inscription Stripe

> **Feature-gated — Multi-Établissements :** L'entité `organizations` est présente en base de données et auto-créée à chaque inscription (1:1 avec `restaurants`). La feature `features/organization/` (Org Hub UI, switcher, dashboard agrégé) sera ajoutée lors de l'activation. Aucun routing `/(admin)/org/[orgId]/` n'est exposé actuellement.

├── templates/            # Moteur de template JSON-driven (UI générative isolée)
│   ├── engine/           # Interpréteur et boucle de rendu
│   ├── layouts/          # Modèles de structure (Classic, Card-grid, Premium)
│   ├── sections/         # Blocs layout de haut niveau (Hero, Categories, Menu)
│   ├── blocks/           # Briques visuelles unitaires (Plat, Badge, Prix)
│   └── themes/           # CSS et tokens sémantiques isolés du domaine métier

├── shared/               # Code transverse réutilisable sans couplage métier
│   ├── ui/               # Composants graphiques atomiques de base (Boutons, Inputs, etc.)
│   ├── hooks/            # Hooks utilitaires réutilisables (useToast, forceUpdate)
│   ├── lib/              # Clients d'infrastructure configurés (supabase Client, stripe API)
│   ├── utils/            # Assistants mathématiques purs ou textuels (cn, formatCurrency)
│   ├── constants/        # Données de configuration transversales figées
│   └── types/            # Déclarations globales d'infrastructure techniques
```

---

# App Router

```txt
app/

├── page.tsx                          # Redirection → /login ou /(admin)

├── login/
│   └── page.tsx                      # Page de connexion (saisie email & code OTP)

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

Les pages ne doivent contenir que :

* composition
* chargement des données
* orchestration

La logique métier est interdite dans les pages.

---

# Architecture Feature

Exemple :

```txt
features/menu/

├── components/
├── hooks/
├── services/
├── store/
├── actions/
├── types.ts
├── constants.ts
└── validators.ts
```

Chaque feature doit être autonome.

---

# Template Engine

Le moteur de templates est un sous-système indépendant.

---

## Layout

Définit la structure générale.

Exemples :

* classic
* card-grid
* premium

---

## Section

Bloc métier.

Exemples :

* hero
* categories
* featured-items
* promotions
* footer

---

## Block

Unité UI réutilisable.

Exemples :

* item-card
* item-list
* image
* badge
* price

---

## Theme

Définit uniquement :

* couleurs
* typographie
* espacements
* bordures

Jamais de logique métier.

---

## Flow

```txt
Builder
↓
Template JSON
↓
Renderer
↓
UI
```

Le Builder ne génère jamais du code React.

---

# Modules Métier

## Builder

Responsable :

* catégories
* produits
* templates
* personnalisation

Ne contient aucune logique de commande.

---

## Dashboard

Responsable :

* statistiques
* ventes
* indicateurs

Lecture seule.

---

## Orders

Responsable :

* cycle de vie des commandes
* changements de statuts

Statuts autorisés :

```txt
PENDING
CONFIRMED
PREPARING
READY
COMPLETED
CANCELLED
```

---

## POS

Responsable :

* encaissement
* paiement
* reçu

Aucune logique de création de menu.

---

## Settings

Responsable :

* profil restaurant
* staff
* invitations
* paramètres

---

## Billing (Monétisation)

Responsable :

* abonnements (Stripe Checkout)
* portail client (Stripe Customer Portal)
* interception des webhooks
* application des limites du forfait SaaS

---

# Gestion du Staff

Rôles autorisés :

```txt
OWNER
WAITER
CASHIER
KITCHEN
```

Les permissions doivent être contrôlées :

* dans Supabase RLS
* dans le frontend

Jamais uniquement côté frontend.

---

# Stores Zustand

Les stores doivent être locaux à la feature.

Exemple :

```txt
features/cart/store/cart.store.ts
```

Interdit :

```txt
stores/
```

global contenant toute l'application.

---

# Types

Les types doivent rester proches de leur domaine.

Autorisé :

```txt
features/order/types.ts
features/menu/types.ts
```

Interdit :

```txt
types/index.ts
```

géant et centralisé.

---

# Validation

Toutes les entrées utilisateur doivent être validées avec Zod.

Exemples :

* création produit
* modification produit
* checkout
* invitation staff

Aucune donnée utilisateur ne doit atteindre Supabase sans validation.

---

# Temps Réel

Realtime obligatoire pour :

* nouvelles commandes
* changement de statut
* restaurant ouvert / fermé
* dashboard

Realtime interdit pour les données statiques.

---

# Performance

Toujours privilégier :

* Server Components
* Streaming
* Pagination
* Lazy Loading

Éviter :

* fetch inutiles
* re-renders inutiles
* duplication de données

---

# Philosophie

Les décisions doivent suivre cet ordre :

1. Simplicité
2. Lisibilité
3. Maintenabilité
4. Scalabilité
5. Performance

Jamais l'inverse.
