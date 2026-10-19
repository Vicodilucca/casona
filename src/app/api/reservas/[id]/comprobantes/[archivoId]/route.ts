import { NextResponse } from 'next/server';
import { requireAuth, tienePermiso } from '@/lib/auth-guard';
import { getComprobanteReserva } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string; archivoId: string } }) {
  const usuario = await requireAuth().catch(() => null);
  if (!usuario || (!tienePermiso(usuario, 'reservas') && !tienePermiso(usuario, 'saldo'))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }
  const reservaId = Number(params.id), archivoId = Number(params.archivoId);
  if (![reservaId, archivoId].every(id => Number.isSafeInteger(id) && id > 0)) return new NextResponse(null, { status: 404 });
  const archivo = await getComprobanteReserva(archivoId, reservaId);
  if (!archivo) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(archivo.contenido), { headers: {
    'Content-Type': archivo.tipo,
    'Content-Disposition': `attachment; filename="comprobante"; filename*=UTF-8''${encodeURIComponent(archivo.nombre).replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16))}`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
}
