'use server';

import { revalidatePath } from 'next/cache';
import { createReserva, updateReserva, deleteReserva, marcarSaldoPagado } from '@/lib/db';
import type { Reserva } from '@/lib/types';

export async function agregarReserva(data: Omit<Reserva, 'id' | 'created_at'>) {
  await createReserva(data);
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/reportes');
}

export async function editarReserva(id: number, data: Omit<Reserva, 'id' | 'created_at'>) {
  await updateReserva(id, data);
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/reportes');
}

export async function eliminarReserva(id: number) {
  await deleteReserva(id);
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
  await marcarSaldoPagado(id, fecha, saldoYo, saldoSocio, cotizacionSaldo, montoLuz);
  revalidatePath('/');
  revalidatePath('/reservas');
  revalidatePath('/saldo');
}
