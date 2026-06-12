# PLAN.md

# Plan de Développement et Implémentation (Wave Planning & Granular Checklist)

Ce document régit le cycle de développement complet de QRMenu jusqu'à la production. 
Il est structuré en **6 phases** définissant chacune **exactement 5 grands jalons (milestones)** stratégiques.
Sous chaque jalon, une **check-list technique ultra-granulaire** évite la génération d'un code prototype ou incomplet, pour garantir une qualité *Senior Enterprise-Ready*.

---

## Phase 1 : Fondations et Base de données

### 1-1. Initialisation & Conventions
- [ ] Configurer Next.js (App Router, Tailwind CSS, TypeScript in strict mode).
- [ ] Créer la structure globale des dossiers : `/features`, `/templates`, `/shared`.
- [ ] Configurer les alias d'importation dans `tsconfig.json` (`@/features/*`, `@/shared/*`, `@/templates/*`).
- [ ] Déclarer toutes les variables d'environnement nécessaires dans `.env.example`.
- [ ] Valider l'intégrité de la compilation initiale via le linter.

### 1-2. Interconnexion Supabase & Authentification
- [ ] Initialiser le client de base de données Supabase avec mécanismes de retry/timeout robustes.
- [ ] Établir la table `profiles` pour stocker les profils utilisateurs d'authentification rattachés à un `restaurant_id`.
- [ ] Établir le middleware Next.js pour la protection stricte des routes `/admin/*`.
- [ ] Configurer le flux d'inscription, de connexion et de réinitialisation de mot de passe (Offline-safe fallback).
- [ ] Associer automatiquement la création d'un utilisateur à un ID de locataire (Tenant multi-tenant).

### 1-3. Sécurisation par Row Level Security (RLS) & Accès Supabase (GRANTs)
- [ ] Activer RLS sur les tables : `restaurants`, `profiles`, `categories`, `products`, `page_settings`, `page_sections`, `invitations`, `orders`, `order_items`.
- [ ] Appliquer les autorisations d'accès explicites (`GRANT`) requises par les nouvelles règles de sécurité de l’API de données de Supabase (rôles `anon`, `authenticated`, `service_role`).
- [ ] Déclarer la politique RLS publique : lecture seule autorisée sur `restaurants`, `categories` et `products` utilisant uniquement le `slug` unique du restaurant.
- [ ] Déclarer les politiques RLS pour l'équipe (Staff/Owner) : opérations limitées aux lignes où `restaurant_id` correspond au profil de l'utilisateur connecté.
- [ ] Rédiger des scripts sql de validation pour prouver l'isolation absolue des tenants (Test de cloisonnement).
- [ ] Valider les contraintes de clés étrangères et d'unicité (Slug immuable) au niveau PostgreSQL.

### 1-4. Design System & Jetons Visuels (Tokens)
- [ ] Configurer les CSS Variables et le fichier Tailwind CSS conformément à `DESIGN_SYSTEM.md`.
- [ ] Intégrer les typographies Google Fonts : **Playfair Display** (Titres, plats) et **Source Sans 3** (Contrôles, corps).
- [ ] Implémenter les variables de couleur : Chaleur terracota (`#C2410C`), tons sable (`#F5F5F4`), neutre chaud (`#FAFAF9`).
- [ ] Créer la bibliothèque de composants atomiques de base dans `/shared/ui` (Boutons, Cards, Formulaires, Toasts).
- [ ] Garantir une zone tactile minimum de **44px sur mobile** pour tous les éléments interactifs.

### 1-5. Store Local (État Global Client)
- [ ] Structurer les slices Zustand pour l'interface globale et les préférences légères.
- [ ] Implémenter le middleware Zustand de sauvegarde persistante (Local Memory / Session / LocalStorage).
- [ ] Écrire le système de notification global (Toasts asynchrones) pour l'ensemble des modules d'UI.
- [ ] Prévoir les indicateurs de chargement (Skeletons animés par pulsation) pour les appels distants.

---

## Phase 2 : Construction du Moteur (Builder & Menu)

