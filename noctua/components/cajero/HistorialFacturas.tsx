'use client';

import { useState, useMemo } from 'react';
import { Calendar, Search, FileText } from 'lucide-react';
import { formatARS } from '@/hooks/lib/utils';
import type { Factura } from '@/types/factura';

interface Props {
  facturas: Factura[];
  loading: boolean;
  error: string | null;
  fecha: string;
  onFechaChange: (fecha: string) => void;
  onVerComprobante: (factura: Factura) => void;
}

export function HistorialFacturas({ facturas, loading, error, fecha, onFechaChange, onVerComprobante }: Props) {
  const [metodoFiltro, setMetodoFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  const filtradas = useMemo(() => {
    return facturas.filter((f) => {
      const matchMetodo = metodoFiltro === 'todos' || f.metodoPago === metodoFiltro;
      const matchBusqueda =
        !busqueda ||
        f.mesa?.numero.toString() === busqueda ||
        f.id.toLowerCase().includes(busqueda.toLowerCase());
      return matchMetodo && matchBusqueda;
    });
  }, [facturas, metodoFiltro, busqueda]);

  const totalFiltrado = filtradas.reduce((sum, f) => sum + f.total, 0);

  return (
    <div className="bg-[#080808] border border-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
      {/* Barra de filtros */}
      <div className="p-4 border-b border-[#1a1a1a] flex flex-wrap items-center gap-4 bg-[#0a0a0a]">
        <div className="flex items-center gap-2 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2">
          <Calendar size={16} className="text-[#676B67]" />
          <input
            type="date"
            value={fecha}
            onChange={(e) => onFechaChange(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none"
            aria-label="Filtrar por fecha"
          />
        </div>

        <select
          value={metodoFiltro}
          onChange={(e) => setMetodoFiltro(e.target.value)}
          className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          aria-label="Filtrar por método de pago"
        >
          <option value="todos">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>

        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2">
          <Search size={16} className="text-[#676B67]" />
          <input
            type="text"
            placeholder="Buscar por mesa o ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent text-white text-sm w-full focus:outline-none placeholder:text-[#4a4a4a]"
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[#676B67] text-sm gap-2">
            <div className="w-4 h-4 border-2 border-[#676B67] border-t-white rounded-full animate-spin" />
            Cargando historial...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#676B67] gap-3">
            <FileText size={32} className="text-[#2a2a2a]" />
            <p>No hay cobros registrados para estos filtros.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#080808] z-10 border-b border-[#1a1a1a]">
              <tr className="text-[#676B67] text-xs tracking-wider uppercase text-left">
                <th className="px-6 py-4 font-semibold">Hora</th>
                <th className="px-6 py-4 font-semibold">Mesa</th>
                <th className="px-6 py-4 font-semibold">Método</th>
                <th className="px-6 py-4 font-semibold text-right">Subtotal</th>
                <th className="px-6 py-4 font-semibold text-right">Descuento</th>
                <th className="px-6 py-4 font-semibold text-right">IVA</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111]">
              {filtradas.map((f) => (
                <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-white font-mono">
                    {f.creadaEn.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-white font-bold">Mesa {f.mesa?.numero ?? '?'}</div>
                    <div className="text-[#676B67] text-xs capitalize">{f.mesa?.zona ?? ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white capitalize">
                    {f.metodoPago}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#676B67] font-mono text-right">
                    {formatARS(f.subtotal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-400 font-mono text-right">
                    {f.descuento > 0 ? `- ${formatARS(f.descuento)}` : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#676B67] font-mono text-right">
                    {formatARS(f.iva)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-mono font-bold text-right">
                    {formatARS(f.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => onVerComprobante(f)}
                      className="text-xs font-semibold text-[#676B67] border border-[#2a2a2a] rounded-lg px-3 py-1.5 hover:text-white hover:border-[#4a4a4a] transition-all"
                    >
                      Ver comprobante
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Totales */}
      <div className="p-4 border-t border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between">
        <span className="text-sm text-[#676B67]">{filtradas.length} operaciones filtradas</span>
        <div className="flex items-center gap-3">
          <span className="text-xs tracking-widest text-[#676B67] uppercase font-semibold">Total filtrado</span>
          <span className="text-xl font-black text-white font-mono">{formatARS(totalFiltrado)}</span>
        </div>
      </div>
    </div>
  );
}
