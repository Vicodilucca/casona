export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getReservasSaldoPendiente } from '@/lib/db';
import SaldoClient from './SaldoClient';

export default async function SaldoPage() {
  try {
    await requireAuth(undefined, 'saldo');
  } catch {
    redirect('/');
  }

  const pendientes = await getReservasSaldoPendiente();
  return <SaldoClient pendientes={pendientes} />;
}
