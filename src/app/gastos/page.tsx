import { getGastos } from '@/lib/db';
import GastosClient from './GastosClient';

export default async function GastosPage() {
  const gastos = await getGastos();
  return <GastosClient gastos={gastos} />;
}
