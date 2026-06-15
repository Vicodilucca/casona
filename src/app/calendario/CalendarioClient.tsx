'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Reserva } from '@/lib/types';
import { formatDate, formatARS } from '@/lib/utils';
import { FERIADOS } from '@/lib/feriados';

const DIAS  = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_FULL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const flat: Date[] = [];
  for (let i = offset; i > 0; i--) flat.push(new Date(year, month, 1 - i));
  for (let d = 1; d <= daysInMonth; d++) flat.push(new Date(year, month, d));
  let extra = 1;
  while (flat.length % 7 !== 0) flat.push(new Date(year, month + 1, extra++));
  const weeks: Date[][] = [];
  for (let i = 0; i < flat.length; i += 7) weeks.push(flat.slice(i, i + 7));
  return weeks;
}

const ESTILO_PAGADO   = { bar: 'bg-emerald-500 text-white',   dot: 'bg-emerald-500', mini: 'bg-emerald-400' };
const ESTILO_PENDIENTE = { bar: 'bg-amber-400 text-amber-900', dot: 'bg-amber-400',   mini: 'bg-amber-400'   };

function getEstilo(r: Reserva) {
  return (!r.saldo_pagado && (r.saldo_pendiente ?? 0) > 0) ? ESTILO_PENDIENTE : ESTILO_PAGADO;
}

function getSpans(week: Date[], reservas: Reserva[]) {
  const ws = toStr(week[0]);
  const we = toStr(week[6]);
  return reservas
    .filter((r) => r.fecha_inicio <= we && r.fecha_fin >= ws)
    .map((r) => {
      const cs = r.fecha_inicio < ws ? ws : r.fecha_inicio;
      const ce = r.fecha_fin > we ? we : r.fecha_fin;
      const startCol = week.findIndex((d) => toStr(d) === cs);
      const endCol   = week.findIndex((d) => toStr(d) === ce);
      return {
        r,
        startCol: startCol === -1 ? 0 : startCol,
        endCol:   endCol   === -1 ? 6 : endCol,
        showName: r.fecha_inicio >= ws,
        roundL:   r.fecha_inicio >= ws,
        roundR:   r.fecha_fin    <= we,
      };
    });
}

function reservaEnDia(dateStr: string, reservas: Reserva[]): Reserva | null {
  return reservas.find((r) => r.fecha_inicio <= dateStr && r.fecha_fin >= dateStr) ?? null;
}

// ── Vista mensual ─────────────────────────────────────────────────────────────

