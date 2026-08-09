'use server';

import { revalidatePath } from 'next/cache';
import { createGasto, updateGasto, deleteGasto } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { logAudit } from '@/lib/audit';
import type { Gasto } from '@/lib/types';

export async function agregarGasto(data: Omit<Gasto, 'id' | 'created_at'>) {
  const usuario = await requireAuth();
  const gasto = await createGasto(data);
  await logAudit(usuario, 'crear', 'gasto', gasto.id, { descripcion: gasto.descripcion, monto: gasto.monto });
  revalidatePath('/');
  revalidatePath('/gastos');
  revalidatePath('/reportes');
}

export async function editarGasto(id: number, data: Omit<Gasto, 'id' | 'created_at'>) {
  const usuario = await requireAuth();
  await updateGasto(id, data);
  await logAudit(usuario, 'editar', 'gasto', id, { descripcion: data.descripcion, monto: data.monto });
  revalidatePath('/');
  revalidatePath('/gastos');
  revalidatePath('/reportes');
}

export async function eliminarGasto(id: number) {
  const usuario = await requireAuth();
  await deleteGasto(id);
  await logAudit(usuario, 'eliminar', 'gasto', id, null);
  revalidatePath('/');
  revalidatePath('/gastos');
  revalidatePath('/reportes');
}
