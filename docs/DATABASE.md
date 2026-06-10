# DATABASE.md

# Philosophie de la Base de Données

Le système utilise Supabase (PostgreSQL).
Toute la logique d'accès aux données doit être sécurisée par RLS (Row Level Security).

## Modèle de Données Principal

### `restaurants`
- `id` (uuid, pk)
- `owner_id` (uuid, fk -> auth.users)
- `name` (text)
- `slug` (text, unique)
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)
- `subscription_status` (text, nullable) /* ex: active, canceled, past_due */
- `plan_type` (text, default: 'starter')
- `created_at` (timestamptz)

### `profiles` (Staff)
- `id` (uuid, pk)
- `user_id` (uuid, fk -> auth.users)
- `restaurant_id` (uuid, fk -> restaurants)
- `role` (enum: OWNER, WAITER, CASHIER, KITCHEN)

### `categories`
- `id` (uuid, pk)
- `restaurant_id` (uuid, fk -> restaurants)
- `name` (text)
- `sort_order` (int)

### `products`
- `id` (uuid, pk)
- `category_id` (uuid, fk -> categories)
- `name` (text)
- `description` (text)
- `price` (numeric)
- `is_available` (boolean)
- `image_url` (text, nullable)
- `sort_order` (int)

### `orders`
- `id` (uuid, pk)
- `restaurant_id` (uuid, fk -> restaurants)
- `status` (enum: PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED)
- `total_price` (numeric)
- `customer_name` (text, nullable)
- `created_at` (timestamptz)

### `order_items`
- `id` (uuid, pk)
- `order_id` (uuid, fk -> orders)
- `product_id` (uuid, fk -> products)
- `quantity` (int)
- `unit_price` (numeric)

## Row Level Security (RLS)

- **Public** : Lecture seule autorisée sur `restaurants`, `categories`, `products` via le `slug` du restaurant.
- **Staff** : Accès étendu (visibilité sur les `orders`, etc.) basé sur la table `profiles`.
- **Owner** : Tous les droits sur les entités liées à son `restaurant_id`.

## Migrations
Toutes les modifications de schéma doivent passer par des migrations SQL documentées.
