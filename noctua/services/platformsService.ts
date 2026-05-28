import { Platform } from '../types/platforms';

const STATIC_PLATFORMS: Platform[] = [
  {
    id: 'pedidosya',
    displayName: 'PedidosYA',
    color: '#FF0F50',
    icon: 'P',
    isConnected: false,
    lastSync: new Date(),
  },
  {
    id: 'rappi',
    displayName: 'Rappi',
    color: '#FF441F',
    icon: 'R',
    isConnected: false,
    lastSync: new Date(),
  },
  {
    id: 'glovo',
    displayName: 'Glovo',
    color: '#FFC244',
    icon: 'G',
    isConnected: false,
    lastSync: new Date(),
  },
  {
    id: 'ubereats',
    displayName: 'Uber Eats',
    color: '#06C167',
    icon: 'U',
    isConnected: false,
    lastSync: new Date(),
  },
];

export async function fetchPlatforms(): Promise<Platform[]> {
  // En el futuro esto podría venir de Supabase, pero por ahora usamos datos estáticos
  // para evitar errores de tabla no encontrada.
  return STATIC_PLATFORMS;
}