### 2-1. API de CRUD Menu (Actions Serveur)
- [ ] Écrire les schémas Zod pour la validation des structures de catégories et produits.
- [ ] Établir les Server Actions pour la création, mise à jour et suppression de catégories.
- [ ] Établir les Server Actions pour la création, mise à jour et suppression de produits.
- [ ] Implémenter la barrière métier : interdire la modification d'un slug de restaurant historique (`ERR_SLUG_IMMUTABLE`).
- [ ] Implémenter la barrière métier : empêcher la suppression d'une catégorie non vide (`ERR_CATEGORY_NOT_EMPTY`).

### 2-2. Interface du Builder de Menu
- [ ] Construire l'interface d'administration bureau (Desktop) de gestion des sections et des plats.
- [ ] Intégrer un sélecteur d'options/variantes pour les produits (Ex: choix de la cuisson, suppléments).
- [ ] Concevoir le système de tri par glisser-déposer (Drag & Drop) ou tri séquentiel fiable avec persistence en BDD.
- [ ] Gérer l'état de visibilité d'un produit instantanément (Interrupteur toggle "Produit Indisponible").
- [ ] Ajouter une prévisualisation réactive permettant de commuter l'affichage du menu final entre format mobile, tablette et desktop.

### 2-3. Schématisation JSON (Templates)
- [ ] Structurer la définition stricte du schéma JSON contenant les configurations esthétiques (Classic, Card Grid, Premium).
- [ ] Écrire le traducteur logique qui convertit les listes brutes de base de données en blocs JSON ordonnés.
- [ ] Créer les modèles JSON prédéfinis (Presets) pour les 3 thèmes pris en charge.
- [ ] Permettre la sauvegarde atomique des modifications esthétiques dans la table `page_settings` et l'ordre des sections dans la table `page_sections` via la Server Action `updatePageSettings`.

### 2-4. Moteur de Rendu Dynamique (Renderer)
- [ ] Concevoir le composant `<MenuRenderer />` qui interprète la structure JSON sans aucune faille d'injection.
- [ ] Intégrer les différents sous-composants requis par les layouts : Classic, Card Grid et Premium.
- [ ] Lier dynamiquement les palettes de couleurs sélectionnées via des CSS Variables injectées de façon sécurisée.
- [ ] Exclure de façon stricte toute utilisation des fonctions javascript dangereuses comme `eval()`.

### 2-5. Enregistrement des Médias & Upload
- [ ] Construire l'élément d'UI d'envoi d'image (Supportant ensemble le Drag-and-Drop et la sélection manuelle).
- [ ] Écrire la Server Action ou le processus client d'upload des médias vers Supabase Storage.
- [ ] Redimensionner et convertir les images en format optimisé d'affichage (WebP / AVIF) côté serveur ou client avant envoi.
- [ ] Sécuriser les droits d'écriture sur le bucket d'images Supabase Storage via des politiques de bucket adaptées.

---

## Phase 3 : Interface Client Publique (PWA)

### 3-1. Vue d'Affichage Publique du Menu
- [ ] Déployer la route dynamique publique `/[slug]` gérant l'hydration et le rendu SSR du Menu.
- [ ] Injecter les balises meta de SEO (Balises OpenGraph, Titre, Favicon personnalisés par restaurant).
- [ ] Appliquer le composant `<MenuRenderer />` à partir de la configuration lue dans la base de données.
- [ ] Gérer les cas d'établissement de restauration momentanément fermé (Rendu d'un écran d'attente soigné).
- [ ] Créer le générateur automatique de QR Code disponible dans le panneau d'administration de l'Owner.

### 3-2. Moteur de Panier Client (Zustand Cart)
- [ ] Implémenter le store `CartStore` localisé dans la feature `/features/cart`.
- [ ] Gérer l'ajout d'articles avec conservation stricte des options sélectionnées (Ex: "Steak bien cuit, double fromage").
- [ ] Gérer l'incrémentation, la décrémentation et la suppression d'un plat du panier.
- [ ] Prévoir la persistance automatique du panier d'achat de l'utilisateur (Résilience suite à fermeture involontaire du navigateur).
- [ ] Mettre en place un contrôle de synchronisation de prix (Le calcul des prix finaux se fait toujours par le serveur).

