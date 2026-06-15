export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type OrderType = 'DINE_IN' | 'DELIVERY';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  ticketNumber: string;
  createdAt: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  totalPrice: number;
  restaurantSlug: string;
  whatsappNumber?: string;
  customerName?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
}
