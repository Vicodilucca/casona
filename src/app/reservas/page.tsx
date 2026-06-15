import { getReservas } from '@/lib/db';
import ReservasClient from './ReservasClient';

export default function ReservasPage({ searchParams }: { searchParams: { id?: string } }) {
  const reservas = getReservas();
  const highlightId = searchParams.id ? Number(searchParams.id) : undefined;
  return <ReservasClient reservas={reservas} highlightId={highlightId} />;
}
