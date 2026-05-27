'use client';

/**
 * app/cocina/page.tsx
 * Punto de entrada para /cocina
 * Delega a la vista correcta según el rol del usuario autenticado
 */

import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, LogOut, ChefHat, CheckCircle, Archive, Play, Utensils } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cocinaService } from '@/services/cocinaService';
import { useCocinaRealtime } from '@/hooks/useCocinaRealtime';
import {
  COLORES_BORDE_COCINA,
  TEXTO_ESTADO_COCINA,
  KDS_TIMER_GREEN_MINUTES,
  KDS_TIMER_YELLOW_MINUTES,
} from '@/hooks/lib/constants';
import { elapsedMinutes, formatElapsed, cn } from '@/hooks/lib/utils';
import type { Pedido, EstadoCocina } from '@/types/pedido';

import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

const ESTADOS_ACTIVOS: EstadoCocina[] = ['pendiente', 'preparando', 'listo'];
const ESTADOS_KDS: EstadoCocina[] = ['pendiente', 'preparando', 'listo', 'entregado'];

const ICONOS_ESTADO: Record<EstadoCocina, React.ElementType> = {
  pendiente:  Play,
  preparando: ChefHat,
  listo:      CheckCircle,
  entregado:  Archive,
};

const COLORES_BOTON: Partial<Record<EstadoCocina, string>> = {
  pendiente:  'bg-[#1a1a1a] border border-[#3a3a3a] text-white hover:bg-orange-500/20 hover:border-orange-500/40 hover:text-orange-300',
  preparando: 'bg-orange-500/10 border border-orange-500/30 text-orange-300 hover:bg-yellow-500/20 hover:border-yellow-500/40 hover:text-yellow-300',
  listo:      'bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-300',
};

// ── Reloj en vivo ─────────────────────────────────────────────────────────────
function RelojVivo() {
  const [hora, setHora] = useState('');
  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-white font-bold text-lg tracking-wider">{hora}</span>
  );
}

// ── Timer KDS ─────────────────────────────────────────────────────────────────
function KDSTimer({ creadoEn }: { creadoEn: Date }) {
  const [elapsed, setElapsed] = useState('');
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const tick = () => {
      setElapsed(formatElapsed(creadoEn));
      setMinutes(elapsedMinutes(creadoEn));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [creadoEn]);

  const colorClass =
    minutes >= KDS_TIMER_YELLOW_MINUTES
      ? 'text-red-400'
      : minutes >= KDS_TIMER_GREEN_MINUTES
      ? 'text-yellow-400'
      : 'text-green-400';

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 font-mono font-bold text-base',
        colorClass,
        minutes >= KDS_TIMER_YELLOW_MINUTES && 'animate-pulse'
      )}
    >
      <Clock size={14} />
      {elapsed}
    </div>
  );
}

