export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth, tienePermiso } from '@/lib/auth-guard';
import { getGastos, getAutoresGastos } from '@/lib/db';
import GastosClient from './GastosClient';

export default async function GastosPage({ searchParams }: { searchParams: { gasto?: string } }) {
  let usuario;
  try {
    usuario = await requireAuth(undefined, 'gastos');
  } catch {
    redirect('/');
  }

  const [gastos, autores] = await Promise.all([getGastos(), usuario.rol === 'superadmin' ? getAutoresGastos() : Promise.resolve([])]);
  return (
    <GastosClient
      gastos={gastos}
      autores={autores}
      puedeAuditar={usuario.rol === 'superadmin'}
      gastoSeleccionado={searchParams.gasto ?? ''}
      puedeCrear={tienePermiso(usuario, 'gastos', 'crear')}
      puedeEditar={tienePermiso(usuario, 'gastos', 'editar')}
      puedeEliminar={tienePermiso(usuario, 'gastos', 'eliminar')}
    />
  );
}
