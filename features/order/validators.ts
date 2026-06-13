import { z } from 'zod';

const uuidSchema = z.string().uuid({ message: "UUID invalide." });

export const orderItemSchema = z.object({
  id: z.string(), // local menu item id or UUID
  name: z.string().min(1, { message: "Le nom du plat est requis." }),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive({ message: "La quantité doit être supérieure à 0." }),
});

export const createOrderSchema = z.object({
  restaurantId: uuidSchema,
  type: z.enum(['DINE_IN', 'DELIVERY']).default('DINE_IN'),
  items: z.array(orderItemSchema).min(1, { message: "Le panier ne peut pas être vide (ERR_ORDER_EMPTY)." }),
  totalPrice: z.number().nonnegative(),
  customerName: z.string().optional(),
  whatsappNumber: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().max(300, { message: "Les instructions spéciales ne peuvent pas dépasser 300 caractères." }).optional(),
});
