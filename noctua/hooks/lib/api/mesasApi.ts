import { supabase } from "../supabaseClient";
import type { Mesa, EstadoMesa } from "@/types/mesa";

function mapEstadoMesa(estado?: string | null): EstadoMesa {
  if (estado === "libre") return "libre";
  if (estado === "ocupada") return "ocupada";
  if (estado === "esperando_pedido") return "esperando_pedido";
  if (estado === "pedido_listo") return "pedido_listo";
  if (estado === "esperando_pago") return "esperando_pago";
  if (estado === "problema") return "problema";

  return "libre";
}

export async function obtenerMesas(): Promise<Mesa[]> {
  const { data, error } = await supabase.from('mesas').select('*');

  if (error) {
    console.error("Error al obtener mesas de Supabase:", error);
    throw new Error(error.message);
  }

  return (data || []).map((mesa) => {
    let mappedZona = mesa.zona;
    if (mappedZona === "SALÓN PRINCIPAL") mappedZona = "salon";
    else if (mappedZona === "TERRAZA EXTERIOR") mappedZona = "terraza";
    else if (mappedZona === "BAR") mappedZona = "bar";
    else if (mappedZona === "ZONA SOFÁS") mappedZona = "sofas";
    else if (mappedZona === "ZONA COCINA") mappedZona = "cocina";

    return {
      id: String(mesa.id),
      numero: mesa.numero,
      zona: mappedZona || "salon",
      estado: mapEstadoMesa(mesa.estado),
      capacidad: mesa.capacidad || 4,
      posicion: { x: mesa.pos_x || 0, y: mesa.pos_y || 0 },
      mesasUnidas: [],
      personas: mesa.personas,
      pedidoId: mesa.pedido_id ? String(mesa.pedido_id) : undefined,
      timerInicio: mesa.creada_en ? new Date(mesa.creada_en) : undefined,
    };
  });
}

export async function crearMesa(data: {
  numero: number;
  capacidad: number;
  ubicacion: string;
}) {
  const { data: newMesa, error } = await supabase
    .from('mesas')
    .insert([
      {
        numero: data.numero,
        capacidad: data.capacidad,
        zona: data.ubicacion,
        estado: 'libre',
        pos_x: 0,
        pos_y: 0,
        forma: 'cuadrada',
        piso: 'baja'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error al crear mesa:", error);
    throw new Error(error.message);
  }

  return {
    success: true,
    mesa: {
      id: String(newMesa.id),
      numero: newMesa.numero,
      zona: newMesa.zona || "salon",
      estado: mapEstadoMesa(newMesa.estado),
      capacidad: newMesa.capacidad || 4,
      posicion: { x: newMesa.pos_x || 0, y: newMesa.pos_y || 0 },
      mesasUnidas: [],
    }
  };
}

export async function actualizarMesa(id: string, data: { numero?: number; capacidad?: number; ubicacion?: string }) {
  const payload: any = {};
  if (data.numero !== undefined) payload.numero = data.numero;
  if (data.capacidad !== undefined) payload.capacidad = data.capacidad;
  if (data.ubicacion !== undefined) payload.zona = data.ubicacion;

  const queryId = isNaN(Number(id)) ? id : Number(id);
  const { error } = await supabase.from('mesas').update(payload).eq('id', queryId);

  if (error) {
    console.error("Error al actualizar mesa en Supabase:", error);
    throw new Error(error.message);
  }
  return { success: true };
}

export async function eliminarMesa(id: string) {
  const queryId = isNaN(Number(id)) ? id : Number(id);
  const { error } = await supabase.from('mesas').delete().eq('id', queryId);

  if (error) {
    console.error("Error al eliminar mesa en Supabase:", error);
    throw new Error(error.message);
  }
  return { success: true };
}

export async function actualizarEstadoMesa(id: string, estado: string) {
  const queryId = isNaN(Number(id)) ? id : Number(id);
  
  // Mapeamos estados que no existen en el enum de Supabase
  let dbEstado = estado;
  if (estado === 'pedido_listo' || estado === 'esperando_pago') {
    dbEstado = 'ocupada';
  }

  const { error } = await supabase.from('mesas').update({ estado: dbEstado }).eq('id', queryId);

  if (error) {
    console.error("Error al actualizar estado de la mesa en Supabase:", error);
    throw new Error(error.message);
  }
  return { success: true };
}