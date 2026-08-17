export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { getGastos } from '@/lib/db';
import GastosClient from './GastosClient';

export default async function GastosPage() {
  try {
    await requireAuth(undefined, 'gastos');
  } catch {
    redirect('/');
  }

  const gastos = await getGastos();
  return <GastosClient gastos={gastos} />;
}
