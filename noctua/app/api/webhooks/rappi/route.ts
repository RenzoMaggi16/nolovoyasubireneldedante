/**
 * noctua/app/api/webhooks/rappi/route.ts
 */
import { NextResponse } from 'next/server';
import { platformRegistry } from '@/lib/platformRegistry';
import { RappiAdapter } from '@/services/adapters/rappi.adapter';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adapter = platformRegistry.get('rappi') as RappiAdapter;
    
    // Rappi webhook processing logic here
    // await adapter.receiveWebhookPayload(body);

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Rappi Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