function VisMes({
  year, month, reservas, todayStr,
  onPrev, onNext,
}: {
  year: number; month: number; reservas: Reserva[]; todayStr: string;
  onPrev: () => void; onNext: () => void;
}) {
  const weeks = buildWeeks(year, month);

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd   = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;
  const mesReservas = reservas
    .filter((r) => r.fecha_inicio <= monthEnd && r.fecha_fin >= monthStart)
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  const mesFeriados = Object.entries(FERIADOS)
    .filter(([fecha]) => fecha >= monthStart && fecha <= monthEnd)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-slate-800">{MESES[month]} {year}</h2>
          <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DIAS_FULL.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-slate-400 pb-1">{d}</div>
          ))}
        </div>

        <div>
          {weeks.map((week, wi) => {
            const spans = getSpans(week, reservas);
            return (
              <div key={wi}>
                <div className="grid grid-cols-7">
                  {week.map((day) => {
                    const ds = toStr(day);
                    const inMonth = day.getMonth() === month;
                    const isToday = ds === todayStr;
                    return (
                      <div key={ds} className="h-8 flex flex-col items-center justify-center" title={inMonth && FERIADOS[ds] ? FERIADOS[ds] : undefined}>
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium
                          ${isToday ? 'bg-blue-600 text-white' :
                            inMonth && FERIADOS[ds] ? 'text-red-600 font-bold' :
                            inMonth ? 'text-slate-800' : 'text-slate-300'}`}>
                          {day.getDate()}
                        </span>
                        {inMonth && FERIADOS[ds] && !isToday && (
                          <span className="w-1 h-1 rounded-full bg-red-400 -mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="relative h-6 mb-1">
                  {spans.map(({ r, startCol, endCol, showName, roundL, roundR }) => {
                    const st = getEstilo(r);
                    return (
                      <Link
                        key={r.id}
                        href={`/reservas?id=${r.id}`}
                        title={`${r.huesped} · ${formatDate(r.fecha_inicio)} → ${formatDate(r.fecha_fin)}`}
                        className={`absolute top-0.5 bottom-0.5 flex items-center px-2 overflow-hidden
                          ${st.bar}
                          ${roundL ? 'rounded-l-md' : ''}
                          ${roundR ? 'rounded-r-md' : ''}`}
                        style={{
                          left:  `${(startCol / 7) * 100}%`,
                          right: `${((6 - endCol) / 7) * 100}%`,
                        }}
                      >
                        {showName && (
                          <span className="text-[10px] font-semibold truncate leading-none">
                            {r.huesped.split(' ')[0]}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {mesReservas.length > 0 ? (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">
            Reservas de {MESES[month]} ({mesReservas.length})
          </h3>
          <div className="divide-y divide-slate-50">
            {mesReservas.map((r) => {
              const st = getEstilo(r);
              return (
                <div key={r.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{r.huesped}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r.plataforma === 'airbnb' ? 'Airbnb' : 'Particular'}
                        {' · '}{r.adultos} adulto{r.adultos !== 1 ? 's' : ''}
                        {r.ninos > 0 ? ` · ${r.ninos} niño${r.ninos !== 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-slate-800 text-sm">{formatARS(r.monto)}</p>
                    {!r.saldo_pagado && (r.saldo_pendiente ?? 0) > 0 ? (
                      <span className="text-[10px] font-medium text-amber-600">
                        Saldo {formatARS(r.saldo_pendiente ?? 0)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-emerald-600">Cobrado</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-400 py-6">
          No hay reservas en {MESES[month]} {year}
        </p>
      )}

      {mesFeriados.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">Feriados de {MESES[month]}</h3>
          <div className="space-y-1.5">
            {mesFeriados.map(([fecha, nombre]) => {
              const [, , dd] = fecha.split('-');
              return (
                <div key={fecha} className="flex items-center gap-3 text-sm">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-600 font-bold text-xs shrink-0">
                    {parseInt(dd)}
                  </span>
                  <span className="text-slate-700">{nombre}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ── Mini-mes para vista anual ─────────────────────────────────────────────────

function MiniMes({
  year, month, reservas, todayStr,
  onSelect,
}: {
  year: number; month: number; reservas: Reserva[]; todayStr: string;
  onSelect: () => void;
}) {
  const weeks = buildWeeks(year, month);
  return (
    <div
      className="card p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      <p className="text-xs font-semibold text-slate-700 mb-2 text-center">
        {MESES_CORTO[month]}
      </p>
      <div className="grid grid-cols-7 gap-y-px">
        {DIAS.map((d) => (
          <div key={d} className="text-center text-[9px] text-slate-300 pb-0.5">{d}</div>
        ))}
        {weeks.flat().map((day) => {
          const ds     = toStr(day);
          const inMonth = day.getMonth() === month;
          const isToday = ds === todayStr;
          const r       = inMonth ? reservaEnDia(ds, reservas) : null;
          const st      = r ? getEstilo(r) : null;
          const esFeriado = inMonth && !!FERIADOS[ds];

          return (
            <div key={ds} className="flex items-center justify-center" style={{ height: 16 }}>
              <span className={`
                w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-medium leading-none
                ${!inMonth   ? 'text-transparent' : ''}
                ${isToday    ? 'ring-1 ring-blue-500 text-blue-600 font-bold' : ''}
                ${st && !isToday ? `${st.mini} text-white` : ''}
                ${inMonth && !st && !isToday && esFeriado ? 'text-red-500' : ''}
                ${inMonth && !st && !isToday && !esFeriado ? 'text-slate-600' : ''}
              `}>
                {inMonth ? day.getDate() : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista anual ───────────────────────────────────────────────────────────────

function VisAnio({
  year, reservas, todayStr,
  onPrev, onNext,
  onSelectMonth,
}: {
  year: number; reservas: Reserva[]; todayStr: string;
  onPrev: () => void; onNext: () => void;
  onSelectMonth: (m: number) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-semibold text-slate-800 text-base">{year}</h2>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }, (_, m) => (
          <MiniMes
            key={m}
            year={year}
            month={m}
            reservas={reservas}
            todayStr={todayStr}
            onSelect={() => onSelectMonth(m)}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Tocá un mes para ver el detalle
      </p>
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CalendarioClient({ reservas }: { reservas: Reserva[] }) {
  const today = new Date();
  const [vista, setVista]  = useState<'mes' | 'anio'>('mes');
  const [year, setYear]    = useState(today.getFullYear());
  const [month, setMonth]  = useState(today.getMonth());
  const todayStr = toStr(today);

  const prevMes  = () => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); };
  const nextMes  = () => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); };
  const prevAnio = () => setYear((y) => y - 1);
  const nextAnio = () => setYear((y) => y + 1);

  const handleSelectMonth = (m: number) => {
    setMonth(m);
    setVista('mes');
  };

  return (
    <div className="space-y-5">
      {/* Header + toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Calendario</h1>
          <p className="text-sm text-slate-500">Vista de reservas</p>
        </div>

        <div className="flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 mt-0.5">
          <button
            onClick={() => setVista('mes')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors
              ${vista === 'mes' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Mes
          </button>
          <button
            onClick={() => setVista('anio')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-slate-200
              ${vista === 'anio' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Año
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Hospedado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />Saldo pendiente</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Feriado nacional</span>
      </div>

      {vista === 'mes' ? (
        <VisMes
          year={year}
          month={month}
          reservas={reservas}
          todayStr={todayStr}
          onPrev={prevMes}
          onNext={nextMes}
        />
      ) : (
        <VisAnio
          year={year}
          reservas={reservas}
          todayStr={todayStr}
          onPrev={prevAnio}
          onNext={nextAnio}
          onSelectMonth={handleSelectMonth}
        />
      )}
    </div>
  );
}
