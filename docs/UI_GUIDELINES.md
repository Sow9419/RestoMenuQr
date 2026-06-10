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
- Privilégier les **Skeletons** (avec animation pulse douce) pour les listes.
- Spinners pour les actions de formulaire (encaissement, validation de commande).
