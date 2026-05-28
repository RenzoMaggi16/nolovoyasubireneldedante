import { create } from 'zustand';
import { Order, OrderStatus, PlatformId } from '../types/orders';

interface OrdersState {
  orders: Record<PlatformId, Order[]>;
  setOrders: (platform: PlatformId, orders: Order[]) => void;
  updateOrderStatus: (orderId: string, platform: PlatformId, status: OrderStatus) => void;
  addOrder: (order: Order) => void;
  removeOrder: (orderId: string, platform: PlatformId) => void;
  getOrdersByPlatform: (platform: PlatformId) => Order[];
  getPendingCount: (platform: PlatformId) => number;
  getUrgentOrders: (platform: PlatformId, minutes?: number) => Order[];
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: {
    pedidosya: [],
    rappi: [],
    glovo: [],
    ubereats: [],
  },

  setOrders: (platform: PlatformId, orders: Order[]) =>
    set((state: OrdersState) => ({
      orders: { ...state.orders, [platform]: orders },
    })),

  updateOrderStatus: (orderId: string, platform: PlatformId, status: OrderStatus) =>
    set((state: OrdersState) => ({
      orders: {
        ...state.orders,
        [platform]: state.orders[platform].map((order: Order) =>
          order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
        ),
      },
    })),

  addOrder: (order: Order) =>
    set((state: OrdersState) => ({
      orders: {
        ...state.orders,
        [order.platform]: [...state.orders[order.platform], order],
      },
    })),

  removeOrder: (orderId: string, platform: PlatformId) =>
    set((state: OrdersState) => ({
      orders: {
        ...state.orders,
        [platform]: state.orders[platform].filter((o: Order) => o.id !== orderId),
      },
    })),

  getOrdersByPlatform: (platform: PlatformId) => {
    return get().orders[platform].sort(
      (a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  getPendingCount: (platform: PlatformId) => {
    return get().orders[platform].filter(
      (o: Order) => o.status === 'new' || o.status === 'confirmed' || o.status === 'preparing'
    ).length;
  },

  getUrgentOrders: (platform: PlatformId, minutes: number = 20) => {
    const now = new Date();
    return get().orders[platform].filter((o: Order) => {
      const diff = now.getTime() - new Date(o.createdAt).getTime();
      return diff > minutes * 60 * 1000 && o.status !== 'delivered' && o.status !== 'cancelled';
    });
  },
}));
