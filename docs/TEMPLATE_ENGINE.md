# TEMPLATE_ENGINE.md

# Moteur de Templates

L'affichage du menu public est piloté par un moteur de templates (JSON-driven UI).
Le Builder ne génère pas de code, il produit une configuration JSON persistée en base.

## Architecture du Moteur

1. **Configuration (JSON)** : Décrit les composants à utiliser et leurs paramètres.
2. **Renderer** : Composant React (`<MenuRenderer config={jsonConfig} />`) qui interprète le JSON.

## Modèle de Configuration JSON

```json
{
  "version": "1.0",
  "theme": { "primaryColor": "#C2410C", "fontFamily": "Playfair Display" },
  "layout": "classic",
  "sections": [
    {
      "section_key": "hero",
      "is_enabled": true,
      "sort_order": 0,
      "props": { "title": "Notre Menu", "subtitle": "Découvrez nos spécialités" }
    },
    {
      "section_key": "category_list",
      "is_enabled": true,
      "sort_order": 1,
      "style": "horizontal_scroll"
    }
  ]
}
```

## Composants Prise en Charge et Propriétés de Style

### 1. `HeroSection` (Section d'en-tête promotionnelle)
- **Props :**
  - `title` (text) : Titre accrocheur ou nom de l'établissement.
  - `description` (text) : Phrase d'invitation au voyage gustatif.
  - `bannerUrl` (text nullable) : Image de fond spectaculaire.
  - `overlay_opacity` (int) : Taux de voile noir de 0 à 100 pour garantir que le texte blanc reste parfaitement lisible.

### 2. `CategoryList` (Navigation thématique)
- **Props :**
  - `layout_mode` (`'list'` | `'grid'` | `'horizontal_scroll'`) :
    - `list` : Simple empilement vertical d'icônes ou textes de catégories.
    - `grid` : Boîtes côte à côte d'accès rapide.
    - `horizontal_scroll` : Bandeau horizontal défilant restant collé en haut de l'écran lors du défilement (Sticky sub-navigation).

### 3. `ProductCard` (Affichage unitaire du plat)
- **Modes visuels :**
  - `minimal` : Une seule ligne ultra-compacte optimisée pour l'affichage dense (idéal pour les boissons ou petits suppléments).
  - `detailed` : Format carte avec texte descriptif aligné à gauche et image carrée compacte de 80px sur le côté droit.
  - `image_focused` : Grande image occupant 100% de la largeur avec titre et prix superposés en bas, idéal pour la mise en avant de plats signatures ("burgers", "pizzas").

---

## Modèle de Persistance et Pipeline de Rendu (Server SSR / CSR Split)

Pour concilier vitesse de chargement instantanée (critique sous réseau faiblard) et interactivité dynamique du Builder, le rendu s'articule en deux étapes étanches :

1. **Server Side Rendering (SSR) :**
   * Next.js Server Component interroge la table `page_settings` et `page_sections` associées au `restaurant_id` en une seule transaction SQL précompilée de base.
   * Il génère la structure HTML initiale et injecte de manière synchrone les polices choisies (`Playfair Display`, `Source Sans 3`) via des liens préchargés.
2. **Client-Side Hydration (CSR) & Customization (Theme engine mapping) :**
   * Le composant client `<MenuRenderer>` reçoit le JSON et hydrate la page.
   * Il applique dynamiquement les variables de couleur primaire issue de `page_settings.accent_color` en injectant un bloc de style global temporaire `:root`:
     ```typescript
     const CustomThemeInjector = ({ accentColor }: { accentColor: string }) => (
       <style dangerouslySetInnerHTML={{__html: `
         :root {
           --color-primary: ${accentColor};
           --color-primary-hover: color-mix(in srgb, ${accentColor} 80%, #000);
         }
       `}} />
     );
     ```
     // Note : color-mix() est supporté par tous les navigateurs modernes (Chrome 111+, Safari 16.2+, Firefox 113+).
     // Pour les restaurants utilisant la couleur terracotta par défaut (#C2410C), la valeur exacte #9A3412 est appliquée via tailwind.config.ts.

---

## Guide d'Entrée du Builder (Comment s'écrivent les modifications)

Lorsque l'Owner utilise l'interface d'édition visuelle du Builder :
- **Pas de recompilation de code :** Chaque réglette, sélecteur à boutons-pression ou palette de couleur met immédiatement à jour un store Zustand local `useBuilderStore`.
- **Live Preview :** La preview affiche instantanément le résultat grâce à ce store réactif.
- **Sauvegarde :** Un bouton unique "Enregistrer les modifications" déclenche la Server Action `updatePageSettings` qui persiste les modifications visuelles dans `page_settings` et l'ordonnancement des sections dans `page_sections` de façon atomique.

---

## Stratégie de Versioning de Schéma (Schema Versioning)

Le layout JSON d'un template intègre à sa racine une clé `"version": "1.0"`.
* En cas d'évolution future (ex: ajout d'une section "Promotions" ou "Horaires"), le moteur de template Next.js intègre un convertisseur automatique (Middleware de configuration d'UI) qui mappe l'ancienne structure vers les nouvelles propriétés par défaut, évitant ainsi de casser l'affichage des anciens restaurants de la plateforme.
