/**
 * noctua/app/api/webhooks/glovo/route.ts
 */
import { NextResponse } from 'next/server';
import { platformRegistry } from '@/lib/platformRegistry';
import { GlovoAdapter } from '@/services/adapters/glovo.adapter';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Validar firma (Opcional según implementación real, requiere secret)
    // const signature = request.headers.get('x-glovo-signature');
    
    // 2. Obtener adaptador
    const adapter = platformRegistry.get('glovo') as GlovoAdapter;
    if (!adapter) {
      return NextResponse.json({ error: 'Adapter not found' }, { status: 500 });
    }

    // 3. Procesar payload
    await adapter.receiveWebhookPayload(body);

    // 4. Retornar 200 OK inmediatamente
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Glovo Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
