import { notFound } from 'next/navigation';
import { getReservaById } from '@/lib/db';
import ContratoPrint from './ContratoPrint';

export default function ContratoPage({ params }: { params: { id: string } }) {
  const r = getReservaById(Number(params.id));
  if (!r || r.plataforma !== 'particular') notFound();
  return <ContratoPrint r={r} />;
}
