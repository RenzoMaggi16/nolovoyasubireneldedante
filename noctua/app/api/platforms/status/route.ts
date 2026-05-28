/**
 * noctua/app/api/platforms/status/route.ts
 */
import { NextResponse } from 'next/server';
import { platformRegistry } from '@/lib/platformRegistry';
import { PlatformId } from '@/types/orders';

export async function GET() {
  const platforms: PlatformId[] = ['pedidosya', 'rappi', 'glovo', 'ubereats'];
  const statusPromises = platforms.map(async (p) => {
    const adapter = platformRegistry.get(p);
    if (!adapter) return { platform: p, status: 'error' };
    try {
      const isConnected = await adapter.isConnected();
      return { platform: p, status: isConnected ? 'connected' : 'disconnected' };
    } catch {
      return { platform: p, status: 'error' };
    }
  });

  const results = await Promise.all(statusPromises);
  const statusMap = results.reduce((acc, curr) => {
    acc[curr.platform as PlatformId] = curr.status;
    return acc;
  }, {} as Record<PlatformId, string>);

  return NextResponse.json(statusMap);
}
