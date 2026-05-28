import { useEffect } from 'react';
import { subscribeToOrders } from '../services/ordersService';
import { useOrdersStore } from '../store/ordersStore';
import { useNotificationsStore } from '../store/notificationsStore';
import { Order, PlatformId } from '../types/orders';
import { useQueryClient } from '@tanstack/react-query';

export function useRealTimeOrders(platform?: PlatformId) {
  const addOrder = useOrdersStore((state) => state.addOrder);
  const addNotification = useNotificationsStore((state) => state.addNotification);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Si no se especifica plataforma, suscribirse a todas (hub principal)
    const platforms: PlatformId[] = platform ? [platform] : ['pedidosya', 'rappi', 'glovo', 'ubereats'];
    
    const unsubscribes = platforms.map((p) => 
      subscribeToOrders(p, (newOrder: Order) => {
        addOrder(newOrder);
        // Invalidar cache de TanStack Query
        queryClient.invalidateQueries({ queryKey: ['orders', newOrder.platform] });
        queryClient.invalidateQueries({ queryKey: ['orders', 'all'] });

        addNotification({
          title: 'Nuevo Pedido',
          message: `Nuevo pedido de ${newOrder.platform.toUpperCase()} (#${newOrder.externalId})`,
          type: 'success',
        });
      })
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [platform, addOrder, addNotification, queryClient]);
}
