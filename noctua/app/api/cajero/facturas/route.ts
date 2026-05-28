import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get('fecha') ?? new Date().toISOString().split('T')[0];

  try {
    const inicio = `${fecha}T00:00:00.000Z`;
    const fin = `${fecha}T23:59:59.999Z`;

    const { data, error } = await supabaseAdmin
      .from('facturas')
      .select(`
        *,
        pedidos:pedido_id(
          mesa_id,
          mesas:mesa_id(numero, zona),
          pedido_items(cantidad, precio_unitario, subtotal, productos(nombre))
        )
      `)
      .gte('creada_en', inicio)
      .lte('creada_en', fin)
      .order('creada_en', { ascending: false });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, facturas: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pedidoId, total, metodoPago, descuento, cae, qrFiscal } = await req.json();

    if (!pedidoId || total === undefined || !metodoPago) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros' }, { status: 400 });
    }

    // 1. Insertar factura
    const { data: factura, error: facturaError } = await supabaseAdmin
      .from('facturas')
      .insert({
        pedido_id: pedidoId,
        estado: 'emitida',
        total,
        metodo_pago: metodoPago,
        descuento: descuento ?? 0,
        cae: cae ?? `CAE-DEMO-${Date.now()}`,
        qr_fiscal: qrFiscal ?? `QR-FISCAL-DEMO-${pedidoId}`,
      })
      .select()
      .single();

    if (facturaError) return NextResponse.json({ success: false, error: facturaError.message }, { status: 500 });

    // 2. Actualizar estado del pedido a 'cerrada'
    const { error: pedidoError } = await supabaseAdmin
      .from('pedidos')
      .update({ estado: 'cerrada', total })
      .eq('id', pedidoId);

    if (pedidoError) return NextResponse.json({ success: false, error: pedidoError.message }, { status: 500 });

    return NextResponse.json({ success: true, factura });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
