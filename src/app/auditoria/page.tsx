export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getAuditLog, getUsuarios } from '@/lib/db';
import AuditoriaClient from './AuditoriaClient';

export default async function AuditoriaPage() {
  try {
    await requireAuth('superadmin');
  } catch {
    redirect('/');
  }

  const [{ entries, total }, usuarios] = await Promise.all([
    getAuditLog({ offset: 0, limit: 30 }),
    getUsuarios(),
  ]);

  return <AuditoriaClient entriesIniciales={entries} totalInicial={total} usuarios={usuarios} />;
}
