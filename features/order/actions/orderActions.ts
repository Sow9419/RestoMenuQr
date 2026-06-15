'use server';

import { getSupabaseServerClient } from '@/shared/lib/supabaseServer';
import { getSupabaseAdmin } from '@/shared/lib/supabase';
import { ActionResponse } from '@/shared/types/action';
import { Order, OrderStatus, OrderType } from '@/features/order/types';
import { createOrderSchema } from '../validators';

/**
 * Crée une commande et insère ses produits dans order_items.
 */
export async function createOrder(
  restaurantId: string,
  payload: unknown
): Promise<ActionResponse<Order>> {
  try {
    const supabase = await getSupabaseServerClient();

    // Verify restaurant existence
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('slug, is_open')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restError || !restaurant) {
      return { success: false, error: { code: 'ERR_MENU_NOT_FOUND', message: 'Restaurant introuvable.' } };
    }

    if (!restaurant.is_open) {
      return { success: false, error: { code: 'ERR_RESTAURANT_CLOSED', message: 'Prise de commandes suspendue.' } };
    }

    const parsed = createOrderSchema.safeParse({ ...((payload as any) || {}), restaurantId });
    if (!parsed.success) {
      return { success: false, error: { code: 'ERR_VALIDATION', message: parsed.error.issues[0].message } };
    }

    // Verify items availability & correct pricing from DB to prevent client tampering
    const itemIds = parsed.data.items.map((i) => i.id);
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, price, is_available')
      .in('id', itemIds);

    const productsMap = new Map((dbProducts || []).map((p) => [p.id, p]));

    for (const item of parsed.data.items) {
      const dbProd = productsMap.get(item.id);
      if (!dbProd || !dbProd.is_available) {
        return {
          success: false,
          error: {
            code: 'ERR_CART_ITEM_UNAVAILABLE',
            message: `Le plat "${item.name}" n'est plus disponible.`,
          },
        };
      }
    }

    // Recalculate total price server-side for security
    const serverTotalPrice = parsed.data.items.reduce((sum, item) => {
      const dbProd = productsMap.get(item.id)!;
      return sum + Number(dbProd.price) * item.quantity;
    }, 0);

    // Insert Order row
    const ticketNumber = `#A${Math.floor(Math.random() * 90) + 10}`;
    const { data: insertedOrder, error: orderInsertError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        ticket_number: ticketNumber,
        type: parsed.data.type,
        status: 'PENDING',
        total_price: serverTotalPrice,
        customer_name: parsed.data.customerName || '',
        whatsapp_number: parsed.data.whatsappNumber || '',
        delivery_address: parsed.data.deliveryAddress || '',
        delivery_notes: parsed.data.deliveryNotes || '',
      })
      .select()
      .single();

    if (orderInsertError || !insertedOrder) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: orderInsertError?.message || 'Erreur insertion.' } };
    }

    // Insert Order Items details
    const orderItemsToInsert = parsed.data.items.map((item) => {
      const dbProd = productsMap.get(item.id)!;
      return {
        order_id: insertedOrder.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: Number(dbProd.price),
      };
    });

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
    if (itemsError) {
      // rollback order (manual clean)
      await supabase.from('orders').delete().eq('id', insertedOrder.id);
      return { success: false, error: { code: 'ERR_DB_ERROR', message: itemsError.message } };
    }

    return {
      success: true,
      data: {
        id: insertedOrder.id,
        ticketNumber: insertedOrder.ticket_number,
        createdAt: insertedOrder.created_at,
        type: insertedOrder.type as OrderType,
        status: insertedOrder.status as OrderStatus,
        items: parsed.data.items,
        totalPrice: serverTotalPrice,
        restaurantSlug: restaurant.slug,
        whatsappNumber: insertedOrder.whatsapp_number,
        customerName: insertedOrder.customer_name,
        deliveryAddress: insertedOrder.delivery_address,
        deliveryNotes: insertedOrder.delivery_notes,
      },
    };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}

/**
 * Met à jour le statut d'une commande.
 * Valide les transitions logiques (ROLES_AND_PERMISSIONS.md).
 */
export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  nextStatus: OrderStatus
): Promise<ActionResponse<Order>> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { code: 'ERR_UNAUTHORIZED', message: 'Non authentifié.' } };
    }

    // Check staff permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!profile) {
      return { success: false, error: { code: 'ERR_FORBIDDEN', message: 'Accès interdit.' } };
    }

    // Validate transition logical matrix
    const { data: currentOrder, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (orderError || !currentOrder) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: 'Commande introuvable.' } };
    }

    const currentStatus = currentOrder.status as OrderStatus;

    if (['COMPLETED', 'CANCELLED'].includes(currentStatus)) {
      return { success: false, error: { code: 'ERR_ORDER_CANCELLED_LOCKED', message: 'Commande déjà close ou annulée.' } };
    }

    // Perform check of allowed actions
    let isTransitionAllowed = false;
    const role = profile.role;

    if (role === 'OWNER' || role === 'ORG_OWNER') {
      isTransitionAllowed = true;
    } else if (role === 'CASHIER') {
      if (
        (currentStatus === 'PENDING' && nextStatus === 'CONFIRMED') ||
        (currentStatus === 'READY' && nextStatus === 'COMPLETED') ||
        nextStatus === 'CANCELLED'
      ) {
        isTransitionAllowed = true;
      }
    } else if (role === 'KITCHEN') {
      if (
        (currentStatus === 'PENDING' && nextStatus === 'CONFIRMED') ||
        (currentStatus === 'CONFIRMED' && nextStatus === 'PREPARING') ||
        (currentStatus === 'PREPARING' && nextStatus === 'READY')
      ) {
        isTransitionAllowed = true;
      }
    }

    if (!isTransitionAllowed) {
      return { success: false, error: { code: 'ERR_FORBIDDEN', message: `Transition ${currentStatus} -> ${nextStatus} non autorisée pour le rôle ${role}.` } };
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: updateError.message } };
    }

    return {
      success: true,
      data: {
        id: updatedOrder.id,
        ticketNumber: updatedOrder.ticket_number,
        createdAt: updatedOrder.created_at,
        type: updatedOrder.type as OrderType,
        status: updatedOrder.status as OrderStatus,
        items: [], // loaded separately on read
        totalPrice: Number(updatedOrder.total_price),
        restaurantSlug: '',
      },
    };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}

/**
 * Récupère le suivi public d'une commande (Dine-in / Delivery).
 */
export async function getOrderTracker(orderId: string): Promise<ActionResponse<Order>> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      return { success: false, error: { code: 'ERR_DB_ERROR', message: 'Commande introuvable.' } };
    }

    const mappedItems = (order.order_items || []).map((item: any) => ({
      id: item.product_id,
      name: item.products?.name || 'Plat inconnu',
      price: Number(item.unit_price),
      quantity: item.quantity,
    }));

    return {
      success: true,
      data: {
        id: order.id,
        ticketNumber: order.ticket_number,
        createdAt: order.created_at,
        type: order.type as OrderType,
        status: order.status as OrderStatus,
        items: mappedItems,
        totalPrice: Number(order.total_price),
        restaurantSlug: '',
        whatsappNumber: order.whatsapp_number,
        customerName: order.customer_name,
        deliveryAddress: order.delivery_address,
        deliveryNotes: order.delivery_notes,
      },
    };
  } catch (err: any) {
    return { success: false, error: { code: 'ERR_INTERNAL_SERVER', message: err.message } };
  }
}
