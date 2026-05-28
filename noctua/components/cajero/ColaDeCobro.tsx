'use client';

import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, ChefHat, ShoppingBag } from 'lucide-react';
import { formatARS, elapsedMinutes, formatElapsed, cn } from '@/hooks/lib/utils';
import type { PedidoCajero } from '@/services/cajeroService';

interface Props {
  pedidos: PedidoCajero[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (pedido: PedidoCajero) => void;
}

function TimerBadge({ desde }: { desde: Date }) {
  const [elapsed, setElapsed] = useState('');
  const [mins, setMins] = useState(0);

  useEffect(() => {
    const tick = () => {
      setElapsed(formatElapsed(desde));
      setMins(elapsedMinutes(desde));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [desde]);

  const colorClass =
    mins >= 30 ? 'text-red-400' : mins >= 15 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className={cn('flex items-center gap-1 font-mono text-sm font-bold', colorClass, mins >= 30 && 'animate-pulse')}>
      <Clock size={12} />
      {elapsed}
    </div>
  );
}

export function ColaDeCobro({ pedidos, loading, error, selectedId, onSelect }: Props) {
  const ordenados = useMemo(
    () => [...pedidos].sort((a, b) => a.abiertaEn.getTime() - b.abiertaEn.getTime()),
    [pedidos]
  );

  const zonaLabel: Record<string, string> = {
    salon: 'Salón Principal',
    terraza: 'Terraza Exterior',
    bar: 'Bar',
    sofas: 'Zona Sofás',
    cocina: 'Zona Cocina',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-[#676B67] text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#676B67] border-t-white rounded-full animate-spin" />
          Cargando cola de cobro...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-red-400 text-sm text-center px-4">
        Error al cargar pedidos: {error}
      </div>
    );
  }

  if (ordenados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <ShoppingBag size={40} className="text-[#1a1a1a]" />
        </motion.div>
        <p className="text-[#3a3a3a] text-sm font-semibold">Sin mesas para cobrar</p>
        <p className="text-[#2a2a2a] text-xs">Las mesas listas aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-18rem)] pr-1">
      <AnimatePresence>
        {ordenados.map((pedido) => {
          const isSelected = pedido.id === selectedId;
          return (
            <motion.button
              key={pedido.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={() => onSelect(pedido)}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer',
                isSelected
                  ? 'bg-yellow-400/10 border-yellow-400/60'
                  : 'bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#3a3a3a] hover:bg-[#111]'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-end gap-2">
                  <span className="font-black text-4xl text-white leading-none">
                    {pedido.mesa.numero}
                  </span>
                  <div className="mb-1">
                    <p className="text-[#676B67] text-xs capitalize">
                      {zonaLabel[pedido.mesa.zona] ?? pedido.mesa.zona}
                    </p>
                  </div>
                </div>
                <TimerBadge desde={pedido.abiertaEn} />
              </div>

              <div className="flex items-center justify-between text-xs mt-1">
                <div className="flex items-center gap-1 text-[#676B67]">
                  <ShoppingBag size={11} />
                  <span>{pedido.items.length} {pedido.items.length === 1 ? 'ítem' : 'ítems'}</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  {formatARS(pedido.total)}
                </span>
              </div>

              {pedido.mozo && pedido.mozo !== 'Sin asignar' && (
                <div className="flex items-center gap-1 mt-1.5 text-[#676B67] text-xs">
                  <ChefHat size={11} />
                  <span>{pedido.mozo}</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
