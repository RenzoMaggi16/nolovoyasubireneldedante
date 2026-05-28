import type { Factura, MetodoPago } from '@/types/factura';
import { IVA_RATE } from '@/hooks/lib/constants';

export interface PedidoCajero {
  id: string;
  mesaId: string;
  mesa: { numero: number; zona: string };
  mozo: string;
  abiertaEn: Date;
  estado: string;
  total: number;
  items: ItemCajero[];
}

export interface ItemCajero {
  id: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

function mapPedido(raw: any): PedidoCajero {
  const items: ItemCajero[] = (raw.pedido_items ?? []).map((i: any) => ({
    id: i.id,
    productoId: i.productos?.id ?? '',
    nombre: i.productos?.nombre ?? 'Producto',
    cantidad: i.cantidad,
    precioUnitario: i.precio_unitario,
    subtotal: i.subtotal,
  }));

  return {
    id: raw.id,
    mesaId: raw.mesa_id,
    mesa: {
      numero: raw.mesas?.numero ?? 0,
      zona: raw.mesas?.zona ?? 'General',
    },
    mozo: raw.usuarios?.nombre ?? 'Sin asignar',
    abiertaEn: new Date(raw.abierto_en),
    estado: raw.estado,
    total: raw.total ?? 0,
    items,
  };
}

function mapFactura(raw: any): Factura {
  const pedidoData = raw.pedidos ?? {};
  const mesaData = pedidoData.mesas ?? {};
  const items = (pedidoData.pedido_items ?? []).map((i: any) => ({
    nombre: i.productos?.nombre ?? 'Producto',
    cantidad: i.cantidad,
    precioUnitario: i.precio_unitario,
    subtotal: i.subtotal,
  }));

  const total = raw.total ?? 0;
  const descuento = raw.descuento ?? 0;
  const subtotal = total / (1 + IVA_RATE);
  const iva = total - subtotal;

  return {
    id: raw.id,
    pedidoId: raw.pedido_id,
    estado: raw.estado,
    total,
    subtotal,
    descuento,
    iva,
    cae: raw.cae ?? '',
    qrFiscal: raw.qr_fiscal ?? '',
    metodoPago: raw.metodo_pago as MetodoPago,
    creadaEn: new Date(raw.creada_en),
    mesa: { numero: mesaData.numero ?? 0, zona: mesaData.zona ?? '' },
    items,
  };
}

export const cajeroService = {
  /** Obtener todos los pedidos listos para cobrar */
  async getPedidosListosParaCobrar(): Promise<PedidoCajero[]> {
    const res = await fetch('/api/cajero/pedidos');
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return (json.pedidos ?? []).map(mapPedido);
  },

  /** Obtener detalle completo de un pedido */
  async getPedidoDetalle(pedidoId: string): Promise<PedidoCajero> {
    const res = await fetch(`/api/cajero/pedidos?id=${pedidoId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return mapPedido(json.pedido);
  },

  /** Actualizar cantidad de un item */
  async updateItemCantidad(itemId: string, cantidad: number, subtotal: number): Promise<void> {
    const res = await fetch('/api/cajero/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, cantidad, subtotal }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
  },

  /** Eliminar un item del pedido */
  async deleteItem(itemId: string): Promise<void> {
    const res = await fetch('/api/cajero/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
  },

  /** Actualizar estado del pedido */
  async updatePedidoEstado(pedidoId: string, estado: string, total?: number): Promise<void> {
    const res = await fetch('/api/cajero/pedidos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidoId, estado, total }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
  },

  /** Registrar cobro: insertar factura + cerrar pedido */
  async registrarCobro(params: {
    pedidoId: string;
    total: number;
    metodoPago: MetodoPago;
    descuento: number;
  }): Promise<Factura> {
    const cae = `CAE-DEMO-${Date.now()}`;
    const qrFiscal = `QR-FISCAL-DEMO-${params.pedidoId}`;

    const res = await fetch('/api/cajero/facturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, cae, qrFiscal }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return mapFactura(json.factura);
  },

  /** Obtener facturas por fecha */
  async getFacturasPorFecha(fecha: string): Promise<Factura[]> {
    const res = await fetch(`/api/cajero/facturas?fecha=${fecha}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return (json.facturas ?? []).map(mapFactura);
  },

  /** Datos para cierre de caja */
  async getDatosCierreCaja(fecha: string) {
    const facturas = await cajeroService.getFacturasPorFecha(fecha);
    const total = facturas.reduce((sum, f) => sum + f.total, 0);
    const cantidad = facturas.length;
    const ticketPromedio = cantidad > 0 ? total / cantidad : 0;
    const mayorCobro = facturas.length > 0 ? Math.max(...facturas.map(f => f.total)) : 0;

    const byMetodo: Record<string, { total: number; cantidad: number }> = {
      efectivo: { total: 0, cantidad: 0 },
      tarjeta: { total: 0, cantidad: 0 },
      transferencia: { total: 0, cantidad: 0 },
    };
    facturas.forEach(f => {
      if (f.metodoPago && byMetodo[f.metodoPago]) {
        byMetodo[f.metodoPago].total += f.total;
        byMetodo[f.metodoPago].cantidad += 1;
      }
    });

    // Actividad por hora
    const byHora: Record<number, { total: number; cantidad: number }> = {};
    for (let h = 0; h < 24; h++) byHora[h] = { total: 0, cantidad: 0 };
    facturas.forEach(f => {
      const hora = f.creadaEn.getHours();
      byHora[hora].total += f.total;
      byHora[hora].cantidad += 1;
    });

    return { total, cantidad, ticketPromedio, mayorCobro, byMetodo, byHora, facturas };
  },
};
