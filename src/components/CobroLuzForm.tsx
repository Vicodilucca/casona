'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registrarCobroLuz } from '@/actions/reservas';
import MontoInput from './MontoInput';
import { formatARS } from '@/lib/utils';
import type { Reserva, CobroLuz } from '@/lib/types';

export default function CobroLuzForm({ reserva, initial }: { reserva: Reserva; initial?: CobroLuz }) {
  const [monto, setMonto] = useState(initial ? String(initial.monto) : '');
  const [fecha, setFecha] = useState(initial?.fecha ?? '');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <form className="card p-5 space-y-4" onSubmit={e => {
    e.preventDefault(); setError('');
    if (!monto || !fecha) { setError('Completá el importe y la fecha real del cobro.'); return; }
    startTransition(async () => {
      try {
        await registrarCobroLuz(reserva.id, Number(monto), fecha, 'socio');
        router.push(`/reservas?id=${reserva.id}`); router.refresh();
      } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar el cobro.'); }
    });
  }}>
    <p className="text-sm text-slate-600">Registrá la luz cobrada al terminar la estadía, incluso si el alojamiento ya estaba pagado. Se sumará como ingreso en la fecha que indiques.</p>
    {(reserva.monto_luz ?? 0) > 0 && <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg">Ya hay {formatARS(reserva.monto_luz ?? 0)} de luz incluidos en el saldo del alojamiento. Cargá aquí solo un cobro adicional, para no repetir ese importe.</p>}
    <div><label className="label">Importe cobrado por luz (ARS)</label><MontoInput value={monto} onChange={setMonto} required /></div>
    <div><label className="label">Fecha real del cobro</label><input type="date" className="input" value={fecha} min={reserva.fecha_fin} required onChange={e => setFecha(e.target.value)} /></div>
    <p className="text-sm text-slate-600">Recibido por: <strong>Luis</strong></p>
    {initial && <p className="text-xs text-slate-500">Al guardar se reemplaza este cobro; no se suma otra vez. Para quitarlo, ingresá 0.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <button type="submit" disabled={pending || reserva.estado !== 'confirmada'} className="btn-primary w-full">{pending ? 'Guardando…' : initial ? 'Guardar cambios del cobro' : 'Registrar ingreso por luz'}</button>
    {reserva.estado !== 'confirmada' && <p className="text-sm text-amber-700">Solo se registran cobros en reservas confirmadas.</p>}
  </form>;
}
