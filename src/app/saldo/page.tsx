import { getReservasSaldoPendiente } from '@/lib/db';
import SaldoClient from './SaldoClient';

export default function SaldoPage() {
  const pendientes = getReservasSaldoPendiente();
  return <SaldoClient pendientes={pendientes} />;
}
