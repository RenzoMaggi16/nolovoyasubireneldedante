'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, AlertTriangle } from 'lucide-react';
import { formatARS, cn } from '@/hooks/lib/utils';
import { cajeroService } from '@/services/cajeroService';
import type { Factura } from '@/types/factura';

function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

interface DatosCierre {
  total: number;
  cantidad: number;
  ticketPromedio: number;
  mayorCobro: number;
  byMetodo: Record<string, { total: number; cantidad: number }>;
  byHora: Record<number, { total: number; cantidad: number }>;
  facturas: Factura[];
}

export function CierreDeCaja() {
  const [fecha, setFecha] = useState<string>(hoy());
  const [datos, setDatos] = useState<DatosCierre | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatos = useCallback(async (f: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await cajeroService.getDatosCierreCaja(f);
      setDatos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatos(fecha);
  }, [fecha, fetchDatos]);

  const handleExportar = () => {
    if (!datos) return;
    
    const lineas = [
      `=== RESUMEN DE CAJA: ${fecha} ===`,
      `Generado: ${new Date().toLocaleString('es-AR')}`,
      '',
      '--- MÉTRICAS ---',
      `Total recaudado:   ${formatARS(datos.total)}`,
      `Cantidad cobros:   ${datos.cantidad}`,
      `Ticket promedio:   ${formatARS(datos.ticketPromedio)}`,
      `Mayor cobro:       ${formatARS(datos.mayorCobro)}`,
      '',
      '--- POR MÉTODO DE PAGO ---',
      `Efectivo:          ${formatARS(datos.byMetodo.efectivo?.total ?? 0)} (${datos.byMetodo.efectivo?.cantidad ?? 0} op)`,
      `Tarjeta:           ${formatARS(datos.byMetodo.tarjeta?.total ?? 0)} (${datos.byMetodo.tarjeta?.cantidad ?? 0} op)`,
      `Transferencia:     ${formatARS(datos.byMetodo.transferencia?.total ?? 0)} (${datos.byMetodo.transferencia?.cantidad ?? 0} op)`,
      '',
      '--- DESGLOSE DE OPERACIONES ---',
    ];

    datos.facturas.forEach(f => {
      const hora = f.creadaEn.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      lineas.push(`[${hora}] Mesa ${f.mesa?.numero ?? '?'} | ${f.metodoPago.padEnd(14)} | ${formatARS(f.total)}`);
    });

    const blob = new Blob([lineas.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cierre_caja_${fecha}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Selector de fecha */}
      <div className="bg-[#080808] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-black text-xl tracking-wide font-display">Cierre de Caja</h2>
          <p className="text-[#676B67] text-sm mt-1">Resumen financiero consolidado por jornada.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3">
          <Calendar size={18} className="text-[#676B67]" />
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="bg-transparent text-white focus:outline-none"
            aria-label="Seleccionar fecha de cierre"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-[#676B67]">Cargando métricas de cierre...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-6 text-red-400 flex gap-3">
          <AlertTriangle />
          <p>Error: {error}</p>
        </div>
      ) : datos ? (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[#676B67] text-xs font-semibold tracking-widest uppercase mb-1">Total recaudado</p>
              <p className="text-white font-mono font-black text-2xl">{formatARS(datos.total)}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[#676B67] text-xs font-semibold tracking-widest uppercase mb-1">Cantidad de cobros</p>
              <p className="text-white font-mono font-black text-2xl">{datos.cantidad}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[#676B67] text-xs font-semibold tracking-widest uppercase mb-1">Ticket promedio</p>
              <p className="text-white font-mono font-black text-2xl">{formatARS(datos.ticketPromedio)}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[#676B67] text-xs font-semibold tracking-widest uppercase mb-1">Mayor cobro</p>
              <p className="text-white font-mono font-black text-2xl">{formatARS(datos.mayorCobro)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desglose por método */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
              <h3 className="text-white font-bold tracking-widest uppercase mb-6 text-sm">Desglose por método</h3>
              <div className="space-y-5">
                {[
                  { id: 'efectivo', label: 'Efectivo', color: 'bg-green-500' },
                  { id: 'tarjeta', label: 'Tarjeta', color: 'bg-blue-500' },
                  { id: 'transferencia', label: 'Transferencia', color: 'bg-yellow-500' },
                ].map(m => {
                  const d = datos.byMetodo[m.id] || { total: 0, cantidad: 0 };
                  const pct = datos.total > 0 ? (d.total / datos.total) * 100 : 0;
                  return (
                    <div key={m.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white font-medium">{m.label} <span className="text-[#676B67] text-xs">({d.cantidad} op)</span></span>
                        <span className="text-white font-mono font-bold">{formatARS(d.total)}</span>
                      </div>
                      <div className="w-full bg-[#111] rounded-full h-2 overflow-hidden">
                        <div className={cn('h-full transition-all duration-500', m.color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actividad por hora */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col">
              <h3 className="text-white font-bold tracking-widest uppercase mb-6 text-sm">Actividad por hora</h3>
              
              <div className="flex-1 flex items-end justify-between gap-1 mt-auto h-32 border-b border-[#1a1a1a] pb-2">
                {Array.from({ length: 24 }).map((_, h) => {
                  const d = datos.byHora[h];
                  const maxCount = Math.max(...Object.values(datos.byHora).map(x => x.cantidad), 1);
                  const pct = (d.cantidad / maxCount) * 100;
                  return (
                    <div 
                      key={h} 
                      className="group relative flex-1 flex flex-col justify-end h-full"
                      title={`${h}:00 — ${d.cantidad} cobros — ${formatARS(d.total)}`}
                    >
                      <div 
                        className={cn('w-full rounded-t-sm transition-all', d.cantidad > 0 ? 'bg-white group-hover:bg-yellow-400' : 'bg-transparent')} 
                        style={{ height: `${Math.max(pct, d.cantidad > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[#676B67] text-xs mt-2 font-mono">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:59</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExportar}
              disabled={datos.cantidad === 0}
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              Exportar resumen del día (.txt)
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
