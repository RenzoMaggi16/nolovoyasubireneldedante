'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, User, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { formatARS, cn } from '@/hooks/lib/utils';
import { cajeroService, type PedidoCajero, type ItemCajero } from '@/services/cajeroService';
import { toast } from '@/components/ui/Toast';
import { IVA_RATE } from '@/hooks/lib/constants';

interface Props {
  pedido: PedidoCajero | null;
  onCobrar: (pedido: PedidoCajero) => void;
  onPedidoCancelado: () => void;
  onPedidoActualizado: (pedido: PedidoCajero) => void;
}

export function PedidoDetallePanel({ pedido, onCobrar, onPedidoCancelado, onPedidoActualizado }: Props) {
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const subtotal = pedido ? pedido.items.reduce((sum, i) => sum + i.subtotal, 0) : 0;
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;

  const zonaLabel: Record<string, string> = {
    salon: 'Salón Principal', terraza: 'Terraza Exterior',
    bar: 'Bar', sofas: 'Zona Sofás', cocina: 'Zona Cocina',
  };

  const handleCambiarCantidad = useCallback(async (item: ItemCajero, delta: number) => {
    if (!pedido) return;
    const nuevaCantidad = item.cantidad + delta;
    if (nuevaCantidad < 1) return;
    const nuevoSubtotal = nuevaCantidad * item.precioUnitario;
    try {
      await cajeroService.updateItemCantidad(item.id, nuevaCantidad, nuevoSubtotal);
      const nuevosItems = pedido.items.map(i =>
        i.id === item.id ? { ...i, cantidad: nuevaCantidad, subtotal: nuevoSubtotal } : i
      );
      const nuevoTotal = nuevosItems.reduce((s, i) => s + i.subtotal, 0) * (1 + IVA_RATE);
      onPedidoActualizado({ ...pedido, items: nuevosItems, total: nuevoTotal });
    } catch {
      toast.error('No se pudo actualizar la cantidad');
    }
  }, [pedido, onPedidoActualizado]);

  const handleEliminarItem = useCallback(async (itemId: string) => {
    if (!pedido) return;
    try {
      await cajeroService.deleteItem(itemId);
      const nuevosItems = pedido.items.filter(i => i.id !== itemId);
      const nuevoTotal = nuevosItems.reduce((s, i) => s + i.subtotal, 0) * (1 + IVA_RATE);
      onPedidoActualizado({ ...pedido, items: nuevosItems, total: nuevoTotal });
    } catch {
      toast.error('No se pudo eliminar el ítem');
    }
  }, [pedido, onPedidoActualizado]);

  const handleCancelarPedido = async () => {
    if (!pedido) return;
    setProcesando(true);
    try {
      await cajeroService.updatePedidoEstado(pedido.id, 'cancelado');
      toast.success('Pedido cancelado correctamente');
      onPedidoCancelado();
    } catch {
      toast.error('No se pudo cancelar el pedido');
    } finally {
      setProcesando(false);
      setConfirmandoCancelacion(false);
    }
  };

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3">
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <CreditCard size={48} className="text-[#1a1a1a]" />
        </motion.div>
        <p className="text-[#3a3a3a] text-sm font-semibold">Seleccioná una mesa para ver el detalle</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#080808] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-end gap-3">
              <span className="font-black text-5xl text-white leading-none">Mesa {pedido.mesa.numero}</span>
            </div>
            <p className="text-[#676B67] text-sm mt-1 capitalize">
              {zonaLabel[pedido.mesa.zona] ?? pedido.mesa.zona}
            </p>
          </div>
          <div className="text-right text-xs text-[#676B67] space-y-1 mt-1">
            <div className="flex items-center gap-1 justify-end">
              <User size={12} />
              <span>{pedido.mozo}</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Clock size={12} />
              <span>{pedido.abiertaEn.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a1a1a] text-[#676B67] text-xs font-semibold tracking-wider uppercase">
              <th className="text-left px-5 py-3">Cantidad</th>
              <th className="text-left px-2 py-3">Producto</th>
              <th className="text-right px-2 py-3 hidden md:table-cell">P. Unit.</th>
              <th className="text-right px-2 py-3">Subtotal</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pedido.items.map((item) => (
              <tr key={item.id} className="border-b border-[#111] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCambiarCantidad(item, -1)}
                      disabled={item.cantidad <= 1}
                      aria-label="Reducir cantidad"
                      className="w-6 h-6 rounded bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] disabled:opacity-30 flex items-center justify-center transition-colors"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="w-6 text-center text-white font-bold">{item.cantidad}</span>
                    <button
                      onClick={() => handleCambiarCantidad(item, 1)}
                      aria-label="Aumentar cantidad"
                      className="w-6 h-6 rounded bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] flex items-center justify-center transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-3 text-white font-medium">{item.nombre}</td>
                <td className="px-2 py-3 text-[#676B67] font-mono text-right hidden md:table-cell">
                  {formatARS(item.precioUnitario)}
                </td>
                <td className="px-2 py-3 text-white font-mono font-semibold text-right">
                  {formatARS(item.subtotal)}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleEliminarItem(item.id)}
                    aria-label={`Eliminar ${item.nombre}`}
                    className="text-[#3a3a3a] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="border-t border-[#1a1a1a] p-5 space-y-2 flex-shrink-0">
        <div className="flex justify-between text-sm text-[#676B67]">
          <span>Subtotal (sin IVA)</span>
          <span className="font-mono">{formatARS(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[#676B67]">
          <span>IVA (21%)</span>
          <span className="font-mono">{formatARS(iva)}</span>
        </div>
        <div className="flex justify-between text-lg font-black text-white border-t border-[#1a1a1a] pt-2 mt-2">
          <span>TOTAL</span>
          <span className="font-mono">{formatARS(total)}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-5 border-t border-[#1a1a1a] flex gap-3 flex-shrink-0">
        {!confirmandoCancelacion ? (
          <>
            <button
              onClick={() => setConfirmandoCancelacion(true)}
              className="flex-1 py-3 rounded-xl border border-red-800/50 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all"
            >
              Cancelar pedido
            </button>
            <button
              onClick={() => onCobrar({ ...pedido, total })}
              disabled={pedido.items.length === 0}
              className="flex-[2] py-3 rounded-xl bg-white text-black text-sm font-black hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cobrar — {formatARS(total)}
            </button>
          </>
        ) : (
          <div className="flex-1 bg-red-900/20 border border-red-800/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
              <AlertTriangle size={16} />
              ¿Cancelar el pedido definitivamente?
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmandoCancelacion(false)}
                className="flex-1 py-2 rounded-lg border border-[#2a2a2a] text-[#676B67] text-sm hover:text-white transition-colors"
              >
                No, volver
              </button>
              <button
                onClick={handleCancelarPedido}
                disabled={procesando}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {procesando ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
