'use client';

interface Props {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
}

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTOS = ['00', '15', '30', '45'];

export default function HoraInput({ value, onChange }: Props) {
  const [hh, mm] = (value || '00:00').split(':');

  const setHH = (h: string) => onChange(`${h}:${mm ?? '00'}`);
  const setMM = (m: string) => onChange(`${hh ?? '00'}:${m}`);

  return (
    <div className="flex gap-1.5 items-center">
      <select className="input flex-1 text-center" value={hh} onChange={(e) => setHH(e.target.value)}>
        {HORAS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-slate-400 font-bold text-sm select-none">:</span>
      <select className="input flex-1 text-center" value={mm} onChange={(e) => setMM(e.target.value)}>
        {MINUTOS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <span className="text-xs text-slate-400 select-none whitespace-nowrap">hs</span>
    </div>
  );
}
