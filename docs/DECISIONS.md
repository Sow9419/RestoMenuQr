# DECISIONS.md

# Architecture Decision Records (ADRs)

Ce fichier consigne les choix structuraux majeurs du projet.

## 001 - Fullstack Framework
**Décision** : Utiliser Next.js 15+ (App Router).
**Raison** : Simplifie la gestion du routing, du server-side rendering pour le chargement des menus publics, et intègre parfaitement les Server Actions.

## 002 - State Management
**Décision** : Utiliser Zustand pour les états complexes locaux (ex: Panier/CartStore). Ne pas tout globaliser.
**Raison** : Zustand est très léger, évite le boilerplate de Redux et les renders inutiles du React Context natif.
**Implémentation :** Chaque store Zustand est localisé dans le dossier `/features/[feature-name]/store/[name].store.ts`. Aucun répertoire global `stores/` n'est autorisé.

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

## 013 - (Consolidé avec ADR-002)
ADR-013 précisait l'organisation physique des stores Zustand en dossiers `/features/*/store/`.
Ce principe est désormais intégré directement dans ADR-002 en tant que règle d'implémentation.
Voir : `ARCHITECTURE.md` → section "Stores Zustand".

## 014 - Stratégie Schema-ready pour le Multi-Établissements
**Décision** : Introduire la table `organizations` et ses FKs dans le schéma dès le Jour 1, avec création automatique et transparente d'une organisation 1:1 à chaque inscription. La facturation Stripe est rattachée à `organizations`. Aucune UI multi-restaurant n'est exposée à ce stade.
**Raison** : Évite une migration de données coûteuse le jour où la feature est activée (ajouter `organization_id` sur des tables avec des millions de lignes est un risque opérationnel majeur). Le coût de l'intégrer proprement dès le début est de ~0.5 sprint vs 3-4 sprints en retrofit.

## 015 - Rôle ORG_OWNER Dormant dans l'Enum
**Décision** : Inclure `ORG_OWNER` dans l'enum `profiles.role` dès la création du schéma, sans l'exposer dans l'UI ou les permissions actuelles.
**Raison** : Modifier un enum PostgreSQL sur une table en production avec des données existantes nécessite un verrou de table et peut causer des indisponibilités. L'inclure dès le départ coûte zéro.