### 3-3. Processus de Validation (Checkout Client)
- [ ] Concevoir le formulaire mobile-first d'identification (Nom d'utilisateur et numéro de table ou option "Emporter").
- [ ] Effectuer une validation des champs en temps réel via des schémas de validation Zod dédiés.
- [ ] Présenter un récapitulatif détaillé d'avant-commande clair (Quantités, prix total, frais annexes éventuels).
- [ ] Ajouter une section "Instructions spéciales / Spécifications de préparation" pour le client.

### 3-4. Soumission de Commande
- [ ] Déclarer la Server Action de création de la commande et de peuplement de la table `order_items`.
- [ ] Implémenter la logique de verrouillage d'évaluation : interdire la création d'une commande vide (`ERR_ORDER_EMPTY`).
- [ ] Mettre en place la transition visuelle d'envoi (Désactivation des boutons, Loader asynchrone).
- [ ] Rediriger l'utilisateur vers une page de suivi personnalisée (`/[slug]/tracking/[orderId]`).

### 3-5. Support Mobile PWA & Résilience Réseau
- [ ] Structurer le fichier `manifest.json` requis pour la compatibilité Progressive Web App (PWA).
- [ ] Configurer un Service Worker adapté pour la mise en cache des assets statiques d'UI (Fallback Offline).
- [ ] Concevoir une alerte élégante et non intrusive (Banner out-of-network) en cas de déconnexion totale à Internet.
- [ ] Ajuster le chargement différé des images pour alléger la bande passante sous connexion mobile 3G/4G lente.

---

## Phase 4 : Logistique Opérationnelle (Commandes & POS)

### 4-1. Module Point de Vente (POS / Caisse)
- [ ] Créer une interface à haute densité d'information optimisée pour un écran de caisse de bar ou comptoir (POS).
- [ ] Intégrer les boutons d'achat rapide, de ticket personnalisé et de recherche de produits.
- [ ] Gérer l'enregistrement de transactions multiples sur place (Paiement direct en Espèces ou de type Mobile Money).
- [ ] Rendre possible le chargement fluide et la pré-impression d'un reçu thermique simplifié compatible imprimantes de caisse.

### 4-2. Système Temps Réel des Commandes (Realtime)
- [ ] Connecter le tableau de bord d'administration au flux Supabase Realtime (Abonnement au canal `orders` du restaurant).
- [ ] Déclencher un signal d'alerte sonore réglable (Notification sonore push) pour toute nouvelle commande PENDING.
- [ ] Animer l'apparition visuelle des nouvelles commandes sur l'écran (Transitions de balayage fluides et intuitives).
- [ ] Mettre à jour l'indicateur d'état dynamique de la commande chez le client à chaque transition serveur.

### 4-3. Workflow de Préparation en Cuisine
- [ ] Concevoir la vue d'affichage de cuisine simplifiée (Kitchen view) recensant uniquement les commandes actives.
- [ ] Permettre la transition rapide du statut de préparation d'une commande via de larges boutons tactiles.
- [ ] Imposer la séquence d'états logique : `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `COMPLETED` / `CANCELLED`.
- [ ] Empêcher la modification d'un statut sur une commande préalablement verrouillée ou annulée (`ERR_ORDER_CANCELLED_LOCKED`).

