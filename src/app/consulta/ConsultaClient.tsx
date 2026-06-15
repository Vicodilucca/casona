'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { enviarConsulta } from '@/actions/consultas';
import { FERIADOS } from '@/lib/feriados';

// ── Date helpers ──────────────────────────────────────────────────────────────

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
}

function diffDays(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_CORTO = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function buildWeeks(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const flat: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) flat.push(null);
  for (let d = 1; d <= daysInMonth; d++) flat.push(new Date(year, month, d));
  while (flat.length % 7 !== 0) flat.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < flat.length; i += 7) weeks.push(flat.slice(i, i + 7));
  return weeks;
}

function formatDisplay(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

// ── Calendar component ────────────────────────────────────────────────────────

function Calendar({
  bloqueados,
  startDate,
  endDate,
  onSelect,
  year,
  month,
  onPrev,
  onNext,
  canGoPrev,
}: {
  bloqueados: { inicio: string; fin: string }[];
  startDate: string | null;
  endDate: string | null;
  onSelect: (date: string) => void;
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
}) {
  const todayStr = toStr(new Date());
  const weeks = buildWeeks(year, month);

  function isBlocked(ds: string): boolean {
    return bloqueados.some((b) => ds >= b.inicio && ds <= b.fin);
  }

  function isPast(ds: string): boolean {
    return ds < todayStr;
  }

  function isInRange(ds: string): boolean {
    if (!startDate || !endDate) return false;
    return ds > startDate && ds < endDate;
  }

  function isStart(ds: string): boolean {
    return ds === startDate;
  }

  function isEnd(ds: string): boolean {
    return ds === endDate;
  }

  function isFeriado(ds: string): boolean {
    return !!FERIADOS[ds];
  }

  function getDayClass(ds: string): string {
    const blocked = isBlocked(ds);
    const past = isPast(ds);
    const start = isStart(ds);
    const end_ = isEnd(ds);
    const range = isInRange(ds);
    const today = ds === todayStr;

    if (start || end_) {
      return 'bg-emerald-600 text-white font-bold rounded-full cursor-pointer hover:bg-emerald-700';
    }
    if (range) {
      return 'bg-emerald-100 text-emerald-800 cursor-pointer hover:bg-emerald-200';
    }
    if (blocked || past) {
      return 'text-slate-300 line-through cursor-not-allowed';
    }
    if (today) {
      return 'underline font-semibold text-emerald-700 cursor-pointer hover:bg-emerald-50 rounded-full';
    }
    return 'text-slate-700 cursor-pointer hover:bg-emerald-50 rounded-full';
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className={`p-2 rounded-xl transition-colors ${canGoPrev ? 'hover:bg-stone-100 text-slate-700' : 'text-slate-200 cursor-not-allowed'}`}
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-semibold text-slate-800 text-base">
          {MESES[month]} {year}
        </h3>
        <button
          onClick={onNext}
          className="p-2 rounded-xl hover:bg-stone-100 text-slate-700 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_CORTO.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-slate-400 pb-1">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              if (!day) {
                return <div key={di} />;
              }
              const ds = toStr(day);
              const inMonth = day.getMonth() === month;
              if (!inMonth) return <div key={di} />;

              const blocked = isBlocked(ds) || isPast(ds);
              const feriado = isFeriado(ds);

              return (
                <div
                  key={ds}
                  className="relative flex flex-col items-center"
                  title={feriado ? FERIADOS[ds] : undefined}
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center text-sm transition-colors ${getDayClass(ds)}`}
                    onClick={() => !blocked && onSelect(ds)}
                  >
                    {day.getDate()}
                  </div>
                  {feriado && !isBlocked(ds) && (
                    <span className="w-1 h-1 rounded-full bg-red-400 -mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
          Seleccionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 inline-block" />
          En tu rango
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-100 inline-block line-through text-slate-300" />
          Ocupado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
          Feriado
        </span>
      </div>
    </div>
  );
}

// ── Counter component ─────────────────────────────────────────────────────────

function Counter({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-300 text-slate-700 font-bold text-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        −
      </button>
      <span className="w-6 text-center font-semibold text-slate-800">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-300 text-slate-700 font-bold text-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        +
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ConsultaClient({
  bloqueados,
}: {
  bloqueados: { inicio: string; fin: string }[];
}) {
  const today = new Date();
  const todayStr = toStr(today);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [adultos, setAdultos] = useState(2);
  const [ninos, setNinos] = useState(0);
  const [llegadaTarde, setLlegadaTarde] = useState(false);
  const [notas, setNotas] = useState('');

  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGoPrev =
    calYear > today.getFullYear() ||
    (calYear === today.getFullYear() && calMonth > today.getMonth());

  function prevMonth() {
    if (!canGoPrev) return;
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  }

  function hasBlockedInRange(from: string, to: string): boolean {
    return bloqueados.some((b) => b.inicio <= to && b.fin >= from);
  }

  const handleDaySelect = useCallback((ds: string) => {
    setWarning(null);
    if (!startDate || (startDate && endDate)) {
      // Start fresh selection
      setStartDate(ds);
      setEndDate(null);
    } else {
      // We have start, now pick end
      if (ds < startDate) {
        // Clicked before start — restart
        setStartDate(ds);
        setEndDate(null);
        return;
      }
      if (ds === startDate) {
        setStartDate(null);
        setEndDate(null);
        return;
      }
      // Check if range is valid
      if (hasBlockedInRange(startDate, ds)) {
        setWarning('El rango seleccionado contiene fechas ocupadas. Por favor elegí otras fechas.');
        setStartDate(ds);
        setEndDate(null);
        return;
      }
      setEndDate(ds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, bloqueados]);

  const noches = startDate && endDate ? diffDays(startDate, endDate) : 0;
  const personas = adultos + ninos;
  const precioEstimado = personas > 0 && noches > 0 ? personas * 29 * noches : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError('Por favor seleccioná las fechas en el calendario.');
      return;
    }
    if (!nombre.trim()) {
      setError('Por favor ingresá tu nombre y apellido.');
      return;
    }
    if (adultos < 1) {
      setError('Debe haber al menos 1 adulto.');
      return;
    }

    setSubmitting(true);
    try {
      await enviarConsulta({
        nombre: nombre.trim(),
        adultos,
        ninos,
        fecha_inicio: startDate,
        fecha_fin: endDate,
        llegada_tarde: llegadaTarde,
        notas: notas.trim() || null,
        estado: 'pendiente',
      });
      setSuccess(true);
    } catch {
      setError('Hubo un error al enviar la consulta. Por favor intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setStartDate(null);
    setEndDate(null);
    setNombre('');
    setAdultos(2);
    setNinos(0);
    setLlegadaTarde(false);
    setNotas('');
    setWarning(null);
    setError(null);
    setSuccess(false);
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 max-w-md w-full text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 size={56} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">¡Consulta enviada!</h2>
          <p className="text-slate-600 leading-relaxed">
            Nos comunicaremos a la brevedad para confirmar tu reserva.
          </p>
          <button
            onClick={handleReset}
            className="mt-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
          >
            Hacer otra consulta
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5 text-center">
          <h1 className="text-2xl font-bold text-slate-800">🏡 La Casona de Río Grande</h1>
          <p className="text-slate-500 mt-1 text-sm">Consulta de disponibilidad</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Warning toast */}
        {warning && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
            <span>{warning}</span>
          </div>
        )}

        {/* Calendar */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">
            Seleccioná las fechas de tu estadía
          </p>
          <Calendar
            bloqueados={bloqueados}
            startDate={startDate}
            endDate={endDate}
            onSelect={handleDaySelect}
            year={calYear}
            month={calMonth}
            onPrev={prevMonth}
            onNext={nextMonth}
            canGoPrev={canGoPrev}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 space-y-5">

          {/* Date display */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Fecha de ingreso</label>
              <div className={`px-3 py-2.5 rounded-xl border text-sm ${startDate ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-medium' : 'border-stone-200 text-slate-400 italic'}`}>
                {startDate ? formatDisplay(startDate) : 'Seleccioná en el calendario'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Fecha de salida</label>
              <div className={`px-3 py-2.5 rounded-xl border text-sm ${endDate ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-medium' : 'border-stone-200 text-slate-400 italic'}`}>
                {endDate ? formatDisplay(endDate) : 'Seleccioná en el calendario'}
              </div>
            </div>
          </div>

          {noches > 0 && (
            <p className="text-sm text-slate-600 -mt-2">
              <span className="font-semibold text-emerald-700">{noches}</span>{' '}
              {noches === 1 ? 'noche' : 'noches'}
            </p>
          )}

          {/* Llegada tarde */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={llegadaTarde}
                onChange={(e) => setLlegadaTarde(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${llegadaTarde ? 'bg-emerald-600 border-emerald-600' : 'border-stone-300 group-hover:border-emerald-400'}`}>
                {llegadaTarde && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-700">Deseo llegar la tardecita del día anterior</span>
              <p className="text-xs text-slate-400 mt-0.5">Disponible sin cargo adicional — sujeto a disponibilidad</p>
            </div>
          </label>

          <div className="border-t border-stone-100" />

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre y apellido <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>

          {/* Adultos / Niños */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Adultos</label>
              <Counter value={adultos} onChange={setAdultos} min={1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Niños
                <span className="ml-1 text-xs font-normal text-slate-400">(menores de 3 sin cargo)</span>
              </label>
              <Counter value={ninos} onChange={setNinos} min={0} />
            </div>
          </div>

          {/* Price estimate */}
          {startDate && endDate && noches > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-emerald-800 mb-1">Estimación de precio</p>
              <p className="text-lg font-bold text-emerald-700">
                {personas} persona{personas !== 1 ? 's' : ''} × USD 29 × {noches} noche{noches !== 1 ? 's' : ''} = <span className="text-xl">USD {precioEstimado}</span>
              </p>
              <p className="text-xs text-emerald-600 mt-1.5">
                El monto definitivo se confirma al acordar la reserva.
              </p>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notas o preguntas <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="¿Tenés alguna pregunta o comentario especial?"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl transition-colors text-base shadow-sm disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando...' : 'Enviar consulta'}
          </button>
        </form>
      </div>
    </div>
  );
}
