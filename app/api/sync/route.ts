import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { RestaurantConfig, Order, OrderStatus } from '@/lib/restoTypes';
import { DEFAULT_CONFIG } from '@/lib/defaultData';

// Persistent in-memory store for Cloud Run runtime warmup duration
let currentConfig: RestaurantConfig = { ...DEFAULT_CONFIG };
let ordersList: Order[] = [
  {
    id: 'ord-mock-1',
    ticketNumber: '#A01',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3h ago
    type: 'DINE_IN',
    status: 'COMPLETED',
    items: [
      { id: 'item-burger-truffe', name: 'Burger Truffe & Cancoillotte', price: 11900, quantity: 2 }
    ],
    totalPrice: 23800,
    restaurantSlug: 'le-palais-du-chef'
  },
  {
    id: 'ord-mock-2',
    ticketNumber: '#B04',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(), // 1.5h ago
    type: 'DELIVERY',
    status: 'READY',
    items: [
      { id: 'item-pizza-truffata', name: 'La Truffata Bianca', price: 12500, quantity: 1 },
      { id: 'item-lemonade', name: 'Limonade Romarin Hibiscus', price: 3200, quantity: 2 }
    ],
    totalPrice: 18900,
    restaurantSlug: 'le-palais-du-chef',
    whatsappNumber: '+221773034920',
    customerName: 'Fatou Sow',
    deliveryAddress: 'Les Almadies, Arrêt Pharmacie, Dakar',
    deliveryNotes: 'Appeler en arrivant'
  }
];

// Helper to generate elegant ticket numbers
function generateTicketNumber(prefixChar?: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = prefixChar || chars.charAt(Math.floor(Math.random() * chars.length));
  const num = Math.floor(Math.random() * 90) + 10; // 10 to 99
  return `#${prefix}${num}`;
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    config: currentConfig,
    orders: ordersList
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    if (action === 'update_config') {
      currentConfig = { ...currentConfig, ...data };
      return NextResponse.json({ success: true, config: currentConfig });
    }

    if (action === 'add_order') {
      const newOrder: Order = {
        id: data.id || `ord-${Math.random().toString(36).substr(2, 9)}`,
        ticketNumber: data.ticketNumber || generateTicketNumber(data.type === 'DELIVERY' ? 'D' : 'A'),
        createdAt: new Date().toISOString(),
        type: data.type,
        status: 'PENDING',
        items: data.items,
        totalPrice: data.totalPrice,
        restaurantSlug: currentConfig.slug,
        whatsappNumber: data.whatsappNumber,
        customerName: data.customerName,
        deliveryAddress: data.deliveryAddress,
        deliveryNotes: data.deliveryNotes
      };

      // Increment sales counts for items
      ordersList = [newOrder, ...ordersList];
      
      // Update config items' sales counts locally on the server
      currentConfig.items = currentConfig.items.map(item => {
        const orderedItem = data.items.find((oi: any) => oi.id === item.id);
        if (orderedItem) {
          return { ...item, salesCount: (item.salesCount || 0) + orderedItem.quantity };
        }
        return item;
      });

      return NextResponse.json({ success: true, order: newOrder, config: currentConfig });
    }

    if (action === 'update_order_status') {
      const { orderId, status } = data;
      ordersList = ordersList.map(ord => {
        if (ord.id === orderId) {
          return { ...ord, status: status as OrderStatus };
        }
        return ord;
      });
      return NextResponse.json({ success: true, orders: ordersList });
    }

    if (action === 'delete_order') {
      const { orderId } = data;
      ordersList = ordersList.filter(ord => ord.id !== orderId);
      return NextResponse.json({ success: true, orders: ordersList });
    }

    if (action === 'reset') {
      currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      ordersList = [
        {
          id: 'ord-mock-1',
          ticketNumber: '#A01',
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          type: 'DINE_IN',
          status: 'COMPLETED',
          items: [
            { id: 'item-burger-truffe', name: 'Burger Truffe & Cancoillotte', price: 11900, quantity: 2 }
          ],
          totalPrice: 23800,
          restaurantSlug: 'le-palais-du-chef'
        }
      ];
      return NextResponse.json({ success: true, config: currentConfig, orders: ordersList });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