### 4-4. Tableau de bord Intuitif (Dashboard)
- [ ] Intégrer le moteur D3.js ou Recharts pour le rendu des ventes journalières et hebdomadaires.
- [ ] Afficher des statistiques clés : Volume des ventes (Chiffre d'Affaire), Panier Moyen, Nombre de Commandes.
- [ ] Mettre en place un outil de filtrage temporel fluide (Aujourd'hui, 7 derniers jours, ce mois).
- [ ] Concevoir l'affichage des plats les plus populaires commandés.

### 4-5. Résolution de Concurrence & Conflits
- [ ] Mettre en place une protection Optimiste de Locking : rejeter et alerter si deux employés tentent simultanément de mettre à jour le statut d'une commande.
- [ ] Écrire les messages d'erreur à l'écran de façon claire pour éviter les doublons de préparation en cuisine.

---

## Phase 5 : Monétisation SaaS & Administration (Stripe)

### 5-1. Modèle de Monetisation & Modélisation Stripe
- [ ] Déclarer la structure des abonnements configurés au sein de Stripe : Plan Gratuit (Starter limité à 50 commandes/mois, 1 template) et Plan Premium (Illimité, Multi-Layout, Staff).
- [ ] Documenter le mapping interne des droits logiques liés au statut de l'abonnement du restaurant.
- [ ] Créer les prix d'abonnements au sein du Dashboard Stripe (Mode bac à sable / Test).

### 5-2. Contrôles et Paramètres Avancés Administrateur
- [ ] Créer le formulaire de gestion générale du restaurant (Nom, logo, devises universelles, fuseau horaire).
- [ ] Configurer un bouton d'interrupteur global d'ouverture ou fermeture automatique des prises de commandes.

### 5-3. Workspace Management & Staff (RBAC)
- [ ] Concevoir le formulaire d'envoi d'invitation à un membre d'équipe avec ciblage de rôle (CASHIER, KITCHEN, WAITER).
- [ ] Imposer la barrière d'expiration d'invitation (Lien valide pendant 24h avec statut de rejet `ERR_INVITATION_EXPIRED`).
- [ ] Imposer la barrière SaaS : refuser l'envoi d'invitations au-delà de 10 invitations actives (`ERR_TOO_MANY_ACTIVE_INVITATIONS`).
- [ ] Créer l'écran `/invite/[code]` de confirmation sécurisé acceptant l'invitation et rattachant le profil.
- [ ] Appliquer le masquage systématique des fonctionnalités frontend selon les privilèges définis par la matrice RBAC.

### 5-4. Intégration Native Stripe Checkout & Portail client (Billing)
- [ ] Écrire la Server Action de création d'une session Stripe Checkout pour la souscription des restaurants.
- [ ] Mettre en place le bouton de redirection vers le Portail Client Stripe (Gestion d'annulation, factures et cartes de paiement).
- [ ] Intégrer un composant "Badge du Plan" et les bannières d'évaluation de quota (Alerte d'approche de limite de commandes gratuites).

### 5-5. Synchro Asynchrone (Webhooks)
- [ ] Mettre en place la route d'API POST pure `app/api/webhooks/stripe/route.ts`.
- [ ] Parser le payload brut et valider rigoureusement la signature Stripe Webhook (`stripe-signature`).
- [ ] Intercepter les évènements `customer.subscription.created`, `customer.subscription.updated` et `customer.subscription.deleted`.
- [ ] Mettre à jour en base de données PostgreSQL la colonne `subscription_status` et `plan_type` du restaurant associé.
- [ ] Déployer le garde-barrière (Guard middleware / Action level) bloquant les commandes publiques ou l'administration si la licence a expiré.

---

## Phase 6 : Validation, Sécurité & Production

### 6-1. Audit Complet de Sécurité (RLS & Droits)
- [ ] Mener des tests d'injection réseau pour confirmer qu'un utilisateur n'appartenant pas à un restaurant ne peut pas modifier un plat ou voir une commande liée.
- [ ] Éliminer toute faille d'affichage de données sensibles (Membres du personnel hors tenant).

### 6-2. QA Automatisée (Validation Tests)
- [ ] Résoudre l'ensemble des erreurs de typage TypeScript (`any` ou références incorrectes).
- [ ] Lancer la validation linter locale via l'outil système (`lint_applet`).
- [ ] Confirmer que le build global webpack/next compile sans aucun avertissement fatal via l'outil d'environnement (`compile_applet`).

### 6-3. Senior Review-Code & Refactor
- [ ] Supprimer les consoles log, imports non exploités, variables mortes ou doublons de style CSS.
- [ ] S'assurer que chaque bouton possède son identifiant unique HTML (`id`) pour le ciblage et le rendu.

### 6-4. Optimisations Performance Client (LCP)
- [ ] Valider l'application du CDN pour les images Supabase Storage.
- [ ] Optimiser les polices d'écriture en utilisant le mécanisme natif `next/font/google`.
- [ ] S'assurer du bon lazy-loading de la partie analytique (Recharts/D3.js) sur l'écran du tableau de bord.

### 6-5. Transition Finale & Livraison
- [ ] Rédiger une documentation propre d'utilisation (Prise en main simplifiée pour le restaurateur).
- [ ] Mettre en production définitive, et fêter le succès d'un projet haut de gamme !
