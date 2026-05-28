/**
 * noctua/app/api/orders/[platform]/route.ts
 */
import { NextResponse } from 'next/server';
import { platformRegistry } from '@/lib/platformRegistry';
import { PlatformId, OrderStatus } from '@/types/orders';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const platformId = platform as PlatformId;
  const adapter = platformRegistry.get(platformId);

  if (!adapter) {
    return NextResponse.json({ error: 'Adapter not found' }, { status: 404 });
  }

  try {
    const orders = await adapter.getOrders();
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error(`Error fetching orders for ${platform}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const platformId = platform as PlatformId;
  const adapter = platformRegistry.get(platformId);

  if (!adapter) {
    return NextResponse.json({ error: 'Adapter not found' }, { status: 404 });
  }

  try {
    const { orderId, status } = await request.json();
    const updatedOrder = await adapter.updateOrderStatus(orderId, status as OrderStatus);
    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error(`Error updating order for ${platform}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
