import { notFound } from 'next/navigation';
import { getReservaById } from '@/lib/db';
import ResumenPrint from './ResumenPrint';

export default async function ResumenPage({ params }: { params: { id: string } }) {
  const r = await getReservaById(Number(params.id));
  if (!r) notFound();
  return <ResumenPrint r={r} />;
}
