import { getReservas } from '@/lib/db';
import CalendarioClient from './CalendarioClient';

export default function CalendarioPage() {
  const reservas = getReservas().filter((r) => r.estado === 'confirmada');
  return <CalendarioClient reservas={reservas} />;
}
