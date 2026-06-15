export const dynamic = 'force-dynamic';
import { getReservasSaldoPendiente } from '@/lib/db';
import SaldoClient from './SaldoClient';

export default async function SaldoPage() {
  const pendientes = await getReservasSaldoPendiente();
  return <SaldoClient pendientes={pendientes} />;
}
