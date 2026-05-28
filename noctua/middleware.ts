import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { RolUsuario } from '@/types/usuario';
import { SECCIONES_POR_ROL, HOME_POR_ROL } from '@/config/roles';

/**
 * middleware.ts
 * Protege rutas del dashboard y de /cocina.
 * Lee la cookie `noctua-auth` que setea el authStore al hacer login.
 * También valida acceso por sección según el rol.
 */

// Mapa de ruta → seccion para chequeo de rol
const RUTA_A_SECCION: Record<string, string> = {
  '/dashboard/mesas':          'mesas',
  '/dashboard/pedido':         'pedidos',
  '/dashboard/cocina':         'cocina',
  '/dashboard/historial':      'historial',
  '/dashboard/stock':          'stock',
  '/dashboard/reservas':       'reservas',
  '/dashboard/administracion': 'administracion',
  '/cocina':                   'cocina',
  '/delivery':                 'delivery',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas protegidas: dashboard/*, /cocina, /delivery
  const esDashboard = pathname.startsWith('/dashboard');
  const esCocina = pathname.startsWith('/cocina');
  const esDelivery = pathname.startsWith('/delivery');

  if (!esDashboard && !esCocina && !esDelivery) {
    return NextResponse.next();
  }

  // Leer cookie de auth
  const authCookie = request.cookies.get('noctua-auth');

  if (!authCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  let authData: { authenticated: boolean; rol: RolUsuario } | null = null;
  try {
    authData = JSON.parse(authCookie.value);
  } catch {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (!authData?.authenticated || !authData?.rol) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const rol = authData.rol;

  // Verificar acceso por sección
  // Buscar la ruta más específica que coincida
  const seccionRequerida = Object.entries(RUTA_A_SECCION).find(([ruta]) =>
    pathname.startsWith(ruta)
  )?.[1];

  if (seccionRequerida) {
    const seccionesDelRol = SECCIONES_POR_ROL[rol] ?? [];
    if (!seccionesDelRol.includes(seccionRequerida as any)) {
      // Redirigir al home del rol sin mostrar error
      const home = new URL(HOME_POR_ROL[rol], request.url);
      return NextResponse.redirect(home);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/cocina/:path*', '/cocina', '/delivery/:path*', '/delivery'],
};
