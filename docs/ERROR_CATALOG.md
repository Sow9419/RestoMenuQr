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
- `ERR_TOO_MANY_ACTIVE_INVITATIONS` : Plus de 10 invitations actives ou en attente d'acceptation simultanées.
- `ERR_INVITATION_EXPIRED` : Le jalon d'accès invité (24h) est obsolète et inutilisable.
- `ERR_INVITATION_ALREADY_ACCEPTED` : Cet e-mail d'invitation a déjà été consommé par un utilisateur d'authentification valide.

## Codes d'Erreur Globaux Supplémentaires
- `ERR_SESSION_EXPIRED` : La session utilisateur ou les cookies d'authentification Supabase ont expiré, nécessitant une reconnexion Magic Link.
- `ERR_MAGIC_LINK_EXPIRED` : Le lien d'authentification OTP à usage unique a dépassé sa durée légale de validité.
- `ERR_MAGIC_LINK_ALREADY_USED` : Le lien d'accès direct par jeton a déjà été utilisé lors d'une précédente session d'initialisation.

## Codes Métier Supplémentaires - Menu & Commande Client
- `ERR_MENU_NOT_FOUND` : Le slug de restaurant spécifié dans l'URL n'est associé à aucun établissement enregistré en base.
- `ERR_RESTAURANT_CLOSED` : Le restaurant est enregistré comme momentanément fermé (`is_open = false`). Les commandes sont temporairement bloquées.
- `ERR_CART_EMPTY` : Tentative d'accès à l'achat ou de checkout avec un panier d'éléments vide localement.
- `ERR_CART_ITEM_UNAVAILABLE` : Un des plats ajoutés au panier a été désactivé (`is_available = false`) ou supprimé par l'administrateur depuis sa mise en panier. Identique à `ERR_OUT_OF_STOCK`.
- `ERR_INVALID_WHATSAPP` : Le numéro de téléphone mobile ou WhatsApp fourni pour confirmer la livraison n'est pas au format international requis.
- `ERR_DELIVERY_ADDRESS_REQUIRED` : L'adresse de livraison physique est obligatoire pour finaliser une commande de type `DELIVERY`.

## Codes de tarification SaaS & Plan Limitations
- `ERR_PLAN_LIMIT_REACHED` : Le restaurant a atteint son quota maximum de commandes autorisées pour le mois en cours (Starter Plan à 50 commandes).
- `ERR_SUBSCRIPTION_INACTIVE` : Les fonctionnalités Premium (caisse POS avancée, gestion d'équipe) sont inaccessibles car l'abonnement du tenant n'est pas actif (statut `past_due` ou `canceled`).

## Codes Réservés — Multi-Établissements (Feature-gated)

Ces codes existent dans le catalogue pour préparation mais ne sont pas retournés par l'application actuelle.

- `ERR_RESTAURANT_LIMIT_REACHED` : Le groupe a atteint le quota `max_restaurants` de son plan. Activé lors de l'ouverture de la feature multi-établissements.
- `ERR_NOT_ORGANIZATION_MEMBER` : Accès refusé — le restaurant cible n'appartient pas à l'organisation de l'utilisateur.

