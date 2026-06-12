# ROLES_AND_PERMISSIONS.md

# Gestion des Rôles et Permissions

Le système inclut un modèle d'accès basé sur les rôles (RBAC).

## Liste des Rôles

- **OWNER** : Créateur ou gérant du restaurant. Droits totaux.
- **CASHIER** : Caissier ou manager de salle. Gestion des paiements.
- **WAITER** : Serveur. Contact avec le client.
- **KITCHEN** : Cuisinier ou chef. Préparation.

## Matrice des Permissions

| Fonctionnalité | OWNER | CASHIER | WAITER | KITCHEN |
|----------------|-------|---------|--------|---------|
| **Builder / Menu** | Full  | Read    | Read   | Read    |
| **Dashboard**      | Full  | Read    | None   | None    |
| **POS / Caisse**   | Full  | Full    | None   | None    |
| **Commandes**      | Full  | Full    | Create/Read/Update | Read/Update (Statut) |
| **Settings**       | Full  | None    | None   | None    |
| **Staff Invite**   | Full  | None    | None   | None    |
| **Billing & Plan** | Full  | None    | None   | None    |

---

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

Un utilisateur authentifié sans entrée dans `profiles` (ex : nouveau compte sans restaurant associé post-connexion OTP) est redirigé vers `/onboarding` pour créer ou rejoindre un restaurant. Aucun accès aux modules admin n'est accordé tant que ce profil est absent.

---

## Implémentation
Les vérifications se font sur deux couches :
1. **Frontend** : Masquage des éléments d'UI non autorisés.
2. **Backend (Supabase RLS & Server Actions)** : Rejet des transactions non autorisées, garante ultime de la sécurité.

---

## Rôle Réservé (Feature-gated)

- **ORG_OWNER** : Rôle présent dans l'enum `profiles.role` mais non activé dans l'UI ni dans la matrice de permissions actuelle. Sera exposé lors de l'activation de la feature multi-établissements. Sa permission : accès total en lecture sur tous les restaurants de son `organization_id`, gestion de l'abonnement Stripe groupe.
