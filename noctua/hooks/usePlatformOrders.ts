import { useQuery } from '@tanstack/react-query';
import { fetchOrdersByPlatform } from '../services/ordersService';
import { useOrdersStore } from '../store/ordersStore';
import { useEffect } from 'react';
import { PlatformId } from '../types/orders';

export function usePlatformOrders(platform: PlatformId) {
  const setOrders = useOrdersStore((state) => state.setOrders);

  const isPollingPlatform = platform === 'pedidosya' || platform === 'rappi';

  const query = useQuery({
    queryKey: ['orders', platform],
    queryFn: () => fetchOrdersByPlatform(platform),
    refetchInterval: isPollingPlatform ? 15000 : false,
  });

  useEffect(() => {
    if (query.data) {
      setOrders(platform, query.data);
    }
  }, [query.data, platform, setOrders]);

  return query;
}
