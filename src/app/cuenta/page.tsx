export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import CuentaClient from './CuentaClient';

export default async function CuentaPage() {
  let usuario;
  try {
    usuario = await requireAuth();
  } catch {
    redirect('/login');
  }

  return <CuentaClient nombre={usuario.nombre} email={usuario.email} rol={usuario.rol} />;
}
