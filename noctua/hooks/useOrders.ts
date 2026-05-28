import { useQuery } from '@tanstack/react-query';
import { fetchAllOrders } from '../services/ordersService';
import { useOrdersStore } from '../store/ordersStore';
import { useUIStore } from '../store/uiStore';
import { useEffect } from 'react';
import { Order, PlatformId } from '../types/orders';

export function useOrders() {
  const setOrders = useOrdersStore((state) => state.setOrders);
  const setPlatformStatus = useUIStore((state) => state.setPlatformStatus);

  const query = useQuery({
    queryKey: ['orders', 'all'],
    queryFn: fetchAllOrders,
    refetchInterval: 30000,
  });

  // Query para el estado de las plataformas
  const statusQuery = useQuery({
    queryKey: ['platforms', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/platforms/status');
      return res.json();
    },
    refetchInterval: 60000, // Cada minuto
  });

  useEffect(() => {
    if (statusQuery.data) {
      Object.entries(statusQuery.data).forEach(([platform, status]) => {
        setPlatformStatus(platform as PlatformId, status as any);
      });
    }
  }, [statusQuery.data, setPlatformStatus]);

  useEffect(() => {
    if (query.data) {
      // Distribuir pedidos por plataforma en el store
      const platforms: PlatformId[] = ['pedidosya', 'rappi', 'glovo', 'ubereats'];
      platforms.forEach((p) => {
        const platformOrders = query.data.filter((o: Order) => o.platform === p);
        setOrders(p, platformOrders);
      });
    }
  }, [query.data, setOrders]);

  return query;
}
