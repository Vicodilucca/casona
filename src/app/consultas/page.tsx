export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getConsultas } from '@/lib/db';
import ConsultasClient from './ConsultasClient';

export default async function ConsultasPage() {
  try {
    await requireAuth(undefined, 'consultas');
  } catch {
    redirect('/');
  }

  const consultas = await getConsultas();
  return <ConsultasClient consultas={consultas} />;
}
