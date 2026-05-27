'use client';

/**
 * components/ui/Toast.tsx
 * Sistema de notificaciones toast global.
 * Uso: import { toast } from '@/components/ui/Toast'
 *      toast.success('Mensaje') | toast.error('Error')
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/hooks/lib/utils';

export type ToastType = 'success' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

// Singleton event bus para disparar toasts desde cualquier lugar
type ToastListener = (item: ToastItem) => void;
const listeners: ToastListener[] = [];

function dispatch(item: ToastItem) {
  listeners.forEach((fn) => fn(item));
}

// API pública — importar toast y llamar toast.success() o toast.error()
export const toast = {
  success: (message: string) =>
    dispatch({ id: Math.random().toString(36).slice(2), type: 'success', message }),
  error: (message: string) =>
    dispatch({ id: Math.random().toString(36).slice(2), type: 'error', message }),
};

// Componente que renderiza los toasts — incluir en el layout raíz
export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler: ToastListener = (item) => {
      setItems((prev) => [...prev, item]);
      setTimeout(() => remove(item.id), 3500);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, [remove]);

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium max-w-xs',
              item.type === 'success'
                ? 'bg-[#0d1f0d] border-green-800/60 text-green-300'
                : 'bg-[#1f0d0d] border-red-800/60 text-red-300'
            )}
            role="status"
          >
            {item.type === 'success' ? (
              <CheckCircle size={16} className="flex-shrink-0 text-green-400" />
            ) : (
              <XCircle size={16} className="flex-shrink-0 text-red-400" />
            )}
            <span className="flex-1">{item.message}</span>
            <button
              onClick={() => remove(item.id)}
              className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Cerrar notificación"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
