'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPlatforms } from '../../services/platformsService';
import { PlatformGrid } from '../../components/delivery/PlatformGrid';
import { Header } from '../../components/ui/Header';
import { useOrders } from '../../hooks/useOrders';
import { useRealTimeOrders } from '../../hooks/useRealTimeOrders';

export default function DeliveryHubPage() {
  const { data: platforms, isLoading: isLoadingPlatforms } = useQuery({
    queryKey: ['platforms'],
    queryFn: fetchPlatforms,
  });

  // Cargar pedidos iniciales y activar tiempo real global
  const { isLoading: isLoadingOrders } = useOrders();
  useRealTimeOrders();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Header 
        title="Delivery Hub" 
        subtitle="Monitoreo centralizado de pedidos en tiempo real para todas tus plataformas" 
      />

      <PlatformGrid 
        platforms={platforms || []} 
        isLoading={isLoadingPlatforms || isLoadingOrders} 
      />
    </div>
  );
}
