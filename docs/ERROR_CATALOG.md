# ERROR_CATALOG.md

# Catalogue des Codes d'Erreur

Tous les codes d'erreur retournés par le système doivent être standardisés pour permettre un traitement programmatique côté client (internationalisation, toast d'erreur).

## Codes Globaux
- `ERR_UNAUTHORIZED` : L'utilisateur n'est pas connecté ou sa session a expiré.
- `ERR_FORBIDDEN` : L'utilisateur n'a pas les droits nécessaires pour cette action.
- `ERR_VALIDATION` : Les données envoyées ne respectent pas le schéma Zod.
- `ERR_INTERNAL_SERVER` : Erreur non gérée côté serveur.

## Codes Métier - Menu & Builder
- `ERR_SLUG_IMMUTABLE` : Tentative de modification d'un slug de restaurant.
- `ERR_CATEGORY_NOT_EMPTY` : Tentative de suppression d'une catégorie contenant encore des produits.

## Codes Métier - Commandes & POS
- `ERR_ORDER_EMPTY` : Impossible de créer une commande sans produit.
- `ERR_ORDER_CANCELLED_LOCKED` : Impossible de modifier une commande déjà annulée ou terminée.
- `ERR_OUT_OF_STOCK` : Le produit demandé n'est plus disponible.

## Codes Métier - Settings & Staff
- `ERR_TOO_MANY_ACTIVE_INVITATIONS` : Plus de 10 invitations en attente.
- `ERR_INVITATION_EXPIRED` : Le lien d'invitation (24h) est obsolète.
