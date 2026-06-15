export const dynamic = 'force-dynamic';
import { getReservas } from '@/lib/db';
import CalendarioClient from './CalendarioClient';

export default async function CalendarioPage() {
  const reservas = (await getReservas()).filter((r) => r.estado === 'confirmada');
  return <CalendarioClient reservas={reservas} />;
}
