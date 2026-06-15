import { getGastos } from '@/lib/db';
import GastosClient from './GastosClient';

export default function GastosPage() {
  const gastos = getGastos();
  return <GastosClient gastos={gastos} />;
}
