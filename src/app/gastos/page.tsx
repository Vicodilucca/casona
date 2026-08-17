export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth, tienePermiso } from '@/lib/auth-guard';
import { getGastos } from '@/lib/db';
import GastosClient from './GastosClient';

export default async function GastosPage() {
  let usuario;
  try {
    usuario = await requireAuth(undefined, 'gastos');
  } catch {
    redirect('/');
  }

  const gastos = await getGastos();
  return (
    <GastosClient
      gastos={gastos}
      puedeCrear={tienePermiso(usuario, 'gastos', 'crear')}
      puedeEditar={tienePermiso(usuario, 'gastos', 'editar')}
      puedeEliminar={tienePermiso(usuario, 'gastos', 'eliminar')}
    />
  );
}
