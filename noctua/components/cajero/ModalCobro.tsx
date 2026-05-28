'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { formatARS, cn } from '@/hooks/lib/utils';
import { cajeroService, type PedidoCajero } from '@/services/cajeroService';
import { toast } from '@/components/ui/Toast';
import { IVA_RATE } from '@/hooks/lib/constants';
import type { MetodoPago } from '@/types/factura';
import type { Factura } from '@/types/factura';

interface Props {
  pedido: PedidoCajero;
  onClose: () => void;
  onCobroRegistrado: (factura: Factura, pedido: PedidoCajero) => void;
}

const METODOS = [
  { id: 'efectivo' as MetodoPago, label: 'Efectivo', icon: Banknote, color: 'text-green-400', border: 'border-green-400/40', bg: 'bg-green-400/10' },
  { id: 'tarjeta' as MetodoPago, label: 'Tarjeta', icon: CreditCard, color: 'text-blue-400', border: 'border-blue-400/40', bg: 'bg-blue-400/10' },
  { id: 'transferencia' as MetodoPago, label: 'Transferencia', icon: Smartphone, color: 'text-purple-400', border: 'border-purple-400/40', bg: 'bg-purple-400/10' },
];

export function ModalCobro({ pedido, onClose, onCobroRegistrado }: Props) {
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [descuentoPct, setDescuentoPct] = useState<string>('');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [referencia, setReferencia] = useState<string>('');
  const [procesando, setProcesando] = useState(false);

  const subtotalOriginal = useMemo(
    () => pedido.items.reduce((sum, i) => sum + i.subtotal, 0),
    [pedido]
  );

  const descuentoValor = useMemo(() => {
    const pct = parseFloat(descuentoPct);
    if (isNaN(pct) || pct <= 0) return 0;
    return subtotalOriginal * Math.min(pct, 100) / 100;
  }, [descuentoPct, subtotalOriginal]);

  const subtotalConDescuento = subtotalOriginal - descuentoValor;
  const iva = subtotalConDescuento * IVA_RATE;
  const totalFinal = subtotalConDescuento + iva;

  const vuelto = useMemo(() => {
    if (metodo !== 'efectivo') return 0;
    const recibido = parseFloat(montoRecibido);
    if (isNaN(recibido)) return 0;
    return Math.max(0, recibido - totalFinal);
  }, [montoRecibido, totalFinal, metodo]);

  const handleConfirmar = async () => {
    if (!metodo) return;
    setProcesando(true);
    try {
      const factura = await cajeroService.registrarCobro({
        pedidoId: pedido.id,
        total: totalFinal,
        metodoPago: metodo,
        descuento: descuentoValor,
      });
      toast.success('Cobro registrado correctamente');
      onCobroRegistrado(factura, pedido);
    } catch (err: any) {
      toast.error(`Error al registrar cobro: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
            <div>
              <h2 className="text-white font-black text-xl tracking-wide">Registrar cobro</h2>
              <p className="text-[#676B67] text-sm mt-0.5">Mesa {pedido.mesa.numero}</p>
            </div>
            <button onClick={onClose} className="text-[#676B67] hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Método de pago */}
            <div>
              <p className="text-xs font-semibold text-[#676B67] tracking-widest uppercase mb-3">Método de pago</p>
              <div className="grid grid-cols-3 gap-3">
                {METODOS.map((m) => {
                  const Icon = m.icon;
                  const selected = metodo === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMetodo(m.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        selected ? `${m.bg} ${m.border}` : 'bg-[#111] border-[#1a1a1a] hover:border-[#3a3a3a]'
                      )}
                    >
                      <Icon size={24} className={selected ? m.color : 'text-[#676B67]'} />
                      <span className={cn('text-xs font-semibold', selected ? m.color : 'text-[#676B67]')}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo según método */}
            {metodo === 'efectivo' && (
              <div>
                <label className="text-xs font-semibold text-[#676B67] tracking-widest uppercase block mb-2">
                  Monto recibido
                </label>
                <input
                  type="number"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  placeholder={`Ej: ${Math.ceil(totalFinal / 100) * 100}`}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-green-400/50"
                />
                {parseFloat(montoRecibido) > 0 && (
                  <div className={cn('mt-2 text-sm font-bold', vuelto >= 0 ? 'text-green-400' : 'text-red-400')}>
                    Vuelto: {formatARS(vuelto)}
                  </div>
                )}
              </div>
            )}

            {(metodo === 'tarjeta' || metodo === 'transferencia') && (
              <div>
                <label className="text-xs font-semibold text-[#676B67] tracking-widest uppercase block mb-2">
                  {metodo === 'tarjeta' ? 'Últimos 4 dígitos (opcional)' : 'Referencia / CBU (opcional)'}
                </label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder={metodo === 'tarjeta' ? '1234' : 'Ej: REF-00123'}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400/50"
                />
              </div>
            )}

            {/* Descuento */}
            <div>
              <label className="text-xs font-semibold text-[#676B67] tracking-widest uppercase block mb-2">
                Descuento (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={descuentoPct}
                onChange={(e) => setDescuentoPct(e.target.value)}
                placeholder="0"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400/50"
              />
            </div>

            {/* Totales */}
            <div className="bg-[#111] rounded-xl p-4 space-y-2 border border-[#1a1a1a]">
              <div className="flex justify-between text-sm text-[#676B67]">
                <span>Subtotal</span>
                <span className="font-mono">{formatARS(subtotalOriginal)}</span>
              </div>
              {descuentoValor > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Descuento ({descuentoPct}%)</span>
                  <span className="font-mono">− {formatARS(descuentoValor)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[#676B67]">
                <span>IVA (21%)</span>
                <span className="font-mono">{formatARS(iva)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-white border-t border-[#1a1a1a] pt-2 mt-2">
                <span>TOTAL</span>
                <span className="font-mono">{formatARS(totalFinal)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-[#1a1a1a]">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#2a2a2a] text-[#676B67] text-sm font-semibold hover:text-white hover:border-[#3a3a3a] transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!metodo || procesando}
              className="flex-[2] py-3 rounded-xl bg-white text-black text-sm font-black hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {procesando ? 'Registrando...' : `Confirmar cobro — ${formatARS(totalFinal)}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
