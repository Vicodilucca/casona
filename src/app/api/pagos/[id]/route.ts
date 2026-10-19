import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { getPago } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try { await requireAuth(undefined, 'gastos'); } catch {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return new NextResponse(null, { status: 404 });
  const pago = await getPago(id);
  if (!pago) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(pago.contenido), {
    headers: {
      'Content-Type': pago.tipo,
      'Content-Disposition': `attachment; filename="comprobante"; filename*=UTF-8''${encodeURIComponent(pago.nombre).replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16))}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
