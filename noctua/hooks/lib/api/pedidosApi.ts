import { supabase } from "@/hooks/lib/supabaseClient";
import type { Pedido, EstadoCocina } from "@/types/pedido";

interface DBItem {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  productos?: {
    nombre: string;
  };
}

interface DBMesa {
  numero: number;
  zona: string;
  personas?: number;
}

interface DBPedido {
  id: string;
  mesa_id: string;
  estado: string;
  total: number;
  abierto_en: string;
  pedido_items?: DBItem[];
  mesas?: DBMesa;
}

function mapDBPedido(p: DBPedido): Pedido {
  return {
    id: p.id,
    mesaId: p.mesa_id,
    numeroMesa: p.mesas?.numero ?? 0,
    zona: p.mesas?.zona ?? "General",
    items: (p.pedido_items || []).map((i) => ({
      productoId: i.producto_id,
      nombre: i.productos?.nombre || "Producto",
      cantidad: i.cantidad,
      precioUnitario: i.precio_unitario,
      subtotal: i.subtotal,
    })),
    total: p.total,
    estado: p.estado as EstadoCocina,
    creadoEn: new Date(p.abierto_en || new Date().toISOString()),
    actualizadoEn: new Date(),
    personas: p.mesas?.personas ?? 1,
  };
}

export async function obtenerPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, mesas(numero, zona, personas), pedido_items(*, productos(nombre))");

  if (error) {
    const errorMsg = error.message || JSON.stringify(error);
    console.error("Error al obtener pedidos:", errorMsg);
    throw new Error(errorMsg);
  }

  const pedidosMap = (data as DBPedido[]).map(mapDBPedido);
  // Sort in memory by ID or date just in case
  return pedidosMap.sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime());
}

export async function obtenerPedidosPorFecha(inicio: string, fin: string): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, mesas(numero, zona, personas), pedido_items(*, productos(nombre))"); // Remove gte/lte on created_at since it doesn't exist for now

  if (error) {
    const errorMsg = error.message || JSON.stringify(error);
    console.error("Error al obtener pedidos por fecha:", errorMsg);
    throw new Error(errorMsg);
  }

  return (data as DBPedido[]).map(mapDBPedido);
}

export async function crearPedido(data: {
  mesaId: string;
  numeroMesa: number;
  zona: string;
  personas: number;
  total: number;
  items: {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    notas?: string;
  }[];
}): Promise<{ success: boolean; pedido: Pedido }> {
  // 1. Crear el pedido
  const { data: pedidoData, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      mesa_id: data.mesaId,
      total: data.total,
      estado: "pendiente",
    })
    .select()
    .single();

  if (pedidoError) {
    console.error("Error al crear pedido:", pedidoError);
    throw new Error(pedidoError.message);
  }

  // 2. Insertar los items
  const itemsToInsert = data.items.map((i) => ({
    pedido_id: pedidoData.id,
    producto_id: i.productoId,
    cantidad: i.cantidad,
    precio_unitario: i.precioUnitario,
    subtotal: i.subtotal,
  }));

  const { error: itemsError } = await supabase.from("pedido_items").insert(itemsToInsert);

  if (itemsError) {
    console.error("Error al crear items del pedido:", itemsError);
    throw new Error(itemsError.message);
  }

  // 3. Devolver el pedido completo con los items
  const { data: fullPedido, error: fetchError } = await supabase
    .from("pedidos")
    .select("*, mesas(numero, zona, personas), pedido_items(*, productos(nombre))")
    .eq("id", pedidoData.id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  return { success: true, pedido: mapDBPedido(fullPedido as DBPedido) };
}

export async function actualizarEstadoPedido(
  pedidoId: string,
  estado: EstadoCocina
) {
  const { error } = await supabase
    .from("pedidos")
    .update({ estado }) // Omitimos actualizado_en para no requerir esa columna en la DB si no existe
    .eq("id", pedidoId);

  if (error) {
    console.error("Error al actualizar estado del pedido:", error);
    throw new Error(error.message);
  }

  return { success: true };
}