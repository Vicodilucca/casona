export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getReservas } from '@/lib/db';
import CalendarioClient from './CalendarioClient';

export default async function CalendarioPage() {
  try {
    await requireAuth(undefined, 'calendario');
  } catch {
    redirect('/');
  }

  const reservas = (await getReservas()).filter((r) => r.estado === 'confirmada');
  return <CalendarioClient reservas={reservas} />;
}
