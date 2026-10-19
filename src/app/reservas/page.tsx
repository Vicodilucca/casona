export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth, tienePermiso } from '@/lib/auth-guard';
import { getReservas, getCobrosLuz } from '@/lib/db';
import ReservasClient from './ReservasClient';

export default async function ReservasPage({ searchParams }: { searchParams: { id?: string } }) {
  let usuario;
  try {
    usuario = await requireAuth(undefined, 'reservas');
  } catch {
    redirect('/');
  }

  const [reservas, cobrosLuz] = await Promise.all([getReservas(), getCobrosLuz()]);
  const highlightId = searchParams.id ? Number(searchParams.id) : undefined;
  return (
    <ReservasClient
      reservas={reservas}
      cobrosLuz={cobrosLuz}
      highlightId={highlightId}
      puedeCrear={tienePermiso(usuario, 'reservas', 'crear')}
      puedeEditar={tienePermiso(usuario, 'reservas', 'editar')}
      puedeEliminar={tienePermiso(usuario, 'reservas', 'eliminar')}
      puedeSaldo={tienePermiso(usuario, 'saldo', 'editar')}
    />
  );
}
