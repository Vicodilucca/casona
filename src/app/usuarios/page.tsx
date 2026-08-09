export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getUsuarios } from '@/lib/db';
import UsuariosClient from './UsuariosClient';

export default async function UsuariosPage() {
  let usuarioActual;
  try {
    usuarioActual = await requireAuth('superadmin');
  } catch {
    redirect('/');
  }

  const usuarios = await getUsuarios();

  return <UsuariosClient usuarios={usuarios} usuarioActualId={usuarioActual.id} />;
}
