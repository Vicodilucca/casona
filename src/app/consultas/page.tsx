import { getConsultas } from '@/lib/db';
import ConsultasClient from './ConsultasClient';

export default async function ConsultasPage() {
  const consultas = await getConsultas();
  return <ConsultasClient consultas={consultas} />;
}
