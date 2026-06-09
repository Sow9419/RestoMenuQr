'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useTransition } from 'react';
import { RestaurantConfig, Order, OrderStatus, OrderType, MenuItem, MenuCategory } from '@/lib/restoTypes';
import { DEFAULT_CONFIG } from '@/lib/defaultData';

interface RestoContextType {
  config: RestaurantConfig;
  orders: Order[];
  activeTab: 'dashboard' | 'orders' | 'pos' | 'builder' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'orders' | 'pos' | 'builder' | 'settings') => void;
  isLoading: boolean;
  isPollingActive: boolean;
  setPollingActive: (active: boolean) => void;
  // Simulation params
  isNetworkSimulatedOffline: boolean;
  setNetworkSimulatedOffline: (offline: boolean) => void;
  isWhatsAppSimulatedInstalled: boolean;
  setWhatsAppSimulatedInstalled: (installed: boolean) => void;
  // Actions
  refreshData: () => Promise<void>;
  updateConfigOnServer: (newConfig: RestaurantConfig) => Promise<void>;
  addOrderOnServer: (orderData: Partial<Order>) => Promise<Order>;
  updateOrderStatusOnServer: (orderId: string, status: OrderStatus) => Promise<void>;
  deleteOrderOnServer: (orderId: string) => Promise<void>;
  resetAllData: () => Promise<void>;
}

const RestoContext = createContext<RestoContextType | undefined>(undefined);

export function RestoProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<RestaurantConfig>(DEFAULT_CONFIG);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTabState] = useState<'dashboard' | 'orders' | 'pos' | 'builder' | 'settings'>('builder');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPollingActive, setPollingActive] = useState<boolean>(true);
  
  // Custom transition for tab switches to ensure high-performance UI
  const [, startTransition] = useTransition();
  const setActiveTab = useCallback((tab: 'dashboard' | 'orders' | 'pos' | 'builder' | 'settings') => {
    startTransition(() => {
      setActiveTabState(tab);
    });
  }, []);

  // Simulation settings (saved to memory/session)
  const [isNetworkSimulatedOffline, setNetworkSimulatedOffline] = useState<boolean>(false);
  const [isWhatsAppSimulatedInstalled, setWhatsAppSimulatedInstalled] = useState<boolean>(true);

  // Fetch from server
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setOrders(data.orders);
      }
    } catch (err) {
      console.warn('Sync connection error, fallback to memory states', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let active = true;
    if (active) {
      const timer = setTimeout(() => {
        refreshData();
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [refreshData]);

  // Polling mechanism
  useEffect(() => {
    if (!isPollingActive) return;

    const interval = setInterval(() => {
      // Don't poll if network is simulated offline to align with simulation expectations
      if (!isNetworkSimulatedOffline) {
        refreshData();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPollingActive, refreshData, isNetworkSimulatedOffline]);

  // Update restaurant configuration
  const updateConfigOnServer = async (newConfig: RestaurantConfig) => {
    // Optimistic local state update
    setConfig(newConfig);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_config', data: newConfig }),
      });
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.config) {
          setConfig(responseData.config);
        }
      }
    } catch (err) {
      console.error('Failed to upload menu config updates', err);
    }
  };

  // Add a new order
  const addOrderOnServer = async (orderData: Partial<Order>): Promise<Order> => {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_order', data: orderData }),
      });
      if (!res.ok) {
        throw new Error('Server returned error adding order');
      }
      const responseData = await res.json();
      if (responseData.success) {
        setOrders(prev => [responseData.order, ...prev]);
        if (responseData.config) {
          setConfig(responseData.config);
        }
        return responseData.order;
      }
      throw new Error('Failed to parse order success response');
    } catch (err) {
      console.error('Error sending order to server:', err);
      // Fallback local mock simulation
      const fallbackOrder: Order = {
        id: orderData.id || `ord-local-${Math.random().toString(36).substr(2, 9)}`,
        ticketNumber: orderData.ticketNumber || `#A${Math.floor(Math.random() * 90) + 10}`,
        createdAt: new Date().toISOString(),
        type: orderData.type || 'DINE_IN',
        status: 'PENDING',
        items: orderData.items || [],
        totalPrice: orderData.totalPrice || 0,
        restaurantSlug: config.slug,
        whatsappNumber: orderData.whatsappNumber,
        customerName: orderData.customerName,
        deliveryAddress: orderData.deliveryAddress,
        deliveryNotes: orderData.deliveryNotes,
      };
      setOrders(prev => [fallbackOrder, ...prev]);
      return fallbackOrder;
    }
  };

  // Change order status
  const updateOrderStatusOnServer = async (orderId: string, status: OrderStatus) => {
    // Optimistic UI updates
    setOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status } : ord));
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_order_status',
          data: { orderId, status }
        }),
      });
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.success) {
          // Sync state
          await refreshData();
        }
      }
    } catch (err) {
      console.error('Failed to change order status on backend', err);
    }
  };

  // Delete/Cancel order
  const deleteOrderOnServer = async (orderId: string) => {
    setOrders(prev => prev.filter(ord => ord.id !== orderId));
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_order',
          data: { orderId }
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error('Failed to delete order on backend', err);
    }
  };

  // Reset to initial factory defaults
  const resetAllData = async () => {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.ok) {
        const responseData = await res.json();
        setConfig(responseData.config);
        setOrders(responseData.orders);
      }
    } catch (err) {
      console.error('Failed to reset applet database data', err);
    }
  };

  return (
    <RestoContext.Provider
      value={{
        config,
        orders,
        activeTab,
        setActiveTab,
        isLoading,
        isPollingActive,
        setPollingActive,
        isNetworkSimulatedOffline,
        setNetworkSimulatedOffline,
        isWhatsAppSimulatedInstalled,
        setWhatsAppSimulatedInstalled,
        refreshData,
        updateConfigOnServer,
        addOrderOnServer,
        updateOrderStatusOnServer,
        deleteOrderOnServer,
        resetAllData,
      }}
    >
      {children}
    </RestoContext.Provider>
  );
}

export function useResto() {
  const context = useContext(RestoContext);
  if (!context) {
    throw new Error('useResto must be used within a RestoProvider');
  }
  return context;
}
