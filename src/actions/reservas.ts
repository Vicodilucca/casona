'use server';

import { leerComprobantesReserva } from '@/lib/pagos';
import { revalidatePath } from 'next/cache';
import { createReserva, updateReserva, deleteReserva, marcarSaldoPagado, addComprobantesReserva, guardarCobroLuz } from '@/lib/db';
import { requireAuth, tienePermiso } from '@/lib/auth-guard';
import { logAudit } from '@/lib/audit';
import type { Reserva } from '@/lib/types';

export async function agregarReserva(data: Omit<Reserva, 'id' | 'created_at'>, adjuntos?: FormData) {
  const usuario = await requireAuth(undefined, 'reservas', 'crear');
  const reserva = await createReserva(data, await leerComprobantesReserva(adjuntos));
  await logAudit(usuario, 'crear', 'reserva', reserva.id, { huesped: reserva.huesped });
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/reservas/[id]/comprobantes', 'page');
  revalidatePath('/saldo');
  revalidatePath('/reportes');
}

export async function editarReserva(id: number, data: Omit<Reserva, 'id' | 'created_at'>, adjuntos?: FormData) {
  const usuario = await requireAuth(undefined, 'reservas', 'editar');
  await updateReserva(id, data, await leerComprobantesReserva(adjuntos));
  await logAudit(usuario, 'editar', 'reserva', id, { huesped: data.huesped });
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/reservas/[id]/comprobantes', 'page');
  revalidatePath('/saldo');
  revalidatePath('/reportes');
}

export async function eliminarReserva(id: number) {
  const usuario = await requireAuth(undefined, 'reservas', 'eliminar');
  await deleteReserva(id);
  await logAudit(usuario, 'eliminar', 'reserva', id, null);
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/reservas/[id]/comprobantes', 'page');
  revalidatePath('/saldo');
  revalidatePath('/reportes');
}

export async function pagarSaldo(
  id: number,
  fecha: string,
  saldoYo: number,
  saldoSocio: number,
  cotizacionSaldo: number | null,
  montoLuz: number | null = null,
  adjuntos?: FormData,
) {
  const usuario = await requireAuth(undefined, 'saldo', 'editar');
  const archivos = await leerComprobantesReserva(adjuntos);
  if (archivos.some(a => a.concepto !== 'saldo')) throw new Error('Solo se permiten comprobantes del saldo.');
  await marcarSaldoPagado(id, fecha, saldoYo, saldoSocio, cotizacionSaldo, montoLuz, archivos);
  await logAudit(usuario, 'pagar_saldo', 'reserva', id, { saldoYo, saldoSocio });
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/reservas/[id]/comprobantes', 'page');
  revalidatePath('/saldo');
}

export async function adjuntarComprobanteReserva(id: number, adjuntos: FormData) {
  const usuario = await requireAuth();
  const puedeReserva = tienePermiso(usuario, 'reservas', 'editar');
  const puedeSaldo = tienePermiso(usuario, 'saldo', 'editar');
  if (!puedeReserva && !puedeSaldo) throw new Error('No autorizado.');
  const archivos = await leerComprobantesReserva(adjuntos);
  if (!archivos.length) throw new Error('Elegí un comprobante.');
  if (!puedeReserva && archivos.some(a => a.concepto !== 'saldo')) throw new Error('No autorizado.');
  await addComprobantesReserva(id, archivos);
  await logAudit(usuario, 'adjuntar_comprobante', 'reserva', id, { conceptos: archivos.map(a => a.concepto) });
  revalidatePath(`/reservas/${id}/comprobantes`);
}

export async function registrarCobroLuz(id: number, monto: number, fecha: string, cobradoPor: 'yo' | 'socio') {
  const usuario = await requireAuth();
  if (!tienePermiso(usuario, 'reservas', 'editar') && !tienePermiso(usuario, 'saldo', 'editar')) throw new Error('No autorizado.');
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isFinite(monto) || monto < 0 || monto > 999999999999.99) throw new Error('Ingresá un importe válido.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(Date.parse(fecha)) || new Date(fecha).toISOString().slice(0, 10) !== fecha) throw new Error('Ingresá una fecha válida.');
  if (cobradoPor !== 'socio') throw new Error('El cobro de luz lo recibe Luis.');
  await guardarCobroLuz(id, Math.round(monto * 100) / 100, fecha, cobradoPor);
  await logAudit(usuario, 'cobrar_luz', 'reserva', id, { monto, fecha, cobrado_por: cobradoPor });
  for (const path of ['/', '/reservas', '/saldo', '/reportes', '/resumen-ejecutivo']) revalidatePath(path);
  revalidatePath(`/reservas/${id}/luz`);
}
