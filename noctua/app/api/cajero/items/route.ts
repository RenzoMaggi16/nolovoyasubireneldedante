import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: NextRequest) {
  try {
    const { itemId, cantidad, subtotal } = await req.json();
    if (!itemId || cantidad === undefined || subtotal === undefined) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('pedido_items')
      .update({ cantidad, subtotal })
      .eq('id', itemId);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Falta itemId' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('pedido_items')
      .delete()
      .eq('id', itemId);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
