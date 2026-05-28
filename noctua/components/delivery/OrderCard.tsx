'use client';

import { Order, OrderStatus } from '../../types/orders';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { OrderStatusBadge } from './OrderStatusBadge';
import { useOrderActions } from '../../hooks/useOrderActions';
import { Clock, Printer, Check, X, ChevronRight } from 'lucide-react';
import { cn } from '@/hooks/lib/utils';
import { useState, useEffect } from 'react';

interface OrderCardProps {
  order: Order;
  priority?: boolean;
}

export function OrderCard({ order, priority = false }: OrderCardProps) {
  const { updateStatus } = useOrderActions();
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const diff = Date.now() - new Date(order.createdAt).getTime();
      setElapsedMinutes(Math.floor(diff / 60000));
    };
    calculate();
    const interval = setInterval(calculate, 30000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const isWarning = elapsedMinutes >= 15 && elapsedMinutes < 25 && order.status !== 'delivered' && order.status !== 'cancelled';
  const isUrgent = elapsedMinutes >= 25 && order.status !== 'delivered' && order.status !== 'cancelled';

  const nextStatus: Record<string, OrderStatus | null> = {
    new: 'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'picked_up',
    picked_up: 'delivered',
  };

  const handleNextStatus = () => {
    const next = nextStatus[order.status];
    if (next) {
      updateStatus({ orderId: order.id, status: next, platform: order.platform });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-surface-elevated border rounded-xl p-4 transition-all duration-300',
        isUrgent ? 'border-red-500 animate-pulse-red' : 
        isWarning ? 'border-yellow-500/50' : 'border-white/5',
        'hover:border-white/10'
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1">
            Pedido #{order.externalId}
          </span>
          <h4 className="font-bold text-white text-sm">{order.customer.name}</h4>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Clock size={12} className={cn(
          isUrgent ? 'text-red-500' : 
          isWarning ? 'text-yellow-500' : 'text-green-500'
        )} />
        <span className={cn(
          'text-[10px] font-medium',
          isUrgent ? 'text-red-500 font-bold' : 
          isWarning ? 'text-yellow-500 font-bold' : 'text-green-500 font-bold'
        )}>
          Hace {formatDistanceToNow(new Date(order.createdAt), { locale: es })}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-xs">
            <span className="text-white/60">
              <span className="font-bold text-white/90">{item.quantity}x</span> {item.name}
            </span>
            <span className="text-white/40">${(item.unitPrice * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-white/5 flex justify-between items-center">
        <span className="font-bold text-white text-sm">${order.total.toLocaleString()}</span>
        <div className="flex gap-2">
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
            <Printer size={16} />
          </button>
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button
              onClick={handleNextStatus}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
            >
              SIGUIENTE <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
