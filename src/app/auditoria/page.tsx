export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getAuditLog, getUsuarios } from '@/lib/db';
import AuditoriaClient from './AuditoriaClient';

export default async function AuditoriaPage({ searchParams }: { searchParams: { usuario?: string } }) {
  try {
    await requireAuth('superadmin');
  } catch {
    redirect('/');
  }

  const id = Number(searchParams.usuario);
  const usuarioId = Number.isSafeInteger(id) && id > 0 ? id : undefined;
  const [{ entries, total }, usuarios] = await Promise.all([
    getAuditLog({ offset: 0, limit: 30, usuarioId }),
    getUsuarios(),
  ]);

  return <AuditoriaClient key={usuarioId ?? 'todos'} usuarioInicial={usuarioId} entriesIniciales={entries} totalInicial={total} usuarios={usuarios} />;
}
