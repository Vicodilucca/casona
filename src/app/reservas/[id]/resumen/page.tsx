export const dynamic = 'force-dynamic';
import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getReservaById } from '@/lib/db';
import ResumenPrint from './ResumenPrint';

export default async function ResumenPage({ params }: { params: { id: string } }) {
  try {
    await requireAuth(undefined, 'reservas');
  } catch {
    redirect('/');
  }

  const r = await getReservaById(Number(params.id));
  if (!r) notFound();
  return <ResumenPrint r={r} />;
}
