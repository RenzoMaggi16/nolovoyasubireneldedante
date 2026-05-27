import { supabase } from "../supabaseClient";
import type { Producto, Categoria } from "@/types/producto";

export async function obtenerCategorias(): Promise<Categoria[]> {
  try {
    const res = await fetch('/api/categorias');
    if (!res.ok) {
      throw new Error("Error en el proxy de categorias");
    }
    const data = await res.json();

    // Deduplicación por nombre ignorando mayúsculas/minúsculas
    const unicas = new Map<string, Categoria>();
    (data || []).forEach((cat: any) => {
      const nameLower = cat.nombre.trim().toLowerCase();
      if (!unicas.has(nameLower)) {
        unicas.set(nameLower, cat);
      }
    });

    return Array.from(unicas.values());
  } catch (error: any) {
    console.error("Error al obtener categorías:", error);
    throw new Error(error.message);
  }
}

export async function obtenerProductos(): Promise<Producto[]> {
  const { data, error } = await supabase.from('productos').select('*, categorias(id, nombre)');

  if (error) {
    console.error("Error al obtener productos de Supabase:", error);
    throw new Error(error.message);
  }

  return (data || []).map((producto) => ({
    id: String(producto.id),
    nombre: producto.nombre,
    precio: Number(producto.precio),
    categoria_id: producto.categoria_id,
    categoria: producto.categorias ? { id: producto.categorias.id, nombre: producto.categorias.nombre } : undefined,
    stock: producto.stock_actual ?? 0,
    disponible: producto.disponible ?? true,
  }));
}

export async function crearProducto(data: {
  nombre: string;
  precio: number;
  categoria_id: string;
  stock: number;
  disponible: boolean;
}) {
  const { data: nuevoProducto, error } = await supabase
    .from('productos')
    .insert([
      {
        nombre: data.nombre,
        precio: data.precio,
        categoria_id: data.categoria_id,
        stock_actual: data.stock,
        disponible: data.disponible,
      }
    ])
    .select('*, categorias(id, nombre)')
    .maybeSingle();

  if (error) {
    console.error("Error al crear producto en Supabase:", error);
    throw new Error(error.message);
  }

  if (!nuevoProducto) {
    throw new Error("No se pudo crear el producto");
  }

  return { 
    success: true, 
    producto: {
      id: String(nuevoProducto.id),
      nombre: nuevoProducto.nombre,
      precio: Number(nuevoProducto.precio),
      categoria_id: nuevoProducto.categoria_id,
      categoria: nuevoProducto.categorias ? { id: nuevoProducto.categorias.id, nombre: nuevoProducto.categorias.nombre } : undefined,
      stock: nuevoProducto.stock_actual ?? 0,
      disponible: nuevoProducto.disponible ?? true,
    } 
  };
}

export async function eliminarProducto(id: string) {
  const { data, error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    console.error("Error al eliminar producto en Supabase:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    console.warn(`No se pudo eliminar el producto con ID ${id}. Posible problema de permisos (RLS) en Supabase.`);
    throw new Error("No se pudo eliminar el producto. Verifica las políticas (RLS) en Supabase para UPDATE/DELETE.");
  }

  return { success: true };
}

export async function actualizarStockBD(id: string, stockActual: number) {
  const { data, error } = await supabase
    .from('productos')
    .update({ stock_actual: stockActual })
    .eq('id', id)
    .select();

  if (error) {
    console.error("Error al actualizar stock en Supabase:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    console.warn(`No se pudo actualizar el stock del producto con ID ${id}. Posible problema de permisos (RLS) en Supabase.`);
    throw new Error("No se pudo actualizar el stock. Verifica las políticas (RLS) en Supabase para UPDATE/DELETE.");
  }

  return { success: true };
}