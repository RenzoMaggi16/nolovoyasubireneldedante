/**
 * noctua/services/ordersService.ts
 */
import { Order, OrderStatus, PlatformId } from '../types/orders';
import { supabase } from '@/hooks/lib/supabaseClient';

export async function fetchOrdersByPlatform(platform: PlatformId): Promise<Order[]> {
  const res = await fetch(`/api/orders/${platform}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch orders');
  }
  return res.json();
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, platform: PlatformId): Promise<Order> {
  const res = await fetch(`/api/orders/${platform}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, status }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update order status');
  }
  return res.json();
}

export async function fetchAllOrders(): Promise<Order[]> {
  const platforms: PlatformId[] = ['pedidosya', 'rappi', 'glovo', 'ubereats'];
  const results = await Promise.allSettled(
    platforms.map(p => fetchOrdersByPlatform(p))
  );

  const allOrders: Order[] = [];
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allOrders.push(...result.value);
    }
  });

  return allOrders.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function subscribeToOrders(platform: PlatformId, callback: (order: Order) => void): () => void {
  const channel = supabase.channel(`delivery_orders:${platform}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_orders',
        filter: `platform=eq.${platform}`,
      },
      (payload) => {
        callback(payload.new as Order);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_orders',
        filter: `platform=eq.${platform}`,
      },
      (payload) => {
        callback(payload.new as Order);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function updateOrderStatusLegacy(orderId: string, status: OrderStatus): Promise<Order> {
  throw new Error('updateOrderStatus requires platformId');
}