// ── Tarjeta de Pedido ─────────────────────────────────────────────────────────
const PedidoCard = memo(function PedidoCard({
  pedido,
  onCambiarEstado,
}: {
  pedido: Pedido;
  onCambiarEstado: (id: string, estado: EstadoCocina) => void;
}) {
  const currentIdx = ESTADOS_KDS.indexOf(pedido.estado);
  const nextEstado = currentIdx < ESTADOS_KDS.length - 1 ? ESTADOS_KDS[currentIdx + 1] : null;
  const borderColor = COLORES_BORDE_COCINA[pedido.estado];
  const NextIcon = nextEstado ? ICONOS_ESTADO[nextEstado] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className={cn(
        'bg-[#0d0d0d] border-2 rounded-2xl p-5 flex flex-col gap-4',
        borderColor
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-display text-6xl font-black text-white leading-none">
              {pedido.numeroMesa}
            </span>
            <div className="flex items-center gap-1 text-[#676B67]">
              <Users size={14} />
              <span className="text-sm">{pedido.personas}</span>
            </div>
          </div>
          <p className="text-[#676B67] text-sm mt-1 capitalize">{pedido.zona}</p>
        </div>
        <KDSTimer creadoEn={pedido.creadoEn} />
      </div>

      <div className="space-y-2" role="list">
        {pedido.items.map((item) => (
          <div key={item.productoId} className="flex items-start gap-3" role="listitem">
            <span className="text-white font-black text-xl leading-tight w-8 flex-shrink-0">
              {item.cantidad}×
            </span>
            <div>
              <p className="text-[#D9D9D9] text-base font-semibold leading-tight">{item.nombre}</p>
              {item.notas && (
                <p className="text-yellow-400 text-sm mt-0.5 font-medium">⚑ {item.notas}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {nextEstado && NextIcon && (
        <button
          onClick={() => onCambiarEstado(pedido.id, nextEstado)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95',
            COLORES_BOTON[pedido.estado]
          )}
        >
          <NextIcon size={16} />
          {TEXTO_ESTADO_COCINA[nextEstado]}
        </button>
      )}

      {pedido.estado === 'entregado' && (
        <div className="text-center text-green-400 text-sm font-semibold flex items-center justify-center gap-2 py-2">
          <CheckCircle size={16} />
          Entregado
        </div>
      )}
    </motion.div>
  );
});

// ── Vistas ────────────────────────────────────────────────────────────────────

function CocinaOperatorView() {
  const router = useRouter();
  const { pedidos, loading } = useCocinaRealtime();
  const logout = useAuthStore((s) => s.logout);
  const usuario = useAuthStore((s) => s.usuario);

  const handleCambiarEstado = useCallback(async (pedidoId: string, nuevoEstado: EstadoCocina) => {
    await cocinaService.cambiarEstadoLibre(pedidoId, nuevoEstado);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const pedidosActivos = useMemo(() => pedidos.filter((p) => ESTADOS_ACTIVOS.includes(p.estado as EstadoCocina)), [pedidos]);

  if (loading && pedidos.length === 0) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#BCB9B9]">Cargando pedidos...</div>;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#111] bg-[#080808] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Utensils size={20} className="text-[#676B67]" />
          <h1 className="font-display text-2xl font-black tracking-[0.2em] text-white">NOCTUA</h1>
          <span className="text-[#2a2a2a] text-lg font-light">|</span>
          <span className="text-[#676B67] text-sm tracking-widest uppercase font-semibold">Cocina</span>
        </div>

        <div className="flex items-center gap-6">
          <RelojVivo />
          {usuario && (
            <span className="text-[#676B67] text-sm hidden sm:block">{usuario.nombre}</span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#676B67] hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-5 overflow-auto">
        {pedidosActivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 min-h-[60vh]">
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <ChefHat size={56} className="text-[#1a1a1a]" />
            </motion.div>
            <p className="text-[#2a2a2a] text-xl font-semibold tracking-wide">
              Sin pedidos pendientes
            </p>
            <p className="text-[#1a1a1a] text-sm">Todo al día 👍</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pedidosActivos.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onCambiarEstado={handleCambiarEstado}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      <footer className="flex items-center justify-between px-6 py-2 border-t border-[#111] bg-[#080808] flex-shrink-0">
        <span className="text-[#2a2a2a] text-xs font-mono">
          {pedidosActivos.length} pedido{pedidosActivos.length !== 1 ? 's' : ''} activo{pedidosActivos.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[#2a2a2a] text-xs">EN LÍNEA</span>
        </div>
      </footer>
    </div>
  );
}

function CocinaSupervisionView() {
  const { pedidos, loading } = useCocinaRealtime();
  const handleCambiarEstado = useCallback(async (pedidoId: string, nuevoEstado: EstadoCocina) => {
    await cocinaService.cambiarEstadoLibre(pedidoId, nuevoEstado);
  }, []);

  const pedidosActivos = useMemo(() => pedidos.filter((p) => ESTADOS_ACTIVOS.includes(p.estado as EstadoCocina)), [pedidos]);
  
  const pendientes = pedidosActivos.filter(p => p.estado === 'pendiente').length;
  const preparando = pedidosActivos.filter(p => p.estado === 'preparando').length;
  const listos = pedidosActivos.filter(p => p.estado === 'listo').length;

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex gap-4 overflow-x-auto">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 min-w-[150px]">
              <p className="text-[#676B67] text-xs font-bold tracking-widest uppercase mb-1">Total Activos</p>
              <p className="text-white text-2xl font-black">{pedidosActivos.length}</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 min-w-[150px]">
              <p className="text-orange-400/70 text-xs font-bold tracking-widest uppercase mb-1">Pendientes</p>
              <p className="text-orange-400 text-2xl font-black">{pendientes}</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 min-w-[150px]">
              <p className="text-yellow-400/70 text-xs font-bold tracking-widest uppercase mb-1">En Preparación</p>
              <p className="text-yellow-400 text-2xl font-black">{preparando}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 min-w-[150px]">
              <p className="text-green-400/70 text-xs font-bold tracking-widest uppercase mb-1">Listos</p>
              <p className="text-green-400 text-2xl font-black">{listos}</p>
            </div>
          </div>
          
          {loading && pedidos.length === 0 ? (
            <div className="text-[#BCB9B9]">Cargando pedidos...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {pedidosActivos.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    onCambiarEstado={handleCambiarEstado}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CocinaPage() {
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuario);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !usuario) {
      router.push('/login');
    }
  }, [mounted, usuario, router]);

  if (!mounted) return null;

  if (!usuario) {
    return null;
  }

  if (usuario.rol === 'cocina') {
    return <CocinaOperatorView />;
  }

  if (usuario.rol === 'admin') {
    return <CocinaSupervisionView />;
  }

  router.push('/');
  return null;
}
