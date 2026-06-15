import { z } from 'zod';

// UUID validation helper
const uuidSchema = z.string().uuid({ message: "Identifiant unique invalide (doit être un UUID)." });

export const createCategorySchema = z.object({
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  icon: z.string().default('Utensils'),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = z.object({
  id: uuidSchema,
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  icon: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const createProductSchema = z.object({
  categoryId: uuidSchema,
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  description: z.string().max(500, { message: "La description ne peut pas dépasser 500 caractères." }).optional().default(''),
  price: z.number().positive({ message: "Le prix doit être supérieur à 0." }),
  imageUrl: z.string().url({ message: "L'URL de l'image est invalide." }).or(z.string().max(0)).optional().default(''),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateProductSchema = z.object({
  id: uuidSchema,
  categoryId: uuidSchema.optional(),
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }).optional(),
  description: z.string().max(500, { message: "La description ne peut pas dépasser 500 caractères." }).optional(),
  price: z.number().positive({ message: "Le prix doit être supérieur à 0." }).optional(),
  imageUrl: z.string().url({ message: "L'URL de l'image est invalide." }).or(z.string().max(0)).optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updatePageSettingsSchema = z.object({
  templateLayout: z.enum(['classic', 'card-grid', 'premium']).default('classic'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: "Code couleur hexadécimal invalide." }).default('#C2410C'),
  fontFamily: z.string().default('Playfair Display'),
  heroTitle: z.string().max(100).optional(),
  heroDescription: z.string().max(300).optional(),
  heroBannerUrl: z.string().url().or(z.string().max(0)).optional(),
  displayMode: z.enum(['light', 'dark']).default('light'),
  overlayOpacity: z.number().min(0).max(100).default(40),
  glassmorphism: z.boolean().default(false),
  density: z.enum(['compact', 'comfortable']).default('comfortable'),
  currency: z.string().max(10).default('FCFA'),
});
