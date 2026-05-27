"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Pedido, ItemPedido, EstadoCocina } from "@/types/pedido";
import { generateId } from "@/hooks/lib/utils";
import { useMesasStore } from "@/store/mesasStore";
import { useStockStore } from "@/store/stockStore";

interface PedidosState {
  pedidos: Pedido[];
  pedidoActual: Pedido | null;
  mesaActivaId: string | null;

  cargarPedidos: () => Promise<void>;

  // Pedido actual (en construcción)
  iniciarPedido: (mesaId: string, numeroMesa: number, zona: string, personas: number) => void;
  setMesaActiva: (mesaId: string | null) => void;
  agregarItem: (item: Omit<ItemPedido, 'subtotal'>) => void;
  quitarItem: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  cancelarPedido: () => void;

  // Enviar a cocina
  enviarPedido: () => Promise<Pedido | null>;

  // Actualizar estado (desde cocina)
  actualizarEstadoCocina: (pedidoId: string, estado: EstadoCocina) => Promise<void>;
  eliminarPedido: (pedidoId: string) => void;

  // Getters
  getPedidoPorMesa: (mesaId: string) => Pedido | undefined;
}

export const usePedidosStore = create<PedidosState>()(
  persist(
    (set, get) => ({
  pedidos: [],
  pedidoActual: null,
  mesaActivaId: null,

  cargarPedidos: async () => {
    // Los pedidos ahora se cargan desde localStorage gracias a zustand/persist
  },

  iniciarPedido: (mesaId, numeroMesa, zona, personas) => {
    const existente = get().pedidos.find((p) => p.mesaId === mesaId && p.estado !== 'entregado');
    if (existente) {
      set({ pedidoActual: existente, mesaActivaId: mesaId });
      return;
    }
    set({
      pedidoActual: {
        id: generateId(),
        mesaId,
        numeroMesa,
        zona,
        items: [],
        total: 0,
        estado: 'pendiente',
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        personas,
      },
      mesaActivaId: mesaId,
    });
  },

  setMesaActiva: (mesaId) => set({ mesaActivaId: mesaId }),

  agregarItem: (item) =>
    set((state) => {
      if (!state.pedidoActual) return {};
      const existIdx = state.pedidoActual.items.findIndex((i) => i.productoId === item.productoId);
      let newItems: ItemPedido[];
      if (existIdx >= 0) {
        newItems = state.pedidoActual.items.map((i, idx) =>
          idx === existIdx
            ? { ...i, cantidad: i.cantidad + item.cantidad, subtotal: (i.cantidad + item.cantidad) * i.precioUnitario }
            : i
        );
      } else {
        newItems = [...state.pedidoActual.items, { ...item, subtotal: item.cantidad * item.precioUnitario }];
      }
      const total = newItems.reduce((acc, i) => acc + i.subtotal, 0);
      return { pedidoActual: { ...state.pedidoActual, items: newItems, total } };
    }),

  quitarItem: (productoId) =>
    set((state) => {
      if (!state.pedidoActual) return {};
      const newItems = state.pedidoActual.items.filter((i) => i.productoId !== productoId);
      const total = newItems.reduce((acc, i) => acc + i.subtotal, 0);
      return { pedidoActual: { ...state.pedidoActual, items: newItems, total } };
    }),

  cambiarCantidad: (productoId, cantidad) =>
    set((state) => {
      if (!state.pedidoActual) return {};
      if (cantidad <= 0) {
        const newItems = state.pedidoActual.items.filter((i) => i.productoId !== productoId);
        const total = newItems.reduce((acc, i) => acc + i.subtotal, 0);
        return { pedidoActual: { ...state.pedidoActual, items: newItems, total } };
      }
      const newItems = state.pedidoActual.items.map((i) =>
        i.productoId === productoId
          ? { ...i, cantidad, subtotal: cantidad * i.precioUnitario }
          : i
      );
      const total = newItems.reduce((acc, i) => acc + i.subtotal, 0);
      return { pedidoActual: { ...state.pedidoActual, items: newItems, total } };
    }),

  cancelarPedido: () => set({ pedidoActual: null }),

  enviarPedido: async () => {
    const { pedidoActual, pedidos } = get();
    if (!pedidoActual || pedidoActual.items.length === 0) return null;

    // Use a try catch to call Supabase via api
    try {
      const { crearPedido } = await import("@/hooks/lib/api/pedidosApi");
      
      const result = await crearPedido({
        mesaId: pedidoActual.mesaId,
        numeroMesa: pedidoActual.numeroMesa,
        zona: pedidoActual.zona,
        personas: pedidoActual.personas,
        total: pedidoActual.total,
        items: pedidoActual.items.map(i => ({
          productoId: i.productoId,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.subtotal,
          notas: i.notas
        }))
      });

      const pedidoFinal = result.pedido;

      const existIdx = pedidos.findIndex((p) => p.id === pedidoFinal.id);
      const newPedidos = existIdx >= 0
        ? pedidos.map((p) => (p.id === pedidoFinal.id ? pedidoFinal : p))
        : [...pedidos, pedidoFinal];

      set({ pedidos: newPedidos, pedidoActual: null });

      // Sincronización con el store de mesas
      useMesasStore.getState().asignarPedido(pedidoFinal.mesaId, pedidoFinal.id);
      useMesasStore.getState().setEstadoMesa(pedidoFinal.mesaId, 'esperando_pedido');

      // Descontar stock de los productos
      pedidoFinal.items.forEach(item => {
        useStockStore.getState().modificarStock(item.productoId, -item.cantidad);
      });

      return pedidoFinal;
    } catch (error) {
      console.error("Error al enviar pedido a la base de datos:", error);
      // Fallback local en caso de error (o mostrar error)
      alert("Hubo un error al enviar el pedido a cocina. Inténtalo de nuevo.");
      return null;
    }
  },

  actualizarEstadoCocina: async (pedidoId, estado) => {
    set((state) => ({
      pedidos: state.pedidos.map((p) =>
        p.id === pedidoId ? { ...p, estado, actualizadoEn: new Date() } : p
      ),
    }));
  },

  eliminarPedido: (pedidoId) =>
    set((state) => ({
      pedidos: state.pedidos.filter((p) => p.id !== pedidoId),
    })),

  getPedidoPorMesa: (mesaId) =>
    get().pedidos.find((p) => p.mesaId === mesaId && p.estado !== 'entregado'),
    }),
    { name: "pedidos-storage" }
  )
);
