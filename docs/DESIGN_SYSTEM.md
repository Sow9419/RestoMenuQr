**Source de vérité visuelle du projet.**
> Tous les composants, tokens, typographies et règles de style sont définis ici.
> L'IA génère du code Tailwind uniquement à partir de ces valeurs — jamais de valeurs arbitraires.
> Mobile-first · PWA · Warm & Craft aesthetic

---

## Philosophie

Ember Studio adapté au monde de la restauration : chaleur terracotta comme couleur d'action,
tons sable et crème pour les surfaces, sérif Playfair pour les noms de plats et titres,
Source Sans 3 pour l'UI fonctionnelle. L'interface doit transmettre **confiance, appétit et clarté**
— sur un écran Android sous connexion 4G variable.

---

## Tokens de couleur

### Configuration Tailwind (`tailwind.config.ts`)

```typescript
const colors = {
  // — Primary — Terracotta (CTAs, états actifs, focus rings)
  primary: {
    DEFAULT:  '#C2410C',   // terracotta — bouton principal, lien actif
    hover:    '#9A3412',   // burnt sienna — hover
    light:    '#FED7AA',   // amber-200 — fond badge statut, highlights légers
    ring:     'rgba(194,65,12,0.12)', // focus ring
  },

  // — Accent — Amber (notifications, badges, nouveautés)
  accent: {
    DEFAULT:  '#F59E0B',
    dark:     '#D97706',   // warning aussi
  },

  // — Surfaces
  bg:       '#FAFAF9',     // fond de page — warm white
  surface:  '#F5F5F4',     // cards, panels, inputs
  raised:   '#E7E5E4',     // hover rows, active tabs, surface elevated

  // — Textes
  text: {
    primary:   '#1C1917',  // near-black warm — titres, corps
    secondary: '#57534E',  // warm gray — descriptions, meta
    muted:     '#78716C',  // placeholders, timestamps
    inverse:   '#FAFAF9',  // texte sur fond sombre
  },

  // — Bordures
  border:    '#D6D3D1',    // card edges, dividers, inputs

  // — Statuts sémantiques
  success:   '#16A34A',
  warning:   '#D97706',
  error:     '#DC2626',
  info:      '#0369A1',

  // — Order status (mapping visuel → DATABASE.md orders.status + ARCHITECTURE.md workflow Orders)
  status: {
    pending:   { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' }, // amber
    confirmed: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' }, // blue-50/700/200 — plus clair que preparing
    preparing: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' }, // blue
    ready:     { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' }, // green
    completed: { bg: '#F5F5F4', text: '#57534E', border: '#D6D3D1' }, // neutral
    cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' }, // red
  },
}
```

### Variables CSS (pour la PWA client — sans Tailwind config)

```css
:root {
  --color-primary:          #C2410C;
  --color-primary-hover:    #9A3412;
  --color-primary-light:    #FED7AA;
  --color-accent:           #F59E0B;
  --color-bg:               #FAFAF9;
  --color-surface:          #F5F5F4;
  --color-raised:           #E7E5E4;
  --color-text-primary:     #1C1917;
  --color-text-secondary:   #57534E;
  --color-text-muted:       #78716C;
  --color-border:           #D6D3D1;
  --color-success:          #16A34A;
  --color-warning:          #D97706;
  --color-error:            #DC2626;
}
```

---

## Typographie et Échelles

Nous utilisons Google Fonts chargées via le module natif `next/font/google` pour des performances optimales (sans flash de texte non stylé).

### Polices Associées
1. **Titres et Noms de plats (Sérif) :** `Playfair Display`
   * Connote le fait-maison, l'authenticité et la qualité d'un "Ember-style craft".
   * Utilisé pour les grands titres, les noms de plats et les entêtes de cartes.
2. **Interface, Contrôles et Textes (Sans-sérif) :** `Source Sans 3` (ou alternative système universelle robuste)
   * Conçu pour une lisibilité maximale sur écrans mobiles de toutes résolutions.
   * Utilisé pour la description des plats, les prix, les formulaires, les boutons, la caisse.

