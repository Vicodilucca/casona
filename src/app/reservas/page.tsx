export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getReservas } from '@/lib/db';
import ReservasClient from './ReservasClient';

export default async function ReservasPage({ searchParams }: { searchParams: { id?: string } }) {
  try {
    await requireAuth(undefined, 'reservas');
  } catch {
    redirect('/');
  }

  const reservas = await getReservas();
  const highlightId = searchParams.id ? Number(searchParams.id) : undefined;
  return <ReservasClient reservas={reservas} highlightId={highlightId} />;
}
