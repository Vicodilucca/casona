import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireAuth, tienePermiso } from '@/lib/auth-guard';
import { getReservaById, getComprobantesReserva } from '@/lib/db';
import AdjuntarComprobanteReserva from '@/components/AdjuntarComprobanteReserva';

export const dynamic = 'force-dynamic';

export default async function ComprobantesPage({ params }: { params: { id: string } }) {
  const usuario = await requireAuth().catch(() => null);
  if (!usuario || (!tienePermiso(usuario, 'reservas') && !tienePermiso(usuario, 'saldo'))) redirect('/');
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const reserva = await getReservaById(id);
  if (!reserva) notFound();
  const comprobantes = await getComprobantesReserva(id);
  return (
    <div className="space-y-5">
      <Link href={tienePermiso(usuario, 'reservas') ? '/reservas' : '/saldo'} className="text-blue-600 text-sm">← Volver</Link>
      <h1 className="text-xl font-bold">Comprobantes · {reserva.huesped}</h1>
      <p className="text-sm text-slate-500">Reserva #{id} · {reserva.fecha_inicio} a {reserva.fecha_fin}</p>
      <AdjuntarComprobanteReserva reservaId={id} puedeReserva={tienePermiso(usuario, 'reservas', 'editar')} puedeSaldo={tienePermiso(usuario, 'saldo', 'editar') || tienePermiso(usuario, 'reservas', 'editar')} />
      {comprobantes.length === 0 && <p className="card p-5 text-slate-500">Todavía no hay comprobantes guardados.</p>}
      {comprobantes.map(archivo => (
        <div key={archivo.id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0"><p className="font-medium break-all">{archivo.nombre}</p><p className="text-sm text-slate-500">{archivo.concepto === 'saldo' ? 'Pago del saldo' : 'Reserva / seña'}</p></div>
          <a className="btn-secondary" href={`/api/reservas/${id}/comprobantes/${archivo.id}`}>Descargar</a>
        </div>
      ))}
    </div>
  );
}
