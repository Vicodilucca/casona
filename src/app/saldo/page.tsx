export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth, tienePermiso } from '@/lib/auth-guard';
import { getReservasSaldoPendiente } from '@/lib/db';
import SaldoClient from './SaldoClient';

export default async function SaldoPage() {
  let usuario;
  try {
    usuario = await requireAuth(undefined, 'saldo');
  } catch {
    redirect('/');
  }

  const pendientes = await getReservasSaldoPendiente();
  return <SaldoClient pendientes={pendientes} puedeEditar={tienePermiso(usuario, 'saldo', 'editar')} />;
}
