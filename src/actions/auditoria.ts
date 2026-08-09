'use server';

import { requireAuth } from '@/lib/auth-guard';
import { getAuditLog } from '@/lib/db';

export async function obtenerAuditLog(offset: number, usuarioId?: number) {
  await requireAuth('superadmin');
  return getAuditLog({ offset, limit: 30, usuarioId });
}
