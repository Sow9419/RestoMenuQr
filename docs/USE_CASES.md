# USE_CASES.md

# Catalogue Exhaustif des Cas d'Utilisation (Use Cases)

Ce document dresse l'inventaire officiel de tous les cas d'utilisation (UC-001 à UC-023) pris en charge par la plateforme QRMenu. Chaque cas spécifie l'acteur, le flux nominal, les préconditions et les erreurs typiques retournées.

---

## Module 1 : Onboarding & Menu (Builder)

### UC-001 : Création de Compte & Authentification Email OTP
* **Acteur principal :** Restaurant Owner, Staff
* **Préconditions :** Fournir une adresse e-mail valide.
* **Flux nominal :**
  1. L'utilisateur saisit son adresse e-mail.
  2. Le système génère et envoie un code de vérification OTP à 6 chiffres par e-mail (`supabase.auth.signInWithOtp()` configuré pour un code OTP).
  3. L'utilisateur saisit le code OTP reçu sur la page d'authentification.
  4. Le système valide le code (« verifyOtp ») et sa session d'authentification est initialisée avec succès.
* **Codes d'erreur :** `ERR_OTP_EXPIRED`, `ERR_OTP_INVALID`, `ERR_VALIDATION`

### UC-002 : Onboarding — Création du premier Restaurant (Organisation auto-créée)
* **Acteur principal :** Restaurant Owner
* **Préconditions :** Être authentifié.
* **Flux nominal :**
  1. Post-connexion (OTP valide), l'Owner est redirigé vers `/onboarding`.
  2. Saisit uniquement le **nom** et le **slug** de son restaurant.
  3. Le système crée atomiquement en arrière-plan : une `organizations` (même nom, même slug), le `restaurants`, un `profiles` (role: OWNER), un `page_settings` (valeurs par défaut) et les `page_sections` initiales.
  4. L'utilisateur est redirigé vers `/(admin)/[restaurantId]/builder`.
* **Note :** L'organisation est créée silencieusement. L'utilisateur ne la voit pas. Elle sera exposée lors de l'activation de la feature multi-établissements.
* **Codes d'erreur :** `ERR_SLUG_IMMUTABLE`, `ERR_VALIDATION`

### UC-003 : Création de Catégorie de Menu
* **Acteur principal :** Restaurant Owner
* **Préconditions :** Être authentifié comme `OWNER` rattaché au restaurant.
* **Flux nominal :**
  1. Renommer la nouvelle section de regroupement.
  2. Le système calcule le prochain niveau d'ordonnancement (`sort_order`).
  3. Crée la catégorie en base de données.
* **Codes d'erreur :** `ERR_VALIDATION`, `ERR_UNAUTHORIZED`

### UC-004 : Création de Produit
* **Acteur principal :** Restaurant Owner
* **Préconditions :** Au moins une catégorie existante.
* **Flux nominal :**
  1. Saisir le nom, la description facultative, le prix de vente et charger une image (Supabase Storage).
  2. Indexer le plat sous la catégorie sélectionnée.
  3. Enregistrer l'entité `products`.
* **Codes d'erreur :** `ERR_VALIDATION`, `ERR_UNAUTHORIZED`

### UC-005 : Réordonnancement de Menu par Glisser-Déposer (Drag & Drop)
* **Acteur principal :** Restaurant Owner
* **Flux nominal :**
  1. L'Owner réorganise les catégories ou les produits via l'interface d'édition.
  2. Le système met à jour de façon groupée de nombreux attributs `sort_order` via un lot d'actions.

---

## Module 2 : Expérience Client Public (Public Menu)

### UC-006 : Consultation du Menu Public
* **Acteur principal :** Customer (Dîner)
* **Préconditions :** Scanner le QR Code de la table ou disposer du lien URL du restaurant.
* **Flux nominal :**
  1. Le client accède à la route `/[slug]`.
  2. Le serveur Next.js charge en SSR les informations visuelles (`page_settings`, `page_sections`) et le catalogue de plats.
  3. Le client consulte les sections de manière fluide, même avec des goulots de chargement grâce à la légèreté du template.
* **Codes d'erreur :** `ERR_MENU_NOT_FOUND`, `ERR_RESTAURANT_CLOSED`

### UC-007 : Personnalisation Esthétique Temps Réel (Live Builder)
* **Acteur principal :** Restaurant Owner
* **Flux nominal :**
  1. Sélectionner un template parmi les structures (`classic`, `card-grid`, `premium`).
  2. Modifier l'accentuation colorée, le modèle de cartes ou la police.
  3. Le preview se rafraîchit à la volée. L'enregistrement sauvegarde dans la table `page_settings`.

