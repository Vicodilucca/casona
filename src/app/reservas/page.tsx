export const dynamic = 'force-dynamic';
import { getReservas } from '@/lib/db';
import ReservasClient from './ReservasClient';

export default async function ReservasPage({ searchParams }: { searchParams: { id?: string } }) {
  const reservas = await getReservas();
  const highlightId = searchParams.id ? Number(searchParams.id) : undefined;
  return <ReservasClient reservas={reservas} highlightId={highlightId} />;
}
