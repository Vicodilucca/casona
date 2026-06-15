'use server';

import { createConsulta, updateConsultaEstado } from '@/lib/db';
import type { Consulta } from '@/lib/types';

export async function enviarConsulta(data: Omit<Consulta, 'id' | 'created_at'>) {
  return createConsulta(data);
}

export async function marcarConsultaEstado(id: number, estado: Consulta['estado']) {
  return updateConsultaEstado(id, estado);
}
