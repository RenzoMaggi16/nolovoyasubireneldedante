'use client';

import { useMemo } from 'react';
import { TrendingUp, Receipt, Banknote, CreditCard } from 'lucide-react';
import { formatARS } from '@/hooks/lib/utils';
import type { PedidoCajero } from '@/services/cajeroService';
import type { Factura } from '@/types/factura';

interface Props {
  pedidosPendientes: PedidoCajero[];
  facturasHoy: Factura[];
}

export function ResumenEstadoBar({ pedidosPendientes, facturasHoy }: Props) {
  const cobradosHoy = facturasHoy.length;

  const totalRecaudado = useMemo(
    () => facturasHoy.reduce((sum, f) => sum + f.total, 0),
    [facturasHoy]
  );

  const metodoMasUsado = useMemo(() => {
    if (facturasHoy.length === 0) return '—';
    const counts: Record<string, number> = {};
    facturasHoy.forEach(f => {
      if (f.metodoPago) counts[f.metodoPago] = (counts[f.metodoPago] ?? 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const labels: Record<string, string> = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' };
    return top ? labels[top[0]] ?? top[0] : '—';
  }, [facturasHoy]);

  const stats = [
    {
      label: 'Pendientes de cobro',
      value: pedidosPendientes.length.toString(),
      icon: Receipt,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
    },
    {
      label: 'Cobrados hoy',
      value: cobradosHoy.toString(),
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20',
    },
    {
      label: 'Total recaudado hoy',
      value: formatARS(totalRecaudado),
      icon: Banknote,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    {
      label: 'Método más usado',
      value: metodoMasUsado,
      icon: CreditCard,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className={`${s.bg} border ${s.border} rounded-xl p-4 flex items-center gap-3`}
          >
            <div className={`${s.bg} rounded-lg p-2 flex-shrink-0`}>
              <Icon size={18} className={s.color} />
            </div>
            <div className="min-w-0">
              <p className="text-[#676B67] text-xs font-semibold tracking-wider uppercase leading-none mb-1 truncate">
                {s.label}
              </p>
              <p className={`font-mono font-black text-lg leading-none ${s.color} truncate`}>
                {s.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
