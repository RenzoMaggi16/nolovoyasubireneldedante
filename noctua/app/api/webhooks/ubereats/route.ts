/**
 * noctua/app/api/webhooks/ubereats/route.ts
 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { platformRegistry } from '@/lib/platformRegistry';
import { UberEatsAdapter } from '@/services/adapters/ubereats.adapter';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-uber-signature');
    const secret = process.env.UBEREATS_WEBHOOK_SECRET;

    // 1. Verificar firma HMAC-SHA256
    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(rawBody).digest('hex');
      if (digest !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    
    // Uber Eats envía diferentes tipos de eventos
    if (payload.event_type === 'orders.notification') {
      const adapter = platformRegistry.get('ubereats') as UberEatsAdapter;
      await adapter.receiveWebhookPayload(payload.payload);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Uber Eats Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
