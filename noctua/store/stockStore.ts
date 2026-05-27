"use client";

import { create } from "zustand";
import type { Producto, Categoria } from "@/types/producto";
import { obtenerProductos, crearProducto, obtenerCategorias, actualizarStockBD } from "@/hooks/lib/api/productosApi";

const debounceTimers: Record<string, NodeJS.Timeout> = {};

interface StockState {
  categorias: Categoria[];
  productos: Producto[];
  categoriaActiva: string | null;
  isLoading: boolean;
  error: string | null;

  cargarCategorias: () => Promise<void>;
  cargarProductos: () => Promise<void>;
  agregarProducto: (data: {
    nombre: string;
    precio: number;
    categoria_id: string;
    stock: number;
    disponible: boolean;
  }) => Promise<void>;
  setCategoriaActiva: (catId: string) => void;
  modificarStock: (id: string, delta: number) => void;
  toggleDisponibilidad: (id: string) => void;
  getProductosPorCategoria: (catId: string | null) => Producto[];
  getTotalValorizado: () => number;
  getTotalPorCategoria: (catId: string | null) => number;
  actualizarStockProducto: (id: string, nuevoStock: number) => Promise<void>;
  eliminarProductoStore: (id: string) => Promise<void>;
}

export const useStockStore = create<StockState>((set, get) => ({
  categorias: [],
  productos: [],
  categoriaActiva: null,
  isLoading: false,
  error: null,

  cargarCategorias: async () => {
    try {
      const categorias = await obtenerCategorias();
      set((state) => ({
        categorias,
        categoriaActiva: state.categoriaActiva || (categorias.length > 0 ? categorias[0].id : null),
      }));
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  },

  cargarProductos: async () => {
    try {
      set({ isLoading: true, error: null });

      const productos = await obtenerProductos();

      set({
        productos,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error cargando productos:", error);

      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los productos desde el backend",
      });
    }
  },

  agregarProducto: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const result = await crearProducto(data);
      set((state) => ({
        productos: [...state.productos, result.producto],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error creando producto:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "No se pudo crear el producto",
      });
    }
  },

  setCategoriaActiva: (catId) => set({ categoriaActiva: catId }),

  modificarStock: (id, delta) =>
    set((state) => {
      const p = state.productos.find((x) => x.id === id);
      if (!p) return {};
      const newStock = Math.max(0, (p.stock ?? 0) + delta);

      if (debounceTimers[id]) {
        clearTimeout(debounceTimers[id]);
      }
      debounceTimers[id] = setTimeout(() => {
        actualizarStockBD(id, newStock).catch((err) =>
          console.error("Error debouncing stock update:", err)
        );
        delete debounceTimers[id];
      }, 2000);

      return {
        productos: state.productos.map((prod) =>
          prod.id === id ? { ...prod, stock: newStock } : prod
        ),
      };
    }),

  toggleDisponibilidad: (id) =>
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id === id ? { ...p, disponible: !p.disponible } : p
      ),
    })),

  getProductosPorCategoria: (catId) => {
    if (!catId) return get().productos;
    return get().productos.filter((p) => p.categoria_id === catId);
  },

  getTotalValorizado: () =>
    get().productos.reduce((acc, p) => acc + p.precio * (p.stock ?? 0), 0),

  getTotalPorCategoria: (catId: string | null) => {
    if (!catId) return 0;
    return get()
      .productos.filter((p) => p.categoria_id === catId)
      .reduce((acc, p) => acc + p.precio * (p.stock ?? 0), 0);
  },

  actualizarStockProducto: async (id, nuevoStock) => {
    try {
      await actualizarStockBD(id, nuevoStock);
      set((state) => ({
        productos: state.productos.map((prod) =>
          prod.id === id ? { ...prod, stock: nuevoStock } : prod
        ),
      }));
    } catch (error) {
      console.error("Error al actualizar stock de producto:", error);
      throw error;
    }
  },

  eliminarProductoStore: async (id) => {
    try {
      // Necesitamos importar eliminarProducto de productosApi.ts
      const { eliminarProducto } = await import("@/hooks/lib/api/productosApi");
      await eliminarProducto(id);
      set((state) => ({
        productos: state.productos.filter((prod) => prod.id !== id),
      }));
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      throw error;
    }
  }
}));