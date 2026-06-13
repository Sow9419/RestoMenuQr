import { create } from 'zustand';
import { Order, OrderStatus } from '@/lib/restoTypes';

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  isLoading: true,
  error: null,

  setOrders: (orders) => set({ orders, isLoading: false, error: null }),
  
  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders],
  })),

  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map((ord) =>
      ord.id === orderId ? { ...ord, status } : ord
    ),
  })),

  deleteOrder: (orderId) => set((state) => ({
    orders: state.orders.filter((ord) => ord.id !== orderId),
  })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
}));
