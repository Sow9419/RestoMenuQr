# PRODUCT.md

# Produit

QRMenu est une plateforme SaaS permettant aux restaurants de créer un menu digital accessible via QR Code.

Le produit est construit autour d'une architecture :

* Multi-tenant
* Mobile-first
* Serverless
* Template-driven
* Temps réel (Realtime)

Stack :

* Next.js App Router
* TypeScript
* Supabase
* TailwindCSS
* shadcn/ui
* Zustand

---

# Vision

Permettre à un restaurant de :

1. Créer son menu digital
2. Recevoir des commandes
3. Gérer la préparation
4. Encaisser les clients
5. Gérer son personnel

sans application mobile native.

---

# Personae

## Restaurant Owner

Responsable du restaurant.

Peut :

* gérer le menu
* gérer les commandes
* gérer la caisse
* gérer le personnel
* modifier les paramètres

---

## Waiter

Serveur.

Peut :

* créer une commande
* modifier une commande
* suivre une commande

Ne peut pas :

* modifier les paramètres
* gérer le personnel

---

## Cashier

Caissier.

Peut :

* encaisser
* clôturer les paiements
* imprimer les tickets

---

## Kitchen

Cuisine.

Peut :

* voir les commandes
* changer le statut de préparation

---

## Customer

Client final.

Peut :

* consulter le menu
* ajouter au panier
* commander
* suivre sa commande

---

# Modules Produit

## Builder

Gestion du menu.

Responsabilités :

* catégories
* produits
* options
* disponibilité
* templates
* personnalisation

---

## Dashboard

Vue globale du restaurant.

Responsabilités :

* statistiques
* commandes du jour
* ventes
* indicateurs clés

---

## Orders

Gestion opérationnelle.

Responsabilités :

* création
* suivi
* changement de statut
* historique

---

## POS

Point de vente.

Responsabilités :

* encaissement
* clôture
* reçus
* gestion des paiements

---

## Settings

Paramètres du restaurant.

Responsabilités :

* profil
* staff
* configuration générale

---

# Business Modèle & Monétisation (SaaS)

Le projet intègre un modèle économique de type **Freemium / Premium SaaS** propulsé par **Stripe**. 

## Tiers d'abonnement

1. **Plan Starter (Gratuit / Essai)**
   * Limité à un nombre défini de commandes par mois (ex: 50).
   * Accès à un seul template (Classic).
   * Aucune gestion de staff (Owner uniquement).
   * Publicité "Propulsé par QRMenu" ou branding appliqué.

2. **Plan Premium / Pro (Payant)**
   * Commandes illimitées via le QR Code.
   * Accès à tous les designs et personnalisations premium.
   * Gestion d'équipe et rôles (CASHIER, KITCHEN, WAITER).
   * Caisse complète (POS) et suppression complète de la signature publicitaire.

## Cycle de Facturation & Stripe

* Intégration via Stripe Checkout.
* Gestion de compte via le Customer Portal de Stripe.
* Restrictions logicielles basées sur le statut de l'abonnement répliqué (via Stripe Webhooks) dans Supabase `restaurants`.

---

# MVP Scope

Le MVP doit inclure uniquement :

## Builder

* CRUD catégories
* CRUD produits
* activation/désactivation produits
* ordre manuel catégories
* ordre manuel produits

---

## Templates

Templates disponibles :

* Classic
* Card Grid
* Premium

Maximum 3 templates pour le MVP.

---

## Public Menu

* affichage menu
* panier
* checkout
* suivi commande

---

## Orders

Statuts :

* PENDING
* CONFIRMED
* PREPARING
* READY
* COMPLETED
* CANCELLED

---

## POS

* paiement espèces
* paiement mobile money

---

## Settings

UC-019
UC-020
UC-021

---

# Règles Métier

## Restaurant

Un restaurant possède :

* un owner unique
* plusieurs employés
* plusieurs catégories
* plusieurs produits
* plusieurs commandes

---

## Slug

Le slug est unique.

Le slug est immuable après création.

Erreur :

ERR_SLUG_IMMUTABLE

---

## Invitation Staff

Expiration :

24 heures

Maximum :

10 invitations actives

Erreur :

ERR_TOO_MANY_ACTIVE_INVITATIONS

---

## Commandes

Une commande appartient toujours à un restaurant.

Une commande contient au minimum un item.

---

## Produits

Un produit appartient à une seule catégorie.

---

# Hors Scope MVP

Ne pas implémenter :

* réservation de table
* programme fidélité
* coupons
* marketplace multi-restaurants
* paiement en ligne Stripe
* gestion des stocks
* comptabilité avancée
* application mobile native

---

# Temps Réel

Realtime obligatoire pour :

* nouvelles commandes
* changement statut commande
* statut restaurant ouvert/fermé
* mise à jour dashboard

---

# Architecture Produit

Builder
↓
Template JSON
↓
Renderer
↓
Menu Public

Le Builder ne génère jamais du code.

Le Builder génère uniquement une configuration JSON.

---

# Objectif Produit

Le système doit rester :

* rapide
* simple
* maintenable
* scalable

Chaque fonctionnalité doit être évaluée selon :

1. valeur utilisateur
2. simplicité d'implémentation
3. maintenabilité
4. coût d'évolution
