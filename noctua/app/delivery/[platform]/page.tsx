'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePlatformOrders } from '../../../hooks/usePlatformOrders';
import { useRealTimeOrders } from '../../../hooks/useRealTimeOrders';
import { OrderList } from '../../../components/delivery/OrderList';
import { OrderFilters } from '../../../components/delivery/OrderFilters';
import { PlatformId } from '../../../types/orders';
import { motion } from 'framer-motion';
import { ChevronLeft, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { useOrdersStore } from '../../../store/ordersStore';
import { useUIStore } from '../../../store/uiStore';
import { useEffect, useMemo } from 'react';
import { Header } from '../../../components/ui/Header';
import { Toggle } from '../../../components/ui/Toggle';

const PLATFORM_NAMES: Record<PlatformId, string> = {
  pedidosya: 'PedidosYa',
  rappi: 'Rappi',
  glovo: 'Glovo',
  ubereats: 'UberEats',
};

export default function PlatformPage() {
  const params = useParams();
  const router = useRouter();
  const platform = params.platform as PlatformId;
  
  const { isLoading, refetch, isFetching } = usePlatformOrders(platform);
  useRealTimeOrders(platform);
  
  const getOrdersByPlatform = useOrdersStore((state) => state.getOrdersByPlatform);
  const activeFilters = useUIStore((state) => state.activeFilters);
  const viewMode = useUIStore((state) => state.viewModes[platform]);
  const setViewMode = useUIStore((state) => state.setViewMode);
  
  const orders = getOrdersByPlatform(platform);
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchMatch = !activeFilters.search || 
        order.externalId.toLowerCase().includes(activeFilters.search.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(activeFilters.search.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(activeFilters.search.toLowerCase()));
      
      const statusMatch = activeFilters.status.length === 0 || 
        activeFilters.status.includes(order.status);
        
      return searchMatch && statusMatch;
    });
  }, [orders, activeFilters]);

  if (!PLATFORM_NAMES[platform]) {
    return <div>Plataforma no válida</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/delivery')}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <Header 
          title={PLATFORM_NAMES[platform]} 
          subtitle="Gestión de pedidos en tiempo real"
        />
        
        <div className="ml-auto flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode(platform, 'kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
              title="Vista Kanban"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode(platform, 'list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
              title="Vista Lista"
            >
              <List size={18} />
            </button>
          </div>

          <button 
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <header className="mb-8">
        <OrderFilters platform={platform} />
      </header>

      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <OrderList orders={filteredOrders} platform={platform} />
        )}
      </main>
    </div>
  );
}
