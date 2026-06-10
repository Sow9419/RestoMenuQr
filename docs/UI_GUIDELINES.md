# UI_GUIDELINES.md

# Directives d'Interface Utilisateur

## Principes Fondamentaux
- **Mobile-first** : L'interface client est conçue en priorité pour les smartphones.
- **Accessibilité** : Contraste suffisant, zones de clic (minimum 44px sur mobile).
- **Feedback** : Toute action (clic, swipe, soumission) doit avoir un retour visuel (toast, spinner, animation).

## Bibliothèque de Composants
Nous utilisons **shadcn/ui** avec **Tailwind CSS**.

### Personnalisation shadcn/ui
- Ne pas utiliser les couleurs par défaut. Référer au `DESIGN_SYSTEM.md`.
- Les icônes proviennent de `lucide-react`.

## Animations
Utilisation de `motion/react` (Framer Motion) uniquement pour des transitions métier :
- Apparition de cartes.
- Modal (fade + scale).
- Swipe down pour rafraîchir.

## États de Chargement
- Privilégier les **Skeletons** (avec animation pulse douce) pour les listes et grilles de produits.
- Spinners légers pour les actions de formulaire (encaissement, validation de commande).

---

## 1. Gestion du Mode Hors-ligne (Offline Pattern)

Pour garantir une expérience utilisateur transparente en cas d'instabilité réseau typique des connexions mobile (3G/4G instable) :
* **Bandeau de Statut :** Dès que l'API de détection réseau du navigateur signale la perte de signal (`window.addEventListener('offline', ...)`), un bandeau d'alerte orange persistant non bloquant s'affiche subtilement en haut du menu public avec le texte : *"Connexion réseau interrompue. Vos opérations sont stockées localement."*
* **Sauvegarde des actions :** Le panier et les informations utilisateur actuelles sont immédiatement vérifiés et sauvegardés dans le `LocalStorage`.
* **Retry avec Backoff exponentiel :** Une logique de tentative automatique de reconnexion s'active toutes les 5, 10 puis 30 secondes pour resynchroniser les états dès le retour du réseau, rechargeant alors le panier et autorisant l'envoi de la commande bloquée.

---

## 2. Guide d'implémentation des Skeletons (Skeletons Pattern)

Les écrans ne doivent jamais clignoter ou rester blancs lors du chargement des données.
* **Menu Public (Plats) :** Afficher un empilement de 3 boîtes grises palpitantes munies de coins arrondis de type `rounded-2xl` imitant parfaitement la disposition `ProductCard` (un carré pour l'image, une ligne large pour le titre, une ligne plus courte pour la description).
* **Indicateurs KPI du Dashboard :** 3 grands blocs carrés palpitant (`animate-pulse`) calqués sur l'échelle de gris `stone-200` d'une hauteur fixe de 112px.

---

## 3. Points de rupture et adaptabilité (Breakpoints)

* **Mobile (Écrans < 640px) :** Priorité absolue. Disposition en une seule colonne de cartes détaillées avec un accès immédiat au panier collé au pouce (Sticky bottom zone).
* **Tablette (640px à 1024px) :** Transition vers une grille à 2 colonnes pour l'affichage des produits. Zone latérale fine pour le récapitulatif du panier.
* **Desktop (> 1024px, POS Admin & Dashboard) :** Densité d'informations maximale. Séparation stricte avec barres latérales fixes et fenêtres d'interaction (Panels côte à côte).

---

## 4. Gestes et interactions tactiles (Touch UI & Swipes)

Pour se rapprocher d'une application native fluide :
* **Panier et Options :** S'ouvrent depuis le bas de l'écran dans des tiroirs coulissants (Drawers) plutôt que de grands modals centrés inconfortables à fermer au pouce.
* **Fermeture instinctive :** Possibilité de balayer le composant coulissant vers le bas (Swipe-down gesture supporté par `motion/react`) pour le refermer de manière naturelle.

---

## 5. Système de Notifications Éphémères (Toasts)

* **Position :** Toujours en bas au centre (`bottom-center`) sur mobile pour rester lisible et atteignable, et en haut à droite (`top-right`) sur grand écran.
* **Durée d'affichage :**
  * *Notification simple :* Fermeture automatique après 3 secondes.
  * *Alerte critique ou Erreur :* Reste affiché (Sticky) jusqu'à ce que l'utilisateur clique explicitement sur l'icône de fermeture.

---

## 6. États Vides (Empty States)

Chaque liste vide (Panier vide, historique de commandes vide, aucune catégorie créée) doit être valorisée théâtralement :
* Une illustration ou une icône élégante de la bibliothèque `lucide-react` teintée en gris chaud (`text-text-muted`).
* Un titre et un sous-titre explicatifs détaillant la marche à suivre ("Votre panier est vide pour l'instant", "Ajoutez des plats délicieux depuis le menu").
* Un bouton principal visible appelant directement à l'action pour débloquer l'utilisateur ("Retourner au menu", "Créer un plat").

---

## 7. Bannière d'installation PWA (Custom PWA Prompt)

Pour capter le client régulier sans l'importuner :
* Écouter l'événement `beforeinstallprompt` et stocker l'invitation en mémoire.
* Ne pas afficher de pop-up agressive au premier chargement.
* Proposer un bouton discret intégré directement au pied de la page du menu public ("Ajouter QRMenu à mon écran d'accueil") pour déclencher manuellement la boîte d'installation officielle d'Android ou iOS.