### UC-008 : Gestion de Panier d'Achat local
* **Acteur principal :** Customer
* **Flux nominal :**
  1. Cliquer sur le bouton "+" d'un plat pour l'ajouter au panier.
  2. Ajuster à la hausse ou à la baisse la quantité d'éléments.
  3. Le panier se met à jour localement dans le `LocalStorage` via Zustand.

### UC-009 : Prise de Commande sur Table (Dine-In)
* **Acteur principal :** Customer
* **Préconditions :** Le restaurant est ouvert (`is_open = true`). Le panier client contient au moins un article disponible.
* **Note MVP :** La notion de numéro de table physique est hors scope MVP. Le `ticket_number` généré (ex: `#A34`) suffit pour l'identification au comptoir. La gestion de tables numérotées sera traitée en post-MVP.
* **Flux nominal :**
  1. Accéder au checkout et renseigner son nom.
  2. Confirmer la commande sans coordonnées de livraison.
  3. Le système génère un ticket court type `#A34` et bascule l'état d'affichage vers la cuisine immédiatement.

### UC-010 : Prise de Commande à Emporter ou Livraison (Delivery)
* **Acteur principal :** Customer
* **Flux nominal :**
  1. Sélectionner l'aiguillage "Livraison".
  2. Saisir l'adresse de destination, les notes de livraison et un numéro WhatsApp de contact officiel.
  3. Confirmer l'envoi. Un résumé s'affiche, offrant un raccourci direct d'envoi de la commande pré-remplie par message sur l'application WhatsApp pour validation.
* **Codes d'erreur :** `ERR_DELIVERY_ADDRESS_REQUIRED`, `ERR_INVALID_WHATSAPP`

---

## Module 3 : Suivi & Gestion en Cuisine (Orders)

### UC-011 : Alerte instantanée en Cuisine
* **Acteur principal :** Kitchen Staff
* **Flux nominal :**
  1. Lorsqu'une commande `PENDING` entre en base, le canal de realtime Supabase envoie l'événement à la vue cuisine.
  2. Un signal visuel (alerte clignotante) et un bourdonnement sonore retentissent en continu tant qu'elle n'est pas acceptée.

