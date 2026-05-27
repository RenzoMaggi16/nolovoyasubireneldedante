'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Clock, AlertTriangle, Link2, Scissors, X, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMesasStore } from '@/store/mesasStore';
import { usePedidosStore } from '@/store/pedidosStore';
import { COLORES_ESTADO_MESA, TEXTO_ESTADO_MESA } from '@/hooks/lib/constants';
import { formatElapsed, formatARS } from '@/hooks/lib/utils';
import type { Mesa, EstadoMesa } from '@/types/mesa';

interface MesaModalProps {
  mesa: Mesa | null;
  isOpen: boolean;
  onClose: () => void;
}

const ESTADOS_ORDEN: EstadoMesa[] = [
  'libre', 'ocupada', 'esperando_pedido', 'pedido_listo', 'esperando_pago', 'problema',
];

export function MesaModal({ mesa, isOpen, onClose }: MesaModalProps) {
  const router = useRouter();
  const { setEstadoMesa, setPersonasMesa, cerrarMesa, dividirMesas, editarMesa, borrarMesa } = useMesasStore();
  const getPedidoPorMesa = usePedidosStore((s) => s.getPedidoPorMesa);
  const iniciarPedido = usePedidosStore((s) => s.iniciarPedido);
  const [elapsed, setElapsed] = useState('');
  const [personas, setPersonas] = useState(mesa?.personas ?? 2);

  const [isEditing, setIsEditing] = useState(false);
  const [editNumero, setEditNumero] = useState(mesa?.numero ?? 0);
  const [editCapacidad, setEditCapacidad] = useState(mesa?.capacidad ?? 4);
  const [editZona, setEditZona] = useState(mesa?.zona ?? 'salon');

  useEffect(() => {
    if (mesa) {
      setPersonas(mesa.personas ?? 2);
      setEditNumero(mesa.numero);
      setEditCapacidad(mesa.capacidad);
      setEditZona(mesa.zona);
    }
  }, [mesa]);

  const handleGuardarEdicion = async () => {
    if (mesa) {
      await editarMesa(mesa.id, {
        numero: editNumero,
        capacidad: editCapacidad,
        ubicacion: editZona,
      });
      setIsEditing(false);
    }
  };

  const handleBorrarMesa = async () => {
    if (mesa && confirm("¿Estás seguro de que deseas eliminar esta mesa permanentemente?")) {
      await borrarMesa(mesa.id);
      onClose();
    }
  };

  useEffect(() => {
    if (!mesa?.timerInicio) { setElapsed(''); return; }
    const tick = () => setElapsed(formatElapsed(mesa.timerInicio!));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mesa?.timerInicio]);

  if (!mesa) return null;

  const pedido = getPedidoPorMesa(mesa.id);

  const handleEstadoChange = (estado: EstadoMesa) => {
    setEstadoMesa(mesa.id, estado);
  };

  const handlePersonasChange = (val: number) => {
    const clamped = Math.max(1, Math.min(20, val));
    setPersonas(clamped);
    setPersonasMesa(mesa.id, clamped);
  };

  const handleCerrarMesa = () => {
    cerrarMesa(mesa.id);
    onClose();
  };

  const handleVerPedido = () => {
    iniciarPedido(mesa.id, mesa.numero, mesa.zona, mesa.personas ?? 1);
    router.push('/dashboard/pedido');
    onClose();
  };

  const ZONAS_LABELS: Record<string, string> = {
    terraza: "TERRAZA EXTERIOR",
    salon: "SALÓN PRINCIPAL",
    bar: "BAR",
    sofas: "ZONA SOFÁS",
    cocina: "ZONA COCINA",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg"
      title={`Mesa ${mesa.numero} — ${ZONAS_LABELS[mesa.zona] || mesa.zona}`}
    >
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#676B67] uppercase font-semibold">Número</label>
            <input
              type="number"
              value={editNumero}
              onChange={(e) => setEditNumero(Number(e.target.value))}
              className="bg-black border border-[#2a2a2a] rounded-md px-3 py-2 text-white outline-none focus:border-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#676B67] uppercase font-semibold">Capacidad</label>
            <input
              type="number"
              value={editCapacidad}
              onChange={(e) => setEditCapacidad(Number(e.target.value))}
              className="bg-black border border-[#2a2a2a] rounded-md px-3 py-2 text-white outline-none focus:border-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#676B67] uppercase font-semibold">Ubicación</label>
            <select
              value={editZona}
              onChange={(e) => setEditZona(e.target.value)}
              className="bg-black border border-[#2a2a2a] rounded-md px-3 py-2 text-white outline-none focus:border-white"
            >
              <option value="salon">SALÓN PRINCIPAL</option>
              <option value="terraza">TERRAZA EXTERIOR</option>
              <option value="bar">BAR</option>
              <option value="sofas">ZONA SOFÁS</option>
              <option value="cocina">ZONA COCINA</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleGuardarEdicion}>Guardar Cambios</Button>
          </div>
        </div>
      ) : (
      <div className="space-y-5">
        {/* Estado badges */}
        <div>
          <p className="text-xs font-semibold text-[#676B67] tracking-widest uppercase mb-2">Estado</p>
          <div className="flex flex-wrap gap-2">
            {ESTADOS_ORDEN.map((estado) => (
              <button
                key={estado}
                onClick={() => handleEstadoChange(estado)}
                aria-label={`Cambiar estado a ${TEXTO_ESTADO_MESA[estado]}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all border-2 ${
                  mesa.estado === estado
                    ? `${COLORES_ESTADO_MESA[estado]} border-white`
                    : `${COLORES_ESTADO_MESA[estado]} border-transparent opacity-50 hover:opacity-80`
                }`}
              >
                {TEXTO_ESTADO_MESA[estado]}
              </button>
            ))}
          </div>
        </div>

        {/* Personas + Timer */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-[#676B67] tracking-widest uppercase mb-2">Personas</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePersonasChange(personas - 1)}
                aria-label="Reducir personas"
                className="w-8 h-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors font-bold"
              >−</button>
              <span className="text-white font-bold text-xl w-6 text-center">{personas}</span>
              <button
                onClick={() => handlePersonasChange(personas + 1)}
                aria-label="Aumentar personas"
                className="w-8 h-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#2a2a2a] transition-colors font-bold"
              >+</button>
              <div className="flex items-center gap-1 ml-2 text-[#676B67]">
                <Users size={14} />
              </div>
            </div>
          </div>

          {mesa.timerInicio && (
            <div>
              <p className="text-xs font-semibold text-[#676B67] tracking-widest uppercase mb-2">Tiempo</p>
              <div className="flex items-center gap-2 text-white">
                <Clock size={14} className="text-[#676B67]" />
                <span className="font-mono font-bold text-xl">{elapsed}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pedido activo */}
        {pedido && (
          <div className="border border-[#1e1e1e] rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-[#676B67] tracking-widest uppercase">Pedido Activo</p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {pedido.items.map((item) => (
                <div key={item.productoId} className="flex justify-between text-sm">
                  <span className="text-[#BCB9B9]">{item.cantidad}× {item.nombre}</span>
                  <span className="text-white font-mono">{formatARS(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1e1e1e] pt-2 flex justify-between">
              <span className="text-xs font-semibold text-[#676B67] uppercase tracking-widest">Total</span>
              <span className="text-white font-bold font-mono">{formatARS(pedido.total)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            onClick={handleVerPedido}
            aria-label="Ver o crear pedido para esta mesa"
          >
            {pedido ? 'Ver pedido' : 'Nuevo pedido'}
          </Button>
          {mesa.mesasUnidas && mesa.mesasUnidas.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dividirMesas(mesa.id)}
              aria-label="Dividir mesas unidas"
            >
              <Scissors size={13} />
              Dividir
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={handleCerrarMesa}
            aria-label="Cerrar la mesa y liberarla"
          >
            Cerrar mesa
          </Button>
          <div className="ml-auto flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label="Editar mesa"
            >
              <Edit2 size={14} />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleBorrarMesa}
              aria-label="Eliminar mesa permanentemente"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>
      )}
    </Modal>
  );
}
