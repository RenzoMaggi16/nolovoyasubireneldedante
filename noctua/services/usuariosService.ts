/**
 * services/usuariosService.ts
 * CRUD completo sobre la tabla `usuarios` de Supabase.
 * Toda interacción con esta tabla debe pasar por este servicio.
 */

import { supabase } from '@/hooks/lib/supabaseClient';
import type { Usuario, RolUsuario } from '@/types/usuario';

/** Obtiene todos los usuarios de la tabla */
export async function obtenerUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('Error al obtener usuarios:', error);
    throw new Error('No se pudieron cargar los usuarios.');
  }

  return (data ?? []) as Usuario[];
}

/** Obtiene un usuario por su auth_user_id (usado al iniciar sesión) */
export async function obtenerUsuarioPorAuthId(authUserId: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    console.error('Error al obtener usuario por auth_id:', error);
    return null;
  }

  return data as Usuario | null;
}

/** Crea un registro en la tabla `usuarios` vinculado a un auth_user_id */
export async function crearUsuario(data: {
  auth_user_id: string;
  nombre: string;
  username: string;
  rol: RolUsuario;
  activo: boolean;
}): Promise<Usuario> {
  const { data: nuevo, error } = await supabase
    .from('usuarios')
    .insert([data])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error al crear usuario en tabla:', error);
    throw new Error('No se pudo crear el usuario en la base de datos.');
  }

  if (!nuevo) throw new Error('No se obtuvo respuesta al crear el usuario.');

  return nuevo as Usuario;
}

/** Actualiza campos de un usuario existente */
export async function actualizarUsuario(
  id: string,
  cambios: Partial<Pick<Usuario, 'nombre' | 'username' | 'rol' | 'activo'>>
): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update(cambios)
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar usuario:', error);
    throw new Error('No se pudo actualizar el usuario.');
  }
}

/** Elimina un usuario de la tabla por su id */
export async function eliminarUsuario(id: string): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar usuario:', error);
    throw new Error('No se pudo eliminar el usuario.');
  }
}
