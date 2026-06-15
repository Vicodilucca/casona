'use server';

import { revalidatePath } from 'next/cache';
import { createGasto, updateGasto, deleteGasto } from '@/lib/db';
import type { Gasto } from '@/lib/types';

export async function agregarGasto(data: Omit<Gasto, 'id' | 'created_at'>) {
  await createGasto(data);
  revalidatePath('/');
  revalidatePath('/gastos');
  revalidatePath('/reportes');
}

export async function editarGasto(id: number, data: Omit<Gasto, 'id' | 'created_at'>) {
  await updateGasto(id, data);
  revalidatePath('/');
  revalidatePath('/gastos');
  revalidatePath('/reportes');
}

export async function eliminarGasto(id: number) {
  await deleteGasto(id);
  revalidatePath('/');
  revalidatePath('/gastos');
  revalidatePath('/reportes');
}
