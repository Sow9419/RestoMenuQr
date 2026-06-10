# DATABASE.md

# Philosophie de la Base de Données

Le système utilise Supabase (PostgreSQL).
Toute la logique d'accès aux données doit être sécurisée par RLS (Row Level Security).
L'entité principale d'un produit est nommée `products` pour assurer une cohérence stricte avec la base de données relationnelle, remplaçant tout terme ambigu comme `items`.

---

## Modèle de Données Principal

### 1. `restaurants`
Contient les informations d'identité globale et le statut SaaS du restaurant.
- `id` (uuid, pk)
- `owner_id` (uuid, fk -> auth.users)
- `name` (text)
- `slug` (text, unique) — Slug immuable après création (`ERR_SLUG_IMMUTABLE`).
- `phone` (text) — Numéro WhatsApp/téléphone de contact officiel.
- `address` (text) — Adresse de l'établissement physique.
- `is_open` (boolean, default: true) — Statut d'ouverture instantané pour la cuisine.
- `logo_url` (text, nullable) — URL vers le logo stocké dans Supabase Storage.
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)
- `subscription_status` (text, default: 'inactive') /* active, canceled, past_due, inactive */
- `plan_type` (text, default: 'starter') /* starter, premium */
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

### 2. `profiles` (Staff & RBAC)
Rattache un utilisateur d'authentification Supabase à un rôle et un restaurant.
- `id` (uuid, pk)
- `user_id` (uuid, fk -> auth.users)
- `restaurant_id` (uuid, fk -> restaurants)
- `role` (enum: OWNER, WAITER, CASHIER, KITCHEN)
- `created_at` (timestamptz, default: now())

### 3. `categories`
Sections thématiques permettant de regrouper les produits du menu.
- `id` (uuid, pk)
- `restaurant_id` (uuid, fk -> restaurants)
- `name` (text)
- `sort_order` (int, default: 0)
- `created_at` (timestamptz, default: now())

### 4. `products`
Fiches détaillés des plats et boissons proposés.
- `id` (uuid, pk)
- `category_id` (uuid, fk -> categories)
- `name` (text)
- `description` (text)
- `price` (numeric)
- `is_available` (boolean, default: true)
- `image_url` (text, nullable)
- `sort_order` (int, default: 0)
- `sales_count` (int, default: 0) — Compteur incrémenté à chaque commande finalisée pour alimenter le Dashboard.
- `created_at` (timestamptz, default: now())

### 5. `page_settings`
Configuration visuelle et esthétique du menu par restaurant (Template Engine).
- `id` (uuid, pk)
- `restaurant_id` (uuid, fk -> restaurants, unique)
- `template_layout` (text, default: 'classic') /* 'classic' | 'card-grid' | 'premium' */
- `accent_color` (text, default: '#C2410C')
- `font_family` (text, default: 'Playfair Display')
- `hero_title` (text)
- `hero_description` (text)
- `hero_banner_url` (text, nullable)
- `display_mode` (text, default: 'light') /* 'light' | 'dark' */
- `overlay_opacity` (int, default: 40)
- `glassmorphism` (boolean, default: false)
- `density` (text, default: 'comfortable') /* 'compact' | 'comfortable' */
- `currency` (text, default: 'FCFA') /* 'FCFA' | 'EUR' | 'USD' */
- `updated_at` (timestamptz, default: now())

### 6. `page_sections`
Ordre et état de visibilité des grands blocs du menu public.
- `id` (uuid, pk)
- `restaurant_id` (uuid, fk -> restaurants)
- `section_key` (text) /* 'hero' | 'categories' | 'menu' | 'infos' | 'socials' */
- `label` (text)
- `is_enabled` (boolean, default: true)
- `sort_order` (int, default: 0)

### 7. `invitations`
Invitations envoyées pour intégrer de nouveaux membres d'équipe.
- `id` (uuid, pk)
- `restaurant_id` (uuid, fk -> restaurants)
- `invited_by` (uuid, fk -> auth.users)
- `email` (text)
- `role` (text) /* 'OWNER' | 'WAITER' | 'CASHIER' | 'KITCHEN' */
- `token` (text, unique) — Jalon d'accès sécurisé pour la route `/invite/[token]`.
- `status` (text, default: 'PENDING') /* 'PENDING' | 'ACCEPTED' | 'EXPIRED' */
- `expires_at` (timestamptz) — Date limite fixée à created_at + 24 heures.
- `created_at` (timestamptz, default: now())

### 8. `orders`
En-tête de la commande passée par les clients finaux ou saisie en caisse.
- `id` (uuid, pk)
- `restaurant_id` (uuid, fk -> restaurants)
- `status` (enum: PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED)
- `total_price` (numeric)
- `customer_name` (text, nullable)
- `ticket_number` (text) — Code court séquentiel (ex: #A12, #D07) généré par commande.
- `type` (text, default: 'DINE_IN') /* 'DINE_IN' | 'DELIVERY' */
- `whatsapp_number` (text, nullable) — Contact WhatsApp client.
- `delivery_address` (text, nullable) — Informations d'acheminement physique.
- `delivery_notes` (text, nullable) — Précisions additionnelles de préparation.
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

### 9. `order_items`
Détail unitaire des produits commandés.
- `id` (uuid, pk)
- `order_id` (uuid, fk -> orders)
- `product_id` (uuid, fk -> products)
- `quantity` (int, default: 1)
- `unit_price` (numeric)
- `selected_options` (jsonb, default: '[]') — Options sélectionnées par le client (suppléments, etc.).

---

## Row Level Security (RLS)

- **Public** : Lecture seule autorisée sur `restaurants`, `categories`, `products`, `page_settings` et `page_sections` en filtrant uniquement sur le `slug` unique ou l'ID publique du restaurant. La création d'une commande (`orders` et `order_items`) est publique, mais la lecture se limite aux commandes rattachées au cookie de session de suivi client (`orderId`).
- **Staff** : Accès complet de lecture et d'écriture partiel sur les `orders`, `order_items`, et les données du menu, basé sur l'authentification et le lien `restaurant_id` déduit depuis leur entrée correspondante dans `profiles`.
- **Owner** : Droits absolus d'édition et de suppression sur l'ensemble des entités liées à son `restaurant_id`.

---

## Migrations
Toutes les modifications de schéma doivent passer par des migrations SQL documentées sous forme de fichiers `.sql` de migration incrémentaux PostgreSQL.

