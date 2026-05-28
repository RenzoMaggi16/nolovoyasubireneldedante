import type { Pedido, EstadoCocina } from '@/types/pedido';
import { usePedidosStore } from '@/store/pedidosStore';
import { useMesasStore } from '@/store/mesasStore';
import type { EstadoMesa } from '@/types/mesa';

// Mapping from kitchen state to table state
const COCINA_TO_MESA: Record<EstadoCocina, EstadoMesa> = {
  pendiente: 'esperando_pedido',
  preparando: 'esperando_pedido',
  listo: 'pedido_listo',
  entregado: 'esperando_pago',
};

export const cocinaService = {
  getPedidosActivos: async (): Promise<Pedido[]> => {
    return usePedidosStore.getState().pedidos.filter((p) => p.estado !== 'entregado');
  },

  cambiarEstadoLibre: async (pedidoId: string, nuevoEstado: EstadoCocina): Promise<void> => {
    try {
      const { actualizarEstadoPedido } = await import('@/hooks/lib/api/pedidosApi');
      await actualizarEstadoPedido(pedidoId, nuevoEstado);
    } catch (error) {
      console.error("Error al actualizar estado en BD:", error);
      return;
    }

    const { pedidos, actualizarEstadoCocina } = usePedidosStore.getState();
    const pedido = pedidos.find((p) => p.id === pedidoId);
    
    // Actualizamos Estado Local
    await actualizarEstadoCocina(pedidoId, nuevoEstado);

    if (pedido) {
      // Sincronizamos con el Store de Mesas
      const mesaEstado = COCINA_TO_MESA[nuevoEstado];
      useMesasStore.getState().setEstadoMesa(pedido.mesaId, mesaEstado);
    }
  },
};