### Échelle Typographique
* **Hero / Titre Principal :** `text-3xl` ou `text-4xl` (`font-playfair font-bold tracking-tight text-text-primary`)
* **Nom de Plat / Sous-Titre :** `text-lg` ou `text-xl` (`font-playfair font-medium text-text-primary`)
* **Texte Courant / Description :** `text-sm` (`font-sans font-normal text-text-secondary leading-relaxed`)
* **Petits Prix / Métadonnées :** `text-xs` (`font-sans font-medium text-text-muted uppercase tracking-wider`)

---

## Grille d'Espacements (Spacing Scale)

Tous les espacements latéraux et verticaux doivent suivre des multiples stricts de 4px (sans valeurs arbitraires) pour garantir l'harmonie :
* `space-y-2` / `p-2` : 8px (micro-ajustements, badges, paddings intérieurs de petits blocs)
* `space-y-4` / `p-4` : 16px (espacement standard entre lignes, rembourrage standard des cards)
* `space-y-6` / `p-6` : 24px (espacement d'éléments logiques, marges intérieures des sections)
* `space-y-8` / `p-8` : 32px (séparation majeure des blocs globaux comme Hero ou Liste de catégories)

---

## Échelle d'Arrondis (Border Radius)

Pour conserver l'esthétique organique chaleureuse :
* `rounded-sm` (4px) : Checkboxes, petits repères.
* `rounded-md` (6px) : Petits boutons, inputs de formulaires d'administration.
* `rounded-lg` (8px) : Boutons principaux de prise de commande.
* `rounded-xl` (12px) : Encarts d'image de produits.
* `rounded-2xl` (16px) : Cartes de produits globales et tiroirs coulissants (Drawers).
* `rounded-3xl` (24px) : Badges de promotion flottants et grandes sections du Hero.

---

## Échelle d'Ombres (Shadows)

* `shadow-sm` : Légères bordures sur les éléments d'UI d'administration.
* `shadow-md` (Standard) : Appliqué aux cartes de plats réactives.
* `shadow-lg` : Tiroirs de panier d'achat et formulaires flottants du checkout.
* `shadow-inner` : Champs de saisie des formulaires et sélections d'options.

---

## Design System : Mode Sombre (Dark Mode)

Si le mode sombre est activé par le restaurant dans `page_settings` (`display_mode = 'dark'`), les variables CSS s'adaptent selon les règles de contraste strictes :

```css
[data-theme="dark"] {
  --color-bg:               #0C0A09;  /* stone-950 warm dark deep */
  --color-surface:          #1C1917;  /* stone-900 */
  --color-raised:           #292524;  /* stone-800 */
  --color-text-primary:     #FAFAF9;  /* warm off-white text */
  --color-text-secondary:   #D6D3D1;  /* light warm gray */
  --color-text-muted:       #A8A29E;  /* medium warm gray */
  --color-border:           #44403C;  /* stone-700 */
}
```

---

## Éléments Atomiques standardisés

### 1. Bouton Principal (Terracotta CTA)
* **Classes Tailwind :** `h-11 px-6 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-sans font-medium transition-all focus:ring-2 focus:ring-primary/20 flex items-center justify-center gap-2`
* **Hauteur Minimale :** 44 pixels (`h-11`) pour assurer une interaction tactile confortable sur mobile sans risque de clic erroné.

### 2. Bouton Secondaire (Sable)
* **Classes Tailwind :** `h-11 px-6 rounded-lg bg-surface hover:bg-raised active:scale-[0.98] text-text-primary font-sans font-medium transition-all border border-border flex items-center justify-center gap-2`

### 3. Badge de Statut Commande
Applique de manière stricte le mappage de couleurs défini pour chaque état du cycle de commande :
* **PENDING :** `bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] px-2.5 py-1 text-xs rounded-full font-medium`
* **CONFIRMED / PREPARING :** `bg-[#DBEAFE] text-[#1E40AF] border border-[#93C5FD] px-2.5 py-1 text-xs rounded-full font-medium`
* **READY :** `bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7] px-2.5 py-1 text-xs rounded-full font-medium`
* **COMPLETED :** `bg-[#F5F5F4] text-[#57534E] border border-[#D6D3D1] px-2.5 py-1 text-xs rounded-full font-medium`
* **CANCELLED :** `bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] px-2.5 py-1 text-xs rounded-full font-medium`
