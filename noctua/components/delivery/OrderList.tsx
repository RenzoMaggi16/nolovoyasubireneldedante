'use client';

import { Order, OrderStatus } from '../../types/orders';
import { OrderCard } from './OrderCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { PlatformId } from '../../types/orders';

interface OrderListProps {
  orders: Order[];
  platform: PlatformId;
}

export function OrderList({ orders, platform }: OrderListProps) {
  const viewMode = useUIStore((state) => state.viewModes[platform]);

  if (viewMode === 'kanban') {
    const columns: { status: OrderStatus; label: string }[] = [
      { status: 'new', label: 'NUEVOS' },
      { status: 'confirmed', label: 'CONFIRMADOS' },
      { status: 'preparing', label: 'EN COCINA' },
      { status: 'ready', label: 'LISTOS' },
      { status: 'picked_up', label: 'EN CAMINO' },
    ];

    return (
      <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6 h-full min-h-[calc(100vh-250px)]">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex-shrink-0 w-[320px]">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-black/50 backdrop-blur-sm py-2 px-1 rounded-lg">
                <h3 className="text-xs font-bold text-white/40 tracking-widest uppercase">{col.label}</h3>
                <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white/60">
                  {colOrders.length}
                </span>
              </div>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {colOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </AnimatePresence>
                {colOrders.length === 0 && (
                  <div className="border border-dashed border-white/5 rounded-xl h-32 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white/10 tracking-widest uppercase">Sin pedidos</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <AnimatePresence mode="popLayout">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </AnimatePresence>
      {orders.length === 0 && (
        <div className="bg-surface-base border border-dashed border-white/10 rounded-2xl h-64 flex flex-col items-center justify-center">
          <span className="text-white/20 font-medium mb-2">No hay pedidos en esta plataforma</span>
          <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Todo al día</span>
        </div>
      )}
    </div>
  );
}
