import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.mesaId || data.total === undefined) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    // 1. Crear el pedido saltando las politicas RLS (con service_role)
    const insertData: any = {
      mesa_id: data.mesaId,
      total: data.total,
      estado: "pendiente",
    };
    
    if (data.usuarioId) {
      insertData.usuario_id = data.usuarioId;
    }

    const { data: pedidoData, error: pedidoError } = await supabaseAdmin
      .from("pedidos")
      .insert(insertData)
      .select()
      .single();

    if (pedidoError) {
      console.error("Error BD al insertar pedido:", pedidoError);
      return NextResponse.json({ success: false, error: pedidoError.message }, { status: 500 });
    }

    // 2. Insertar los items
    if (data.items && data.items.length > 0) {
      const itemsToInsert = data.items.map((i: any) => ({
        pedido_id: pedidoData.id,
        producto_id: i.productoId,
        cantidad: i.cantidad,
        precio_unitario: i.precioUnitario,
        subtotal: i.subtotal,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("pedido_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("Error BD al insertar items:", itemsError);
        return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 });
      }
    }

    // 3. Obtener el pedido completo
    const { data: fullPedido, error: fetchError } = await supabaseAdmin
      .from("pedidos")
      .select("*, mesas(numero, zona), pedido_items(*, productos(nombre))")
      .eq("id", pedidoData.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pedido: fullPedido });
  } catch (error: any) {
    console.error("Error en API de pedidos:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
