import { useEffect, useState } from 'react';
import { supabase } from '@/hooks/lib/supabaseClient';
import { obtenerPedidos } from '@/hooks/lib/api/pedidosApi';
import { usePedidosStore } from '@/store/pedidosStore';

export function useCocinaRealtime() {
  const pedidos = usePedidosStore((state) => state.pedidos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchInitial = async () => {
      try {
        const data = await obtenerPedidos();
        if (mounted) {
          usePedidosStore.setState({ pedidos: data });
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchInitial();

    const subscription = supabase
      .channel('cocina-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchInitial();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_items' }, () => {
        fetchInitial();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(subscription);
    };
  }, []);

  return { pedidos, loading, error };
}
