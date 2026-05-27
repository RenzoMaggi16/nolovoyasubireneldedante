// Todos los roles válidos del sistema NOCTUA
export type RolUsuario = 'admin' | 'mozo' | 'cocina' | 'cajero';

// Fila completa de la tabla `usuarios` en Supabase
export interface Usuario {
  id: string;
  auth_user_id: string;
  nombre: string;
  username: string;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
}
