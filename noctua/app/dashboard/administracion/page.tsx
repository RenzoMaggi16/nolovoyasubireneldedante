'use client';

/**
 * app/dashboard/administracion/page.tsx
 * Panel de administración de staff — solo accesible por rol 'admin'.
 * CRUD completo de usuarios: crear, editar, eliminar.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, UserCheck, UserX, Shield, X, Eye, EyeOff, Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { toast } from '@/components/ui/Toast';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from '@/services/usuariosService';
import { crearAuthUsuario, actualizarAuthUsuario, eliminarAuthUsuario } from '@/services/authService';
import type { Usuario, RolUsuario } from '@/types/usuario';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROL_LABELS: Record<RolUsuario, string> = {
  admin:   'Administrador',
  mozo:    'Mozo',
  cocina:  'Cocinero',
  cajero:  'Cajero',
};

const ROL_COLORS: Record<RolUsuario, string> = {
  admin:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  mozo:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cocina:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  cajero:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function RolBadge({ rol }: { rol: RolUsuario }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ROL_COLORS[rol]}`}>
      {ROL_LABELS[rol]}
    </span>
  );
}

// ── Modal Formulario Usuario ──────────────────────────────────────────────────

interface FormUsuario {
  nombre: string;
  username: string;
  password: string;
  rol: RolUsuario;
  activo: boolean;
}

const FORM_INICIAL: FormUsuario = {
  nombre: '', username: '', password: '', rol: 'mozo', activo: true,
};

function ModalFormulario({
  isOpen,
  onClose,
  usuarioEditar,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  usuarioEditar: Usuario | null;
  onSuccess: () => void;
}) {
  const esEdicion = !!usuarioEditar;
  const [form, setForm] = useState<FormUsuario>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (usuarioEditar) {
        setForm({
          nombre:   usuarioEditar.nombre,
          username: usuarioEditar.username,
          password: '',
          rol:      usuarioEditar.rol,
          activo:   usuarioEditar.activo,
        });
      } else {
        setForm(FORM_INICIAL);
      }
      setError(null);
      setShowPass(false);
    }
  }, [isOpen, usuarioEditar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) return setError('El nombre es obligatorio.');
    if (!form.username.trim() || form.username.includes('@') || form.username.includes(' ')) {
      return setError('Usuario inválido. No debe contener espacios ni el símbolo @.');
    }
    if (!esEdicion && form.password.length < 4) return setError('La contraseña debe tener al menos 4 caracteres.');
    if (esEdicion && form.password && form.password.length < 4) return setError('La contraseña debe tener al menos 4 caracteres.');

    setGuardando(true);
    try {
      const fakeEmail = `${form.username.toLowerCase().trim()}@noctua.local`;

      if (esEdicion && usuarioEditar) {
        // Actualizar tabla usuarios
        await actualizarUsuario(usuarioEditar.id, {
          nombre: form.nombre.trim(),
          username: form.username.trim(),
          rol:    form.rol,
          activo: form.activo,
        });
        // Actualizar auth si cambiaron email o password
        const authCambios: { email?: string; password?: string } = {};
        if (form.username.trim() !== usuarioEditar.username) authCambios.email = fakeEmail;
        if (form.password) authCambios.password = form.password;
        if (Object.keys(authCambios).length > 0) {
          await actualizarAuthUsuario(usuarioEditar.auth_user_id, authCambios);
        }
        toast.success('Usuario actualizado correctamente');
      } else {
        // Crear auth user
        const authUser = await crearAuthUsuario({ email: fakeEmail, password: form.password });
        // Crear registro en tabla
        await crearUsuario({
          auth_user_id: authUser.id,
          nombre:       form.nombre.trim(),
          username:     form.username.trim(),
          rol:          form.rol,
          activo:       form.activo,
        });
        toast.success('Usuario creado correctamente');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const inputCls = 'w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555] transition-colors';
  const labelCls = 'block text-xs text-[#676B67] font-semibold tracking-widest uppercase mb-1.5';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? `Editar — ${usuarioEditar?.nombre}` : 'Nuevo Usuario'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label htmlFor="form-nombre" className={labelCls}>Nombre</label>
          <input
            id="form-nombre"
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Nombre completo"
            className={inputCls}
          />
        </div>

        {/* Username */}
        <div>
          <label htmlFor="form-username" className={labelCls}>Usuario</label>
          <input
            id="form-username"
            type="text"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="Ej: juan, pedro, admin"
            className={inputCls}
          />
        </div>

        {/* Contraseña */}
        <div>
          <label htmlFor="form-password" className={labelCls}>
            Contraseña {esEdicion && <span className="text-[#444] font-normal normal-case tracking-normal">(dejar vacío para no cambiar)</span>}
          </label>
          <div className="relative">
            <input
              id="form-password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={esEdicion ? '••••••••' : 'Mínimo 4 caracteres'}
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#676B67] hover:text-white transition-colors"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Rol */}
        <div>
          <label htmlFor="form-rol" className={labelCls}>Rol</label>
          <select
            id="form-rol"
            value={form.rol}
            onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as RolUsuario }))}
            className={inputCls}
          >
            <option value="mozo">Mozo</option>
            <option value="cocina">Cocinero</option>
            <option value="cajero">Cajero</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {/* Activo */}
        <div className="flex items-center justify-between bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3">
          <span className="text-sm text-[#BCB9B9] font-medium">Cuenta activa</span>
          <Toggle
            checked={form.activo}
            onChange={() => setForm((f) => ({ ...f, activo: !f.activo }))}
            aria-label="Activar o desactivar cuenta"
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs font-medium py-2 px-3 bg-red-500/10 rounded-lg border border-red-500/20"
              role="alert"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={guardando} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={guardando} className="flex-1">
            {esEdicion ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal Confirmación Borrado ─────────────────────────────────────────────────

function ModalConfirmarEliminar({
  isOpen,
  usuario,
  onClose,
  onConfirm,
  eliminando,
}: {
  isOpen: boolean;
  usuario: Usuario | null;
  onClose: () => void;
  onConfirm: () => void;
  eliminando: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar usuario" size="sm">
      <div className="space-y-4">
        <p className="text-[#BCB9B9] text-sm leading-relaxed">
          ¿Estás seguro de que deseas eliminar a{' '}
          <span className="text-white font-semibold">{usuario?.nombre}</span>?{' '}
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} disabled={eliminando} className="flex-1">
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={eliminando} className="flex-1">
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdministracionPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await obtenerUsuarios();
      setUsuarios(data);
    } catch {
      toast.error('No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setUsuarioSeleccionado(null);
    setModalFormAbierto(true);
  };

  const abrirEditar = (u: Usuario) => {
    setUsuarioSeleccionado(u);
    setModalFormAbierto(true);
  };

  const abrirEliminar = (u: Usuario) => {
    setUsuarioSeleccionado(u);
    setModalEliminarAbierto(true);
  };

  const confirmarEliminar = async () => {
    if (!usuarioSeleccionado) return;
    setEliminando(true);
    try {
      await eliminarAuthUsuario(usuarioSeleccionado.auth_user_id);
      await eliminarUsuario(usuarioSeleccionado.id);
      toast.success('Usuario eliminado');
      await cargar();
      setModalEliminarAbierto(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo eliminar el usuario.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-[#676B67]" />
          <div>
            <h2 className="text-white font-bold text-lg">Gestión de personal</h2>
            <p className="text-[#676B67] text-xs mt-0.5">{usuarios.length} usuarios registrados</p>
          </div>
        </div>
        <Button onClick={abrirCrear} className="flex items-center gap-2">
          <Plus size={15} />
          Nuevo usuario
        </Button>
      </div>

      {/* Tabla */}
      <div className="bg-[#080808] border border-[#1a1a1a] rounded-xl overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center py-20 text-[#676B67] gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Cargando usuarios…</span>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Shield size={32} className="text-[#2a2a2a]" />
            <p className="text-[#3a3a3a] text-sm">No hay usuarios registrados</p>
            <button onClick={abrirCrear} className="text-xs text-[#676B67] underline hover:text-white transition-colors">
              Crear el primero
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    {['Nombre', 'Usuario', 'Rol', 'Estado', 'Creado', 'Acciones'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#676B67] tracking-widest uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[#0f0f0f] hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <p className="text-white text-sm font-semibold">{u.nombre}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[#BCB9B9] text-sm font-mono">{u.username}</p>
                      </td>
                      <td className="px-5 py-4">
                        <RolBadge rol={u.rol} />
                      </td>
                      <td className="px-5 py-4">
                        {u.activo ? (
                          <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                            <UserCheck size={13} /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[#676B67] text-xs font-semibold">
                            <UserX size={13} /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[#676B67] text-xs">
                          {new Date(u.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => abrirEditar(u)}
                            aria-label={`Editar ${u.nombre}`}
                            className="p-2 rounded-lg text-[#676B67] hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => abrirEliminar(u)}
                            aria-label={`Eliminar ${u.nombre}`}
                            className="p-2 rounded-lg text-[#676B67] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#111]">
              {usuarios.map((u) => (
                <div key={u.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">{u.nombre}</p>
                      <p className="text-[#676B67] text-xs font-mono mt-0.5">{u.username}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => abrirEditar(u)}
                        className="p-2 rounded-lg text-[#676B67] hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => abrirEliminar(u)}
                        className="p-2 rounded-lg text-[#676B67] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <RolBadge rol={u.rol} />
                    {u.activo ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                        <UserCheck size={11} /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#676B67] text-xs">
                        <UserX size={11} /> Inactivo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ModalFormulario
        isOpen={modalFormAbierto}
        onClose={() => setModalFormAbierto(false)}
        usuarioEditar={usuarioSeleccionado}
        onSuccess={cargar}
      />
      <ModalConfirmarEliminar
        isOpen={modalEliminarAbierto}
        usuario={usuarioSeleccionado}
        onClose={() => setModalEliminarAbierto(false)}
        onConfirm={confirmarEliminar}
        eliminando={eliminando}
      />
    </div>
  );
}
