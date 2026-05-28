'use client';

import { useState } from 'react';
import { cn } from '@/hooks/lib/utils';
import { useCajeroRealtime } from '@/hooks/useCajeroRealtime';
import { useHistorialHoy } from '@/hooks/useHistorialHoy';

import { ResumenEstadoBar } from '@/components/cajero/ResumenEstadoBar';
import { ColaDeCobro } from '@/components/cajero/ColaDeCobro';
import { PedidoDetallePanel } from '@/components/cajero/PedidoDetallePanel';
import { ModalCobro } from '@/components/cajero/ModalCobro';
import { ModalFactura } from '@/components/cajero/ModalFactura';
import { HistorialFacturas } from '@/components/cajero/HistorialFacturas';
import { CierreDeCaja } from '@/components/cajero/CierreDeCaja';

import type { PedidoCajero } from '@/services/cajeroService';
import type { Factura } from '@/types/factura';

type Tab = 'cobros' | 'historial' | 'cierre';

export default function CajeroDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('cobros');
  
  // Realtime hook para pedidos listos para cobrar
  const { pedidos, loading: pedidosLoading, error: pedidosError, refetch: refetchPedidos } = useCajeroRealtime();
  
  // Hook de historial para las métricas del día de hoy
  const { facturas, loading: facturasLoading, error: facturasError, fecha, setFecha, refetch: refetchFacturas } = useHistorialHoy();

  // Estado del flujo de cobro
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState<string | null>(null);
  const [pedidoParaCobrar, setPedidoParaCobrar] = useState<PedidoCajero | null>(null); // Activa ModalCobro
  const [facturaMostrada, setFacturaMostrada] = useState<Factura | null>(null); // Activa ModalFactura

  // Handlers para el tab de Cobros
  const handleSelectPedido = (p: PedidoCajero) => {
    setPedidoSeleccionadoId(p.id);
  };

  const handlePedidoActualizado = (pActualizado: PedidoCajero) => {
    // La suscripción realtime de Supabase actualizará la lista, pero para dar feedback inmediato:
    refetchPedidos();
  };

  const handlePedidoCancelado = () => {
    setPedidoSeleccionadoId(null);
    refetchPedidos();
  };

  const handleIniciarCobro = (p: PedidoCajero) => {
    setPedidoParaCobrar(p);
  };

  const handleCobroRegistrado = (factura: Factura, _pedido: PedidoCajero) => {
    setPedidoParaCobrar(null);
    setPedidoSeleccionadoId(null);
    setFacturaMostrada(factura);
    // Refrescar datos
    refetchPedidos();
    refetchFacturas();
  };

  // Encontrar el pedido completo a mostrar en el panel derecho
  const pedidoSeleccionadoCompleto = pedidos.find(p => p.id === pedidoSeleccionadoId) || null;

  return (
    <div className="space-y-6">
      <ResumenEstadoBar pedidosPendientes={pedidos} facturasHoy={facturas} />

      {/* Tabs navigation */}
      <div className="flex border-b border-[#1a1a1a]">
        <button
          onClick={() => setActiveTab('cobros')}
          className={cn(
            'px-6 py-3 font-semibold text-sm tracking-widest uppercase transition-all',
            activeTab === 'cobros'
              ? 'border-b-2 border-white text-white'
              : 'text-[#676B67] hover:text-white hover:border-[#3a3a3a] border-b-2 border-transparent'
          )}
        >
          Cobros
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={cn(
            'px-6 py-3 font-semibold text-sm tracking-widest uppercase transition-all',
            activeTab === 'historial'
              ? 'border-b-2 border-white text-white'
              : 'text-[#676B67] hover:text-white hover:border-[#3a3a3a] border-b-2 border-transparent'
          )}
        >
          Historial
        </button>
        <button
          onClick={() => setActiveTab('cierre')}
          className={cn(
            'px-6 py-3 font-semibold text-sm tracking-widest uppercase transition-all',
            activeTab === 'cierre'
              ? 'border-b-2 border-white text-white'
              : 'text-[#676B67] hover:text-white hover:border-[#3a3a3a] border-b-2 border-transparent'
          )}
        >
          Cierre de caja
        </button>
      </div>

      {/* Tabs Content */}
      <div className="pt-2">
        {activeTab === 'cobros' && (
          <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-17rem)]">
            <div className="w-full md:w-[40%] flex flex-col h-full">
              <h3 className="text-white font-bold tracking-widest uppercase mb-3 text-sm">Mesas listas para cobrar</h3>
              <div className="flex-1 bg-[#080808] border border-[#1a1a1a] rounded-2xl p-2 overflow-hidden">
                <ColaDeCobro
                  pedidos={pedidos}
                  loading={pedidosLoading}
                  error={pedidosError}
                  selectedId={pedidoSeleccionadoId}
                  onSelect={handleSelectPedido}
                />
              </div>
            </div>
            <div className="w-full md:w-[60%] flex flex-col h-full">
              <h3 className="text-white font-bold tracking-widest uppercase mb-3 text-sm opacity-0 hidden md:block">Detalle</h3>
              <div className="flex-1 overflow-hidden h-full">
                <PedidoDetallePanel
                  pedido={pedidoSeleccionadoCompleto}
                  onCobrar={handleIniciarCobro}
                  onPedidoCancelado={handlePedidoCancelado}
                  onPedidoActualizado={handlePedidoActualizado}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'historial' && (
          <HistorialFacturas
            facturas={facturas}
            loading={facturasLoading}
            error={facturasError}
            fecha={fecha}
            onFechaChange={setFecha}
            onVerComprobante={setFacturaMostrada}
          />
        )}

        {activeTab === 'cierre' && (
          <CierreDeCaja />
        )}
      </div>

      {/* Modals */}
      {pedidoParaCobrar && (
        <ModalCobro
          pedido={pedidoParaCobrar}
          onClose={() => setPedidoParaCobrar(null)}
          onCobroRegistrado={handleCobroRegistrado}
        />
      )}

      {facturaMostrada && (
        <ModalFactura
          factura={facturaMostrada}
          onClose={() => setFacturaMostrada(null)}
        />
      )}
    </div>
  );
}
