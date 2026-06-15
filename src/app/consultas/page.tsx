import { getConsultas } from '@/lib/db';
import ConsultasClient from './ConsultasClient';

export default function ConsultasPage() {
  const consultas = getConsultas();
  return <ConsultasClient consultas={consultas} />;
}
