import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getPagos } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PagosPage({ searchParams }: { searchParams: { gasto?: string } }) {
  try { await requireAuth(undefined, 'gastos'); } catch { redirect('/'); }
  const gasto = searchParams.gasto ? Number(searchParams.gasto) : undefined;
  const pagos = await getPagos(gasto !== undefined && Number.isSafeInteger(gasto) && gasto > 0 ? gasto : undefined);
  return (
    <div className="space-y-5">
      <Link href="/gastos" className="text-sm text-blue-600">← Volver a Gastos</Link>
      <h1 className="text-xl font-bold text-slate-900">📁 Pagos</h1>
      <p className="text-sm text-slate-500">Comprobantes guardados con tus gastos. {pagos.length} archivos.</p>
      {searchParams.gasto && <Link href="/gastos/pagos" className="text-blue-600 block">Ver todos los pagos</Link>}
      {pagos.length === 0 && <div className="card p-6 text-slate-500">Todavía no hay comprobantes. Adjuntá uno al crear o editar un gasto.</div>}
      <div className="space-y-3">
        {pagos.map(pago => (
          <div key={pago.id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium break-all">{pago.nombre}</p>
              <p className="text-sm text-slate-500">{pago.gasto_id ? `Gasto #${pago.gasto_id} · ${pago.fecha} · ${pago.descripcion || 'Sin descripción'}` : 'Comprobante archivado · Gasto eliminado'}</p>
            </div>
            <a href={`/api/pagos/${pago.id}`} className="btn-secondary">Descargar</a>
          </div>
        ))}
      </div>
    </div>
  );
}
