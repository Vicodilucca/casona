import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireAuth, tienePermiso } from '@/lib/auth-guard';
import { getReservaById, getCobrosLuz } from '@/lib/db';
import CobroLuzForm from '@/components/CobroLuzForm';

export const dynamic = 'force-dynamic';
export default async function CobroLuzPage({ params }: { params: { id: string } }) {
  const usuario = await requireAuth().catch(() => null);
  if (!usuario || (!tienePermiso(usuario, 'reservas', 'editar') && !tienePermiso(usuario, 'saldo', 'editar'))) redirect('/');
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const reserva = await getReservaById(id);
  if (!reserva) notFound();
  const luz = (await getCobrosLuz()).find(c => c.reserva_id === id);
  return <div className="space-y-4 max-w-lg mx-auto">
    <Link href={`/reservas?id=${id}`} className="text-blue-600 text-sm">← Volver a la reserva</Link>
    <h1 className="text-xl font-bold">Cobro de luz · {reserva.huesped}</h1>
    <p className="text-sm text-slate-500">Salida: {reserva.fecha_fin.split('-').reverse().join('/')} · Reserva #{id}</p>
    <CobroLuzForm reserva={reserva} initial={luz} />
  </div>;
}
