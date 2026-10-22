'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ComprobanteInput from './ComprobanteInput';
import { adjuntarComprobanteReserva } from '@/actions/reservas';

export default function AdjuntarComprobanteReserva({ reservaId, puedeReserva, puedeSaldo }: { reservaId: number; puedeReserva: boolean; puedeSaldo: boolean }) {
  const [file, setFile] = useState<File[]>([]);
  const [concepto, setConcepto] = useState(puedeReserva ? 'reserva' : 'saldo');
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState('');
  const router = useRouter();
  if (!puedeReserva && !puedeSaldo) return null;
  return <div className="card p-4 space-y-3">
    <label className="label">Añadir comprobante a esta reserva
      <select className="input mt-1" value={concepto} disabled={pending} onChange={e => setConcepto(e.target.value)}>
        {puedeReserva && <option value="reserva">Reserva / seña</option>}
        {puedeSaldo && <option value="saldo">Pago del saldo</option>}
      </select>
    </label>
    <ComprobanteInput label="Comprobante de transferencia" value={file} onChange={setFile} disabled={pending} />
    <button type="button" className="btn-primary" disabled={!file.length || pending} onClick={() => {
      setMensaje('');
      startTransition(async () => {
        try {
          const form = new FormData();
          for (const archivo of file) form.append(concepto, archivo);
          await adjuntarComprobanteReserva(reservaId, form);
          setFile([]); setMensaje('Comprobante guardado.'); router.refresh();
        } catch (error) { setMensaje(error instanceof Error ? error.message : 'No se pudo guardar el comprobante.'); }
      });
    }}>{pending ? 'Guardando…' : 'Guardar comprobante'}</button>
    <p className="text-xs text-slate-500">También podés adjuntarlo después de cobrar. Los importes y el estado del saldo se mantienen.</p>
    {mensaje && <p role="status" className="text-sm">{mensaje}</p>}
  </div>;
}