### UC-012 : Flux de Préparation en Cuisine
* **Acteur principal :** Kitchen Staff
* **Flux nominal :**
  1. Le cuisinier clique sur "Confirmer" pour basculer de `PENDING` à `CONFIRMED` (stoppe l'alarme audio).
  2. Clique sur "Commencer la préparation" (`PREPARING`).
  3. Une fois achevé, bascule à `READY`.

### UC-013 : Notification Commande Prête
* **Acteur principal :** Customer
* **Flux nominal :**
  1. Dès que le statut de commande devient `READY`, la page de suivi client (`/[slug]/tracking`) se met instantanément à jour sans rafraîchissement manuel de page grâce au Realtime.

---

## Module 4 : Caisse & Point de Vente (POS)

### UC-014 : Saisie de commande Serveur (POS)
* **Acteur :** Waiter, Cashier, Owner
* **Flux nominal :**
  1. Le serveur saisit manuellement les produits commandés par un client sur l'interface POS d'administration d'une table sans smartphone.
  2. Valide la transaction qui entre directement au statut `CONFIRMED`.

### UC-015 : Clôture & Encaissement Caisse
* **Acteur :** Cashier
* **Flux nominal :**
  1. Cliquer sur "Encaisser" pour une commande prête (`READY`).
  2. Choisir le canal de règlement utilisé : Espèces (Cash) ou Mobile Money (Wave, Orange Money).
  3. Confirmer la clôture de transaction. La commande bascule alors définitivement à l'état `COMPLETED`.

---

## Module 5 : Analyse & Administration (Dashboard / Settings / Billing)

### UC-016 : Consultation d'Historique complet des transactions
* **Acteur :** Cashier, Owner
* **Flux nominal :**
  1. Accéder à l'historique d'administration des commandes.
  2. Trier selon la date de clôture, le numéro de ticket ou filtrer sur les commandes annulées.

### UC-017 : Analyse d'Activité sur le Dashboard
* **Acteur :** Restaurant Owner
* **Flux nominal :**
  1. Consulter les indicateurs clés du jour actualisés en direct (Chiffre d'affaires total du jour, volume global de commandes, panier moyen).
  2. Visualiser le top 5 des plats les plus commandés déterminés à partir de la colonne `products.sales_count`.

### UC-018 : Souscription d'Abonnement SaaS Premium
* **Acteur :** Restaurant Owner
* **Flux nominal :**
  1. L'Owner clique sur un appel à l'action d'activation Premium.
  2. Le système l'aiguille vers une page sécurisée de paiement par carte bancaire Stripe Checkout.
  3. Une fois validé, Stripe émet un webhook et le statut de facturation dans `organizations.subscription_status` se met à jour à `active`.
* **Note architecture :** La session Stripe Checkout est créée pour l'`organization_id`, pas le `restaurant_id`. Ce comportement est actif dès le Jour 1 (même pour les utilisateurs single-restaurant, de façon transparente).

### UC-019 : Édition de Paramètres Généraux du Restaurant
* **Acteur :** Restaurant Owner
* **Flux nominal :**
  1. Modifier le fuseau horaire, le numéro de téléphone, l'adresse postale ou le logo de l'enseigne dans les paramètres.
  2. Le système sauvegarde les modifications en base.

### UC-020 : Gestion de Statut de fermeture d'urgence (En temps réel)
* **Acteur :** Restaurant Owner, Cashier
* **Flux nominal :**
  1. Un curseur switch d'administration permet de passer à l'état fermé d'un clic.
  2. Le champ `restaurants.is_open` bascule à `false`, propageant une alerte immédiate d'interdiction de commande sur les écrans de tous les clients connectés.

### UC-021 : Recrutement d'Équipe par Mail (Invitations d'accès)
* **Acteur :** Restaurant Owner
* **Flux nominal :**
  1. Saisir l'adresse de messagerie d'un collaborateur et lui assigner un rôle.
  2. Le système vérifie que la limite de 10 invitations actives n'est pas atteinte.
  3. Génère un token cryptique aléatoire d'onboarding valide 24 heures et l'enregistre dans `invitations`.
* **Codes d'erreur :** `ERR_TOO_MANY_ACTIVE_INVITATIONS`, `ERR_VALIDATION`

### UC-022 : Acceptation d'invitation Staff
* **Acteur :** Invité (Staff)
* **Flux nominal :**
  1. Le futur employé clique sur le lien d'acceptation `/invite/[token]`.
  2. Le système vérifie l'expiration et l'état d'acceptation du jeton en base.
  3. L'employé crée son compte avec la méthode OTP Email et est rattaché avec le rôle ciblé au `restaurant_id` lié de l'invitation dans la table `profiles`.
* **Codes d'erreur :** `ERR_INVITATION_EXPIRED`, `ERR_INVITATION_ALREADY_ACCEPTED`

### UC-023 : Résiliation / Changement de Moyen de Paiement
* **Acteur :** Restaurant Owner
* **Flux nominal :**
  1. L'Owner clique sur "Gérer mon abonnement" depuis ses paramètres.
  2. Le serveur Next.js appelle Stripe pour obtenir une URL de redirection d'accès au portail autonome "Stripe Customer Portal".
  3. L'Owner effectue ses modifications ou résilie son plan souverainement avant d'être reconnecté au menu d'administration.

---

## Use Cases Feature-gated (Multi-Établissements — Post-PMF)

> Ces use cases sont documentés pour préparation mais **non implémentés** dans la version actuelle. Ils seront activés via feature flag lorsque le premier client "groupe" se présentera.

### UC-024 : Ajout d'un Établissement au Groupe
* **Acteur :** Organization Owner (rôle ORG_OWNER activé)
* **Préconditions :** Feature multi-établissements activée. Plan Premium ou Enterprise.
* **Flux nominal :**
  1. Depuis l'Org Hub (nouvelle route `/(admin)/org/[orgId]/`), cliquer "Ajouter un établissement".
  2. Saisir nom + slug du nouveau restaurant.
  3. Vérification du quota `max_restaurants`.
  4. Création atomique : `restaurants` + `page_settings` + `page_sections` defaults.
* **Codes d'erreur :** `ERR_RESTAURANT_LIMIT_REACHED`, `ERR_SLUG_IMMUTABLE`

### UC-025 : Sélection et Bascule d'Établissement Actif
* **Acteur :** Organization Owner
* **Flux nominal :**
  1. Sélectionner un restaurant dans le switcher de la sidebar.
  2. Navigation vers `/(admin)/[restaurantId]/dashboard` de l'établissement choisi.
