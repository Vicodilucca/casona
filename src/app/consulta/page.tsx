import { getReservas } from '@/lib/db';
import ConsultaClient from './ConsultaClient';

export default function ConsultaPage() {
  const bloqueados = getReservas()
    .filter((r) => r.estado === 'confirmada')
    .map((r) => ({ inicio: r.fecha_inicio, fin: r.fecha_fin }));

  return <ConsultaClient bloqueados={bloqueados} />;
}
