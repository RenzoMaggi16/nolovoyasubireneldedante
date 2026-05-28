'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, AlertTriangle } from 'lucide-react';
import { formatARS } from '@/hooks/lib/utils';
import type { Factura } from '@/types/factura';

interface Props {
  factura: Factura;
  onClose: () => void;
}

export function ModalFactura({ factura, onClose }: Props) {
  const handleImprimir = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 print:bg-white print:p-0 print:absolute print:inset-0 print:block"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white text-black w-full max-w-sm rounded-none md:rounded-xl overflow-hidden shadow-2xl relative flex flex-col print:shadow-none print:max-w-full print:w-full"
        >
          {/* Ocultar barra superior y botones al imprimir */}
          <div className="absolute top-4 right-4 flex gap-2 print:hidden">
            <button
              onClick={handleImprimir}
              className="bg-black/5 hover:bg-black/10 p-2 rounded-full transition-colors text-black"
              aria-label="Imprimir comprobante"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={onClose}
              className="bg-black/5 hover:bg-black/10 p-2 rounded-full transition-colors text-black"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 pb-12 font-mono text-sm leading-relaxed" id="recibo-imprimir">
            <div className="text-center mb-6">
              <h1 className="font-black text-2xl tracking-widest mb-1 font-display">NOCTUA</h1>
              <p className="text-gray-500 text-xs tracking-widest uppercase">Comprobante de Pago</p>
            </div>

            <div className="border-t border-b border-gray-200 py-3 mb-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Mesa:</span>
                <span className="font-bold">{factura.mesa?.numero ?? '?'} — {factura.mesa?.zona ?? ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha:</span>
                <span className="font-bold">
                  {factura.creadaEn.toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Método:</span>
                <span className="font-bold capitalize">{factura.metodoPago}</span>
              </div>
            </div>

            <div className="mb-6 min-h-[100px]">
              <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-2">
                <span>Cant x Producto</span>
                <span>Subtotal</span>
              </div>
              {(factura.items || []).map((item, i) => (
                <div key={i} className="flex justify-between mb-1">
                  <span className="truncate pr-4">
                    {item.cantidad} x {item.nombre}
                  </span>
                  <span className="whitespace-nowrap">{formatARS(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-1">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span>{formatARS(factura.subtotal)}</span>
              </div>
              {factura.descuento > 0 && (
                <div className="flex justify-between text-gray-800">
                  <span>Descuento:</span>
                  <span>- {formatARS(factura.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>IVA (21%):</span>
                <span>{formatARS(factura.iva)}</span>
              </div>
              <div className="flex justify-between text-lg font-black mt-2 pt-2 border-t border-gray-300">
                <span>TOTAL:</span>
                <span>{formatARS(factura.total)}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-gray-300 flex flex-col items-center text-center">
              <p className="text-xs text-gray-500 mb-4">CAE: {factura.cae}</p>
              
              <div className="w-32 h-32 bg-gray-100 border border-gray-300 rounded flex flex-col items-center justify-center p-2 mb-6">
                <div className="text-gray-400 mb-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 mx-auto">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM10 10h4v4h-4z" />
                  </svg>
                </div>
                <span className="text-[10px] text-gray-400 font-sans tracking-tight leading-tight">
                  QR Fiscal<br/>(demo)
                </span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-sans max-w-[250px] mx-auto print:bg-transparent print:border-black print:text-black">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>Modo demo — AFIP no conectado</span>
              </div>
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-400 print:hidden">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-black text-white font-sans font-semibold rounded-lg hover:bg-gray-800 transition-colors w-full"
              >
                Cerrar comprobante
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
