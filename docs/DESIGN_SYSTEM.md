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

  // — Order status (mapping visuel → DOMAIN_MODEL.md OrderStatus)
  status: {
    pending:   { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' }, // amber
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