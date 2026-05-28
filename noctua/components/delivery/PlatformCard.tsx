'use client';

import { motion } from 'framer-motion';
import { Platform } from '../../types/platforms';
import { useOrdersStore } from '../../store/ordersStore';
import { useUIStore } from '../../store/uiStore';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlatformCardProps {
  platform: Platform;
  index: number;
}

export function PlatformCard({ platform, index }: PlatformCardProps) {
  const orders = useOrdersStore((state) => state.orders[platform.id]);
  const platformStatus = useUIStore((state) => state.platformStatus[platform.id]);
  const pendingCount = useOrdersStore((state) => state.getPendingCount(platform.id));
  
  const pendingOrders = orders.filter(o => ['new', 'confirmed', 'preparing'].includes(o.status));
  const oldestOrder = pendingOrders.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )[0];

  const stats = {
    nuevos: orders.filter(o => o.status === 'new').length,
    cocina: orders.filter(o => o.status === 'confirmed' || o.status === 'preparing').length,
    listos: orders.filter(o => o.status === 'ready').length,
  };

  const hasNewOrders = stats.nuevos > 0;
  const isConnected = platformStatus === 'connected';
  const isError = platformStatus === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <Link href={`/delivery/${platform.id}`}>
        <div className="bg-surface-base border border-white/5 rounded-2xl p-6 transition-all duration-300 group-hover:border-white/10 group-hover:shadow-2xl group-hover:shadow-black/40 h-full flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                style={{ backgroundColor: platform.color }}
              >
                {platform.icon}
              </div>
              <div>
                <h3 className="font-bold text-white tracking-tight">{platform.displayName}</h3>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-green-500' : isError ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    {isConnected ? 'Conectado' : isError ? 'Error' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>

            {hasNewOrders && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md"
              >
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                  {stats.nuevos} NUEVOS
                </span>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Clock size={14} className="text-white/20" />
            <span className="text-xs text-white/40">
              {oldestOrder 
                ? `Hace ${formatDistanceToNow(new Date(oldestOrder.createdAt), { locale: es })} el más antiguo`
                : 'Sin pedidos pendientes'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'NUEVOS', value: stats.nuevos },
              { label: 'COCINA', value: stats.cocina },
              { label: 'LISTOS', value: stats.listos },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center border border-white/[0.02]">
                <span className="text-[10px] font-bold text-white/30 mb-1">{stat.label}</span>
                <span className="text-lg font-bold text-white">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center group-hover:text-white transition-colors">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest group-hover:text-white/60">
              Gestionar Pedidos
            </span>
            <ArrowRight size={14} className="text-white/20 group-hover:text-white/60 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
