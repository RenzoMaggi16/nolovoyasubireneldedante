'use client';

import { OrderStatus } from '../../types/orders';
import { cn } from '@/hooks/lib/utils';
import { motion } from 'framer-motion';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'NUEVO', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  confirmed: { label: 'CONFIRMADO', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  preparing: { label: 'EN COCINA', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  ready: { label: 'LISTO', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  picked_up: { label: 'EN CAMINO', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' },
  delivered: { label: 'ENTREGADO', color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/20' },
  cancelled: { label: 'CANCELADO', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <motion.span 
      key={status}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border transition-colors whitespace-nowrap',
        config.color,
        config.bg
      )}
    >
      {config.label}
    </motion.span>
  );
}
