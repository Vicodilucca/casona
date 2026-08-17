'use server';

import { revalidatePath } from 'next/cache';
import { createReserva, updateReserva, deleteReserva, marcarSaldoPagado } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { logAudit } from '@/lib/audit';
import type { Reserva } from '@/lib/types';

export async function agregarReserva(data: Omit<Reserva, 'id' | 'created_at'>) {
  const usuario = await requireAuth(undefined, 'reservas', 'crear');
  const reserva = await createReserva(data);
  await logAudit(usuario, 'crear', 'reserva', reserva.id, { huesped: reserva.huesped });
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/reportes');
}

export async function editarReserva(id: number, data: Omit<Reserva, 'id' | 'created_at'>) {
  const usuario = await requireAuth(undefined, 'reservas', 'editar');
  await updateReserva(id, data);
  await logAudit(usuario, 'editar', 'reserva', id, { huesped: data.huesped });
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/reportes');
}

export async function eliminarReserva(id: number) {
  const usuario = await requireAuth(undefined, 'reservas', 'eliminar');
  await deleteReserva(id);
  await logAudit(usuario, 'eliminar', 'reserva', id, null);
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/reportes');
}

export async function pagarSaldo(
  id: number,
  fecha: string,
  saldoYo: number,
  saldoSocio: number,
  cotizacionSaldo: number | null,
  montoLuz: number | null = null,
) {
  const usuario = await requireAuth(undefined, 'saldo', 'editar');
  await marcarSaldoPagado(id, fecha, saldoYo, saldoSocio, cotizacionSaldo, montoLuz);
  await logAudit(usuario, 'pagar_saldo', 'reserva', id, { saldoYo, saldoSocio });
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/saldo');
}
