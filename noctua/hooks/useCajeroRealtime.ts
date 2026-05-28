'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/hooks/lib/supabaseClient';
import { cajeroService, type PedidoCajero } from '@/services/cajeroService';

export function useCajeroRealtime() {
  const [pedidos, setPedidos] = useState<PedidoCajero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    try {
      const data = await cajeroService.getPedidosListosParaCobrar();
      setPedidos(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      await fetchPedidos();
    };

    init();

    const channel = supabase
      .channel('cajero-pedidos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => {
          if (mounted) fetchPedidos();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchPedidos]);

  return { pedidos, loading, error, refetch: fetchPedidos };
}
