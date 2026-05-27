/**
 * hooks/useAuth.ts
 * Hook de conveniencia que envuelve el store de autenticación.
 * Centraliza la lógica de roles para los componentes de la interfaz.
 */

import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const usuario = useAuthStore((s) => s.usuario);
  const rol = useAuthStore((s) => s.rol);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.isLoading);
  const logout = useAuthStore((s) => s.logout);
  const error = useAuthStore((s) => s.error);

  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isMozo = useAuthStore((s) => s.isMozo);
  const isCocina = useAuthStore((s) => s.isCocina);
  const isCajero = useAuthStore((s) => s.isCajero);

  return {
    usuario,
    rol,
    isAuthenticated,
    loading,
    error,
    logout,
    isAdmin,
    isMozo,
    isCocina,
    isCajero,
  };
}
