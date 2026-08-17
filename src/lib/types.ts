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
  Alquiler: [],
  Otros: [],
};

export const SOCIOS = {
  yo: { nombre: 'María Victoria', porcentaje: 0.65 },
  socio: { nombre: 'Luis', porcentaje: 0.35 },
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

export type Rol = 'superadmin' | 'admin';

// Secciones de la app que se pueden habilitar/deshabilitar por usuario.
// Un superadmin tiene acceso a todas siempre, incluidas "Usuarios" y
// "Auditoría", que quedan fuera de este catálogo por ser exclusivas de
// superadmin y no delegables.
export type Seccion =
  | 'reservas' | 'calendario' | 'gastos' | 'saldo' | 'reportes' | 'consultas';

export const SECCIONES: { key: Seccion; label: string; descripcion: string }[] = [
  { key: 'reservas',   label: 'Reservas',   descripcion: 'Reservas y sus PDF de resumen/contrato' },
  { key: 'calendario', label: 'Calendario', descripcion: 'Calendario de ocupación' },
  { key: 'gastos',     label: 'Gastos',     descripcion: 'Gastos del negocio' },
  { key: 'saldo',      label: 'Saldo',      descripcion: 'Saldos pendientes de cobro' },
  { key: 'reportes',   label: 'Reportes',   descripcion: 'Reportes financieros y balance con el socio' },
  { key: 'consultas',  label: 'Consultas',  descripcion: 'Consultas de huéspedes' },
];

// Acciones posibles dentro de cada sección. No todas las secciones admiten
// las cuatro: p. ej. Calendario y Reportes son de solo lectura, y Consultas
// no tiene alta ni baja (las consultas las crea el propio huésped).
export type Accion = 'ver' | 'crear' | 'editar' | 'eliminar';

export const ACCIONES_POR_SECCION: Record<Seccion, Accion[]> = {
  reservas:   ['ver', 'crear', 'editar', 'eliminar'],
  calendario: ['ver'],
  gastos:     ['ver', 'crear', 'editar', 'eliminar'],
  saldo:      ['ver', 'editar'],
  reportes:   ['ver'],
  consultas:  ['ver', 'editar'],
};

export const ACCION_LABEL: Record<Accion, string> = {
  ver: 'Ver', crear: 'Crear', editar: 'Editar', eliminar: 'Eliminar',
};

// Un permiso se guarda como "seccion:accion", p. ej. "gastos:crear".
export type Permiso = `${Seccion}:${Accion}`;

export function permiso(seccion: Seccion, accion: Accion): Permiso {
  return `${seccion}:${accion}`;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  permisos: Permiso[];
  activo: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  usuario_id: number | null;
  usuario_email: string | null;
  accion: string;
  entidad: string;
  entidad_id: number | null;
  detalle: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}
