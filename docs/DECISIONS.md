# DECISIONS.md

# Architecture Decision Records (ADRs)

Ce fichier consigne les choix structuraux majeurs du projet.

## 001 - Fullstack Framework
**Décision** : Utiliser Next.js 15+ (App Router).
**Raison** : Simplifie la gestion du routing, du server-side rendering pour le chargement des menus publics, et intègre parfaitement les Server Actions.

## 002 - State Management
**Décision** : Utiliser Zustand pour les états complexes locaux (ex: Panier/CartStore). Ne pas tout globaliser.
**Raison** : Zustand est très léger, évite le boilerplate de Redux et les renders inutiles du React Context natif.

## 003 - Backend & Database
**Décision** : Utiliser Supabase.
**Raison** : Fournit PostgreSQL (relationnel solide), Auth, et Realtime clés en main, ce qui correspond aux besoins de gestion de restaurant et suivi en direct des commandes.

## 004 - Moteur de Menu Client
**Décision** : UI pilotée par la donnée (JSON configuratif) plutôt que génération de code.
**Raison** : Évite les failles d'injection de code, simplifie le stockage, et garantit que toutes les UI générées restent dans le scope du Design System.

## 005 - Authentification par Magic Link (Supabase Auth)
**Décision** : Préférer l'authentification Magic Link (Email OTP) sans mot de passe complexe pour l'ensemble du Staff et des Owners.
**Raison** : Simplifie l'expérience d'onboarding sur smartphone, élimine le risque de perte de mot de passe et réinitialisations interminables, et rehausse le niveau de sécurité général vis-à-vis des attaques par dictionnaire.

## 006 - Offline First & Persistance Panier (LocalStorage)
**Décision** : Le panier d'achat client et les informations d'identification de la table sont conservés localement dans le `LocalStorage` via Zustand.
**Raison** : Compense l'instabilité notoire des connexions mobiles 3G/4G locales, permettant à un client de composer sereinement son panier et de recharger sa page sans perte de contenu.

## 007 - Notifications Commandes via Supabase Realtime
**Décision** : Remplacer tout mécanisme de polling HTTP de statut (C-004) par des abonnements `Supabase Realtime` directs sur les tables indexées par `restaurant_id`.
**Raison** : Réduit de façon critique la charge du conteneur API Next.js et garantit une mise à jour d'état instantanée (latence inférieure à 150ms) en cuisine ou en caisse.

## 008 - Alerte Audio de Commande Cuisine
**Décision** : Déclencher un signal sonore récurrent lors de l'apparition d'une nouvelle commande `PENDING` sur la vue cuisine tant qu'elle n'est pas passée à `CONFIRMED`.
**Raison** : Les cuisiniers n'ont pas les yeux fixés en continu sur une tablette tactile. L'alarme sonore évite de rater des commandes et aligne le produit avec les conditions réelles d'un restaurant à forte affluence.

## 009 - Standardisation Multi-Devises (FCFA Préféré)
**Décision** : Gérer une colonne de devise textuelle dans `page_settings` avec le Franc CFA (FCFA) configuré par défaut.
**Raison** : Cible spécifiquement le marché de l'Afrique de l'Ouest (Sénégal, Côte d'Ivoire, etc.) tout en préservant la flexibilité d'ouvrir l'application à d'autres devises (EUR, USD) sans refonte logicielle.

## 010 - Canal WhatsApp pour la Validation Client
**Décision** : Intégrer un bouton d'envoi et un message pré-rempli redirigeant vers WhatsApp en tant que canal de secours pour valider la livraison.
**Raison** : S'adosse à un canal d'usage massif s'insérant parfaitement dans les habitudes transactionnelles d'onboarding locales sans surcoût de passerelle SMS traditionnelle.

## 011 - Intégration Native Stripe Subscriptions
**Décision** : Déléguer l'inscription et la facturation SaaS à Stripe Checkout & Stripe Portal en utilisant une politique d'interception basée sur les Webhooks (`customer.subscription.*`).
**Raison** : Offre une gestion résiliente des renouvellements et des incidents bancaires de paiement sans surcharger la base de données PostgreSQL de logique comptable redondante.

## 012 - Isolation Multi-Tenant par RLS Strict
**Décision** : Appliquer une clause de Row Level Security (RLS) PostgreSQL systématique filtrant sur l'ID de session authentifié `auth.uid()` relié aux `profiles` sur toutes les entités de l'application.
**Raison** : Garantit une barrière d'isolation étanche absolue contre les attaques intra-tenants de fuite d'informations rattachés à des compétiteurs.

## 013 - Pas de Répertoire global `stores/`
**Décision** : Diviser les stores Zustand dans chaque dossier `/features/*/store/` associé de manière modulaire au lieu de maintenir un répertoire global désorganisé.
**Raison** : Renforce la cohésion d'architecture Feature First, limite le couplage technique et simplifie l'onboarding de nouveaux développeurs sur des modules spécifiques.

