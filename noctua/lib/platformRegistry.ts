/**
 * noctua/lib/platformRegistry.ts
 */
import { IPlatformAdapter } from '../services/platformAdapter.interface';
import { PedidosYaAdapter } from '../services/adapters/pedidosya.adapter';
import { RappiAdapter } from '../services/adapters/rappi.adapter';
import { GlovoAdapter } from '../services/adapters/glovo.adapter';
import { UberEatsAdapter } from '../services/adapters/ubereats.adapter';
import { PlatformId } from '../types/orders';

const registry = new Map<PlatformId, IPlatformAdapter>([
  ['pedidosya', new PedidosYaAdapter()],
  ['rappi', new RappiAdapter()],
  ['glovo', new GlovoAdapter()],
  ['ubereats', new UberEatsAdapter()],
]);

export const platformRegistry = registry;
