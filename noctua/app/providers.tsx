'use client';

/**
 * app/providers.tsx
 * Inicializa el QueryClient y el auth listener de Supabase al montar la app.
 * El ToastContainer se incluye aquí para estar disponible globalmente.
 */

import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/hooks/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { ToastContainer } from '@/components/ui/Toast';

interface ProvidersProps {
  children: React.ReactNode;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const inicializar = useAuthStore((s) => s.inicializar);

  useEffect(() => {
    // Restaurar sesión activa de Supabase al montar (sin persistencia entre cierres)
    inicializar();
  }, [inicializar]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        {children}
        <ToastContainer />
      </AuthInitializer>
    </QueryClientProvider>
  );
}
