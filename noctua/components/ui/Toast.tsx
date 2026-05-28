'use client';

/**
 * components/ui/Toast.tsx
 * Sistema de notificaciones toast global.
 * Uso: import { toast } from '@/components/ui/Toast'
 *      toast.success('Mensaje') | toast.error('Error')
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/hooks/lib/utils';
import { useNotificationsStore, Notification } from '@/store/notificationsStore';

export function ToastContainer() {
  const { notifications } = useNotificationsStore();

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((item) => (
          <ToastItem key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ item }: { item: Notification }) {
  const removeNotification = useNotificationsStore((s) => s.removeNotification);

  useEffect(() => {
    const timer = setTimeout(() => {
      removeNotification(item.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [item.id, removeNotification]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-medium max-w-xs backdrop-blur-md',
        item.type === 'success' && 'bg-[#0d1f0d]/90 border-green-800/60 text-green-300',
        item.type === 'error' && 'bg-[#1f0d0d]/90 border-red-800/60 text-red-300',
        item.type === 'info' && 'bg-[#0d151f]/90 border-blue-800/60 text-blue-300',
        item.type === 'warning' && 'bg-[#1f1a0d]/90 border-yellow-800/60 text-yellow-300'
      )}
      role="status"
    >
      <ToastIcon type={item.type} />
      <div className="flex-1 overflow-hidden">
        <p className="font-bold text-[10px] uppercase tracking-widest opacity-60 mb-0.5">{item.title}</p>
        <p className="line-clamp-2 leading-snug">{item.message}</p>
      </div>
      <button
        onClick={() => removeNotification(item.id)}
        className="flex-shrink-0 p-1 hover:bg-white/5 rounded-lg transition-colors opacity-50 hover:opacity-100"
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

function ToastIcon({ type }: { type: Notification['type'] }) {
  switch (type) {
    case 'success': return <CheckCircle size={18} className="text-green-400 flex-shrink-0" />;
    case 'error': return <XCircle size={18} className="text-red-400 flex-shrink-0" />;
    case 'warning': return <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0" />;
    default: return <Info size={18} className="text-blue-400 flex-shrink-0" />;
  }
}

// Mantener el helper por conveniencia
export const toast = {
  success: (title: string, message: string) => useNotificationsStore.getState().addNotification({ title, message, type: 'success' }),
  error: (title: string, message: string) => useNotificationsStore.getState().addNotification({ title, message, type: 'error' }),
};
