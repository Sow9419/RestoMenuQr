import { RestaurantConfig, RestaurantSection, MenuCategory, MenuItem } from './restoTypes';

export const BACKGROUND_PRESETS = [
  { id: 'slate', name: 'Ardoise Sombre', class: 'bg-slate-900', isDark: true, preview: 'linear-gradient(135deg, #0f172a, #1e293b)' },
  { id: 'cream', name: 'Crème Chaleureux', class: 'bg-[#faf6f0]', isDark: false, preview: 'linear-gradient(135deg, #faf6f0, #f5ecd8)' },
  { id: 'charcoal', name: 'Charbon Apple', class: 'bg-[#121212]', isDark: true, preview: 'linear-gradient(135deg, #121212, #1f1f1f)' },
  { id: 'terrazzo', name: 'Bistro Terrazzo', class: 'bg-[#2d221e]', isDark: true, preview: 'linear-gradient(135deg, #2d221e, #1a1210)' },
  { id: 'emerald', name: 'Chic Émeraude', class: 'bg-[#064e3b]', isDark: true, preview: 'linear-gradient(135deg, #022c22, #064e3b)' },
  { id: 'sunset', name: 'Golden Hour', class: 'bg-gradient-to-br from-amber-50 to-orange-100', isDark: false, preview: 'linear-gradient(135deg, #fef3c7, #ffedd5)' },
  { id: 'pattern-dots', name: 'Minimal Dot Grid', class: 'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]', isDark: false, preview: 'radial-gradient(#d1d5db 1.5px, transparent 1.5px)' },
  { id: 'bistro-wood', name: 'Table de Bistro', class: 'bg-cover bg-center', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600', isDark: true, preview: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=40&w=100)' },
  { id: 'marble', name: 'Marbre Sombre Chic', class: 'bg-cover bg-center', url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=600', isDark: true, preview: 'url(https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=40&w=100)' },
  { id: 'concrete', name: 'Béton Brut', class: 'bg-cover bg-center', url: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&q=80&w=600', isDark: true, preview: 'url(https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&q=40&w=100)' },
  { id: 'olive', name: 'Jardin d\'Olive', class: 'bg-[#2c352c]', isDark: true, preview: 'linear-gradient(135deg, #1b211b, #2c352c)' },
  { id: 'modern-dark', name: 'Noir Cosmique', class: 'bg-[#08080c]', isDark: true, preview: 'linear-gradient(135deg, #030303, #09090b)' },
  { id: 'sand', name: 'Sable Fin', class: 'bg-[#f4efe6]', isDark: false, preview: 'linear-gradient(135deg, #f4efe6, #e7decb)' },
  { id: 'brick', name: 'Brique Loft', class: 'bg-cover bg-center', url: 'https://images.unsplash.com/photo-1581091870622-0402e1cc3aff?auto=format&fit=crop&q=80&w=600', isDark: true, preview: 'url(https://images.unsplash.com/photo-1581091870622-0402e1cc3aff?auto=format&fit=crop&q=40&w=100)' },
  { id: 'pastel-pink', name: 'Pâtisserie Rose', class: 'bg-gradient-to-br from-pink-50 to-orange-50', isDark: false, preview: 'linear-gradient(135deg, #fdf2f8, #fff7ed)' },
  { id: 'rustic-dark', name: 'Bois Rustique Noir', class: 'bg-cover bg-center', url: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&q=80&w=600', isDark: true, preview: 'url(https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&q=40&w=100)' },
  { id: 'neon-shabu', name: 'Lumière de Tokyo', class: 'bg-cover bg-center', url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=600', isDark: true, preview: 'url(https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=40&w=100)' },
  { id: 'gourmet-leaves', name: 'Aura Épicée', class: 'bg-[#151d1a]', isDark: true, preview: 'linear-gradient(135deg, #0d1311, #151d1a)' },
  { id: 'cyber-dark', name: 'Brutalisme Zinc', class: 'bg-[#1c1d21]', isDark: true, preview: 'linear-gradient(135deg, #111215, #1c1d21)' },
  { id: 'minimal-grid', name: 'Grille Architecte', class: 'bg-[#faf8f5] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]', isDark: false, preview: 'linear-gradient(to right, #8080801a 1px, transparent 1px)' }
];

export const FONTS_LIST = [
  { id: 'font-sans', name: 'Inter (Sanskrit Moderne)', class: 'font-sans' },
  { id: 'font-serif', name: 'Playfair (Élégance Éditoriale)', class: 'font-serif' },
  { id: 'font-mono', name: 'JetBrains (Tech Contemporain)', class: 'font-mono' }
];

export const INITIAL_SECTIONS: RestaurantSection[] = [
  { id: 'hero', name: 'hero', label: 'Bannière & Slogan d\'accueil', enabled: true },
  { id: 'categories', name: 'categories', label: 'Navigation par Catégories', enabled: true },
  { id: 'menu', name: 'menu', label: 'Catalogue des Plats', enabled: true },
  { id: 'infos', name: 'infos', label: 'Horaires & Informations', enabled: true },
  { id: 'socials', name: 'socials', label: 'Réseaux Sociaux', enabled: true }
];

export const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'cat-burgers', name: 'Burgers Gourmets', icon: 'Beef', order: 0 },
  { id: 'cat-pizzas', name: 'Pizzas Feu de Bois', icon: 'Pizza', order: 1 },
  { id: 'cat-drinks', name: 'Boissons & Cocktails', icon: 'CupSoda', order: 2 },
  { id: 'cat-desserts', name: 'Desserts Fins', icon: 'Cake', order: 3 }
];

export const INITIAL_ITEMS: MenuItem[] = [
  {
    id: 'item-burger-truffe',
    categoryId: 'cat-burgers',
    name: 'Burger Truffe & Cancoillotte',
    description: 'Steak de bœuf breton, crème de truffe blanche, cancoillotte coulante, roquette fraîche, pain brioché croustillant.',
    price: 11900, // 11900 FCFA / 18.50 EUR (integer representation is clean, but let's just use float, it's easier, let's keep prices as raw numbers like 11900 or 18.5)
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    salesCount: 84
  },
  {
    id: 'item-burger-bacon',
    categoryId: 'cat-burgers',
    name: 'Le Smash Double Bacon',
    description: 'Deux smash patties ultra-ffins croustillants, double cheddar orange affiné, tranches de bacon fumé croustillant, sauce maison secrète.',
    price: 9500,
    imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    salesCount: 142
  },
  {
    id: 'item-pizza-truffata',
    categoryId: 'cat-pizzas',
    name: 'La Truffata Bianca',
    description: 'Base crème fraîche aromatisée aux truffes, mozzarella fior di latte, speck italien croustillant, burrata entière coulante déposée après cuisson.',
    price: 12500,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    salesCount: 95
  },
  {
    id: 'item-pizza-reine',
    categoryId: 'cat-pizzas',
    name: 'La Reine du Vésuve',
    description: 'Sauce tomate aux herbes fraîches, jambon blanc rôti aux herbes, cœurs d\'artichauts marinés, mozzarella fraîche fondante et olives noires.',
    price: 8900,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    salesCount: 57
  },
  {
    id: 'item-lemonade',
    categoryId: 'cat-drinks',
    name: 'Limonade Romarin Hibiscus',
    description: 'Limonade pressée maison infusée aux fleurs d\'hibiscus bio et romarin du jardin, servie glacée.',
    price: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    salesCount: 220
  },
  {
    id: 'item-ipa-local',
    categoryId: 'cat-drinks',
    name: 'Bière Artisanal IPA d\'or',
    description: 'Bière blonde locale brassée sur place, aux arômes d\'agrumes et d\'herbes fraîches. Légèrement amère.',
    price: 4500,
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=400',
    isAvailable: false,
    salesCount: 12
  },
  {
    id: 'item-tiramisu',
    categoryId: 'cat-desserts',
    name: 'Tiramisu Cœur Pistache',
    description: 'Mascarpone fouettée onctueuse, biscuits cuillères imbibés au café serré, ganache fondante à la pistache de Sicile.',
    price: 5400,
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=400',
    isAvailable: true,
    salesCount: 110
  }
];

export const DEFAULT_CONFIG: RestaurantConfig = {
  slug: 'le-palais-du-chef',
  name: 'Le Palais du Chef',
  phone: '+221 77 123 45 67',
  address: 'Corniche Ouest, Face Mosquée de la Divinité, Dakar',
  isOpen: true,
  sections: INITIAL_SECTIONS,
  style: {
    templateLayout: 'classic',
    displayMode: 'light',
    accentColor: '#C2410C', // Orange brique chaleureux
    fontFamily: 'font-serif', // Playfair Serif
    heroBannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
    heroTitle: 'Cuisine d\'Exception & Ambiance Feutrée',
    heroDescription: 'Digitalisez vos repas et passez vos commandes directement sur place en moins de deux minutes. Un concept novateur par nos chefs étoilés.',
    density: 'comfortable',
    backgroundImageUrl: 'modern-dark', // Noir Cosmique
    overlayOpacity: 25,
    glassmorphism: true,
    showCategoryIcons: true,
    currency: 'FCFA'
  },
  categories: INITIAL_CATEGORIES,
  items: INITIAL_ITEMS
};
