import { headers } from 'next/headers';
import { insertAuditLog } from './db';

function getClientIp(): string {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

// Best-effort: un fallo al auditar no debe tumbar la acción de negocio que la originó.
export async function logAudit(
  usuario: { id: number; email: string } | null,
  accion: string,
  entidad: string,
  entidadId: number | null = null,
  detalle: Record<string, unknown> | null = null,
): Promise<void> {
  try {
    await insertAuditLog({
      usuarioId: usuario?.id ?? null,
      usuarioEmail: usuario?.email ?? null,
      accion,
      entidad,
      entidadId,
      detalle,
      ip: getClientIp(),
    });
  } catch (err) {
    console.error('logAudit error:', err);
  }
}
