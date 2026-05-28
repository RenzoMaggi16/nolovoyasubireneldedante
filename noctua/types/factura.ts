export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export interface Factura {
  id: string;
  pedidoId: string;
  estado: 'emitida' | 'anulada';
  total: number;
  subtotal: number;
  descuento: number;
  iva: number;
  cae: string;
  qrFiscal: string;
  metodoPago: MetodoPago;
  creadaEn: Date;
  // Datos enriquecidos para display
  mesa?: {
    numero: number;
    zona: string;
  };
  items?: {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
}
