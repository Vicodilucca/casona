'use server';

import { createConsulta, updateConsultaEstado } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { logAudit } from '@/lib/audit';
import type { Consulta } from '@/lib/types';

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

// Endpoint público (formulario de huéspedes) — sin sesión. Se valida todo
// del lado del servidor porque el cliente puede llamar a esta action
// directamente con cualquier payload.
export async function enviarConsulta(data: Omit<Consulta, 'id' | 'created_at'>) {
  const nombre = String(data.nombre ?? '').trim().slice(0, 200);
  if (!nombre) throw new Error('Falta el nombre.');

  const adultos = Math.trunc(Number(data.adultos));
  const ninos = Math.trunc(Number(data.ninos));
  if (!Number.isFinite(adultos) || adultos < 1 || adultos > 20) {
    throw new Error('Cantidad de adultos inválida.');
  }
  if (!Number.isFinite(ninos) || ninos < 0 || ninos > 20) {
    throw new Error('Cantidad de niños inválida.');
  }

  if (!FECHA_RE.test(data.fecha_inicio) || !FECHA_RE.test(data.fecha_fin)) {
    throw new Error('Fechas inválidas.');
  }
  if (data.fecha_fin <= data.fecha_inicio) {
    throw new Error('El rango de fechas es inválido.');
  }

  const notas = data.notas ? String(data.notas).trim().slice(0, 1000) || null : null;

  return await createConsulta({
    nombre,
    adultos,
    ninos,
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin,
    llegada_tarde: Boolean(data.llegada_tarde),
    notas,
    estado: 'pendiente', // siempre pendiente en un alta pública, sin importar lo que mande el cliente
  });
}

export async function marcarConsultaEstado(id: number, estado: Consulta['estado']) {
  const usuario = await requireAuth(undefined, 'consultas');
  const result = await updateConsultaEstado(id, estado);
  await logAudit(usuario, 'cambiar_estado', 'consulta', id, { estado });
  return result;
}
