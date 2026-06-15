export interface Reserva {
  id: number;
  // Huésped
  huesped: string;          // nombre y apellido
  dni: string;
  direccion: string;
  // Ocupantes
  adultos: number;
  ninos: number;
  mascotas: number;
  // Estadía
  fecha_inicio: string;
  hora_inicio: string;      // HH:MM
  fecha_fin: string;
  hora_fin: string;         // HH:MM
  // Reserva
  fecha_reserva: string;    // fecha en que se realizó la reserva
  plataforma: 'airbnb' | 'particular';
  monto_usd: number | null;        // total acordado en USD
  cotizacion: number | null;       // ARS por USD al momento del pago parcial
  monto: number;                   // total ARS = monto_yo + monto_socio + saldo_yo + saldo_socio
  monto_yo: number;                // pago parcial cobrado por mí en ARS
  monto_socio: number;             // pago parcial cobrado por socio en ARS
  saldo_pendiente: number;         // saldo estimado en ARS = saldo_yo + saldo_socio
  saldo_yo: number;                // ARS de saldo cobrado por mí
  saldo_socio: number;             // ARS de saldo cobrado por socio (incluye luz)
  monto_luz: number | null;        // porción de saldo_socio que corresponde a luz
  cotizacion_saldo: number | null; // ARS por USD al momento del cobro del saldo
  saldo_pagado: boolean;
  fecha_pago_saldo: string | null;
  estado: 'confirmada' | 'cancelada' | 'pendiente';
  notas: string | null;
  created_at: string;
}

export interface Gasto {
  id: number;
  fecha: string;
  categoria: string;
  subcategoria: string | null;
  descripcion: string;
  monto: number;
  pagado_por: 'yo' | 'socio';
  tipo: 'ordinario' | 'extraordinario';
  created_at: string;
}

export const CATEGORIAS: Record<string, string[]> = {
  Limpieza: [],
  Impuestos: ['API', 'TGI', 'VEP', 'Otro'],
  Mantenimiento: [],
  Servicios: ['EPE', 'Agua', 'Alarma', 'Internet', 'Seguro', 'Otro'],
  Otros: [],
};

export const SOCIOS = {
  yo: { nombre: 'María Victoria', porcentaje: 0.65 },
  socio: { nombre: 'Socio', porcentaje: 0.35 },
};

export interface Consulta {
  id: number;
  nombre: string;
  adultos: number;
  ninos: number;
  fecha_inicio: string;
  fecha_fin: string;
  llegada_tarde: boolean;
  notas: string | null;
  estado: 'pendiente' | 'contactado' | 'convertida' | 'rechazada';
  created_at: string;
}
