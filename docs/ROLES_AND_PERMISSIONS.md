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

## Implémentation
Les vérifications se font sur deux couches :
1. **Frontend** : Masquage des éléments d'UI non autorisés.
2. **Backend (Supabase RLS & Server Actions)** : Rejet des transactions non autorisées, garante ultime de la sécurité.
