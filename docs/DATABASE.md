# DATABASE.md

# Philosophie de la Base de Données

Le système utilise Supabase (PostgreSQL).
Toute la logique d'accès aux données doit être sécurisée par RLS (Row Level Security).
L'entité principale d'un produit est nommée `products` pour assurer une cohérence stricte avec la base de données relationnelle, remplaçant tout terme ambigu comme `items`.

---

## Modèle de Données Principal

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

### 1. `restaurants`
Contient les informations d'identité globale et le statut SaaS du restaurant.
- `id` (uuid, pk)
- `owner_id` (uuid, fk -> auth.users)
- `organization_id` (uuid, fk -> organizations, not null) — Organisation propriétaire.
- `name` (text)
- `slug` (text, unique) — Slug immuable après création (`ERR_SLUG_IMMUTABLE`).
- `phone` (text) — Numéro WhatsApp/téléphone de contact officiel.
- `address` (text) — Adresse de l'établissement physique.
- `is_open` (boolean, default: true) — Statut d'ouverture instantané pour la cuisine.
- `logo_url` (text, nullable) — URL vers le logo stocké dans Supabase Storage.
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

### 2. `profiles` (Staff & RBAC)
Rattache un utilisateur d'authentification Supabase à un rôle et un restaurant.
- `id` (uuid, pk)
- `user_id` (uuid, fk -> auth.users)
- `restaurant_id` (uuid, fk -> restaurants)
- `organization_id` (uuid, fk -> organizations, not null) — Organisation de rattachement.
- `role` (enum: ORG_OWNER, OWNER, WAITER, CASHIER, KITCHEN)
-- Note : ORG_OWNER est réservé à l'activation de la feature multi-établissements.
-- En mode single-restaurant actuel, tous les propriétaires ont le rôle OWNER.
- `created_at` (timestamptz, default: now())

### 3. `categories`
Sections thématiques permettant de regrouper les produits du menu.
- `id` (uuid, pk)
- `restaurant_id` (uuid, fk -> restaurants)
- `name` (text)
- `icon` (text, default: 'Utensils') — Nom de l'icône lucide-react associée à la catégorie (ex: 'Pizza', 'CupSoda', 'Beef').
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
- `organization_id` (uuid, fk -> organizations, not null) — Organisation émettrice.
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

- **Organizations** : Lecture/écriture uniquement par le `owner_id` correspondant à `auth.uid()`. Aucun accès public.
- **Note Feature-gated** : Les politiques RLS cross-restaurant (permettant à un ORG_OWNER d'accéder à plusieurs restaurants) ne sont pas implémentées à ce stade. En mode actuel, chaque `organization` contient exactement 1 `restaurant` — la politique restaurant-level est donc suffisante. Les politiques org-level seront ajoutées lors de l'activation de la feature.
- **Public** : Lecture seule autorisée sur `restaurants`, `categories`, `products`, `page_settings` et `page_sections` en filtrant uniquement sur le `slug` unique ou l'ID publique du restaurant. La création d'une commande (`orders` et `order_items`) est publique, mais la lecture se limite aux commandes rattachées au cookie de session de suivi client (`orderId`).
- **Staff** : Accès complet de lecture et d'écriture partiel sur les `orders`, `order_items`, et les données du menu, basé sur l'authentification et le lien `restaurant_id` déduit depuis leur entrée correspondante dans `profiles`.
- **Owner** : Droits absolus d'édition et de suppression sur l'ensemble des entités liées à son `restaurant_id`.

---

## Migrations
Toutes les modifications de schéma doivent passer par des migrations SQL documentées sous forme de fichiers `.sql` de migration incrémentaux PostgreSQL.

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
CREATE INDEX idx_restaurants_organization_id ON restaurants(organization_id);
CREATE INDEX idx_profiles_organization_id    ON profiles(organization_id);
CREATE INDEX idx_invitations_organization_id ON invitations(organization_id);
```
