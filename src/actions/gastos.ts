'use server';

import { leerArchivoPago } from '@/lib/pagos';
import { revalidatePath } from 'next/cache';
import { createGasto, updateGasto, deleteGasto } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { logAudit } from '@/lib/audit';
import type { Gasto } from '@/lib/types';

export async function agregarGasto(data: Omit<Gasto, 'id' | 'created_at'>, adjunto?: FormData) {
  const usuario = await requireAuth(undefined, 'gastos', 'crear');
  const gasto = await createGasto(data, await leerArchivoPago(adjunto));
  await logAudit(usuario, 'crear', 'gasto', gasto.id, { descripcion: gasto.descripcion, monto: gasto.monto, fecha: gasto.fecha, categoria: gasto.categoria, pagado_por: gasto.pagado_por });
  revalidatePath('/');
  revalidatePath('/gastos');
  revalidatePath('/gastos/pagos');
  revalidatePath('/reportes');
}

export async function editarGasto(id: number, data: Omit<Gasto, 'id' | 'created_at'>, adjunto?: FormData) {
  const usuario = await requireAuth(undefined, 'gastos', 'editar');
  await updateGasto(id, data, await leerArchivoPago(adjunto));
  await logAudit(usuario, 'editar', 'gasto', id, { descripcion: data.descripcion, monto: data.monto, fecha: data.fecha, categoria: data.categoria, pagado_por: data.pagado_por });
  revalidatePath('/');
  revalidatePath('/gastos');
  revalidatePath('/gastos/pagos');
  revalidatePath('/reportes');
}

export async function eliminarGasto(id: number) {
  const usuario = await requireAuth(undefined, 'gastos', 'eliminar');
  await deleteGasto(id);
  await logAudit(usuario, 'eliminar', 'gasto', id, null);
  revalidatePath('/');
  revalidatePath('/gastos');
  revalidatePath('/gastos/pagos');
  revalidatePath('/reportes');
}
