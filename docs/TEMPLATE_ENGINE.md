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
  "theme": {
    "primaryColor": "#C2410C",
    "fontFamily": "Playfair Display"
  },
  "layout": "classic", 
  "sections": [
    {
      "type": "hero",
      "visible": true,
      "props": { "title": "Notre Menu", "subtitle": "Découvrez nos spécialités" }
    },
    {
      "type": "category_list",
      "visible": true,
      "style": "grid" 
    }
  ]
}
```

## Composants Prise en Charge
- `HeroSection`
- `CategoryList` (modes: list, grid, horizontal_scroll)
- `ProductCard` (modes: minimal, detailed, image_focused)

## Principes de Rendu
- Le `Renderer` itère sur `sections`.
- Vérifier la propriété `visible`.
- Mapper le `type` à un composant React interne via un dictionnaire de composants existants.
- Appliquer les `props` et le `theme`.
