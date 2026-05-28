/**
 * config/roles.ts
 * Fuente única de verdad para el mapeo de roles a secciones.
 * NUNCA hardcodear lógica de roles en componentes — siempre importar desde aquí.
 */

import type { RolUsuario } from '@/types/usuario';

/** Secciones identificadas por slug */
export type Seccion =
  | 'mesas'
  | 'pedidos'
  | 'cocina'
  | 'historial'
  | 'stock'
  | 'reservas'
  | 'administracion'
  | 'cajero';

/** Qué secciones puede ver cada rol */
export const SECCIONES_POR_ROL: Record<RolUsuario, Seccion[]> = {
  admin:   ['mesas', 'pedidos', 'cocina', 'historial', 'stock', 'reservas', 'administracion'],
  mozo:    ['mesas', 'pedidos', 'stock', 'reservas'],
  cocina:  ['cocina'],
  cajero:  ['cajero', 'historial'],
};

/** Primera ruta a la que redirigir según el rol */
export const HOME_POR_ROL: Record<RolUsuario, string> = {
  admin:   '/dashboard/mesas',
  mozo:    '/dashboard/mesas',
  cocina:  '/cocina',
  cajero:  '/dashboard/cajero',
};

/** Mapeo de seccion → ruta del dashboard */
export const RUTA_POR_SECCION: Record<Seccion, string> = {
  mesas:          '/dashboard/mesas',
  pedidos:        '/dashboard/pedido',
  cocina:         '/dashboard/cocina',
  historial:      '/dashboard/historial',
  stock:          '/dashboard/stock',
  reservas:       '/dashboard/reservas',
  administracion: '/dashboard/administracion',
  cajero:         '/dashboard/cajero',
};

/** Labels en español para cada sección */
export const LABEL_POR_SECCION: Record<Seccion, string> = {
  mesas:          'Mesas',
  pedidos:        'Pedidos',
  cocina:         'Cocina',
  historial:      'Historial',
  stock:          'Stock',
  reservas:       'Reservas',
  administracion: 'Administración',
  cajero:         'Caja',
};

/** Verifica si un rol tiene acceso a una sección */
export function rolTieneAcceso(rol: RolUsuario | null | undefined, seccion: Seccion): boolean {
  if (!rol) return false;
  return SECCIONES_POR_ROL[rol]?.includes(seccion) ?? false;
}
