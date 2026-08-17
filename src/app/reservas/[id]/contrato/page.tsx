export const dynamic = 'force-dynamic';
import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getReservaById } from '@/lib/db';
import ContratoPrint from './ContratoPrint';

export default async function ContratoPage({ params }: { params: { id: string } }) {
  try {
    await requireAuth(undefined, 'reservas');
  } catch {
    redirect('/');
  }

  const r = await getReservaById(Number(params.id));
  if (!r || r.plataforma !== 'particular') notFound();
  return <ContratoPrint r={r} />;
}
