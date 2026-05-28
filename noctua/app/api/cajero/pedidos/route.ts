import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      // Detalle completo de un pedido específico
      const { data, error } = await supabaseAdmin
        .from('pedidos')
        .select(`
          *,
          mesas(id, numero, zona),
          pedido_items(id, cantidad, precio_unitario, subtotal, productos(id, nombre)),
          usuarios:usuario_id(id, nombre)
        `)
        .eq('id', id)
        .single();

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, pedido: data });
    }

    // Lista de pedidos listos para cobrar
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        mesas(id, numero, zona),
        pedido_items(id, cantidad, precio_unitario, subtotal, productos(id, nombre)),
        usuarios:usuario_id(id, nombre)
      `)
      .eq('estado', 'lista_para_cobrar')
      .order('abierto_en', { ascending: true });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, pedidos: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { pedidoId, estado, total } = await req.json();
    if (!pedidoId || !estado) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros' }, { status: 400 });
    }

    const payload: any = { estado };
    if (total !== undefined) payload.total = total;

    const { error } = await supabaseAdmin
      .from('pedidos')
      .update(payload)
      .eq('id', pedidoId);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
