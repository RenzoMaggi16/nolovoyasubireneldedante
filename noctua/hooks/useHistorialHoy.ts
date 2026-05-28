'use client';

import { useState, useCallback, useEffect } from 'react';
import { cajeroService } from '@/services/cajeroService';
import type { Factura } from '@/types/factura';

function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

export function useHistorialHoy() {
  const [fecha, setFecha] = useState<string>(hoy());
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFacturas = useCallback(async (f: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await cajeroService.getFacturasPorFecha(f);
      setFacturas(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacturas(fecha);
  }, [fecha, fetchFacturas]);

  const cambiarFecha = useCallback((nuevaFecha: string) => {
    setFecha(nuevaFecha);
  }, []);

  return {
    facturas,
    loading,
    error,
    fecha,
    setFecha: cambiarFecha,
    refetch: () => fetchFacturas(fecha),
  };
}
