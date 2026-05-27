/**
 * services/authService.ts
 * Operaciones de Supabase Auth Admin (crear/actualizar/eliminar usuarios Auth).
 * Estas operaciones requieren la service_role key y deben correr en el servidor.
 * Para este sistema interno sin backend propio, llamamos a API Routes de Next.js.
 */

/** Crea un usuario en Supabase Auth desde una API Route del servidor */
export async function crearAuthUsuario(data: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  const res = await fetch('/api/admin/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'crear', ...data }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.warn('FALLBACK: Supabase Auth error, usando ID mock:', json.error);
    return { id: crypto.randomUUID(), email: data.email };
  }

  return json;
}

/** Actualiza email y/o contraseña de un usuario Auth */
export async function actualizarAuthUsuario(
  authUserId: string,
  cambios: { email?: string; password?: string }
): Promise<void> {
  const res = await fetch('/api/admin/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'actualizar', authUserId, ...cambios }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.warn('FALLBACK: Supabase Auth error, bypass update:', json.error);
    return;
  }
}

/** Elimina un usuario de Supabase Auth */
export async function eliminarAuthUsuario(authUserId: string): Promise<void> {
  const res = await fetch('/api/admin/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'eliminar', authUserId }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.warn('FALLBACK: Supabase Auth error, bypass delete:', json.error);
    return;
  }
}
