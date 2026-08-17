'use client';

import { useState, useTransition } from 'react';
import type { Consulta } from '@/lib/types';
import { marcarConsultaEstado } from '@/actions/consultas';
import { useRouter } from 'next/navigation';

type Filtro = 'todas' | Consulta['estado'];

function formatDate(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateTime(s: string): string {
  const d = new Date(s);
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function diffDays(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

const ESTADO_LABELS: Record<Consulta['estado'], string> = {
  pendiente: 'Pendiente',
  contactado: 'Contactado',
  convertida: 'Convertida',
  rechazada: 'Rechazada',
};

const ESTADO_COLORS: Record<Consulta['estado'], string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  contactado: 'bg-blue-100 text-blue-800',
  convertida: 'bg-emerald-100 text-emerald-800',
  rechazada: 'bg-slate-100 text-slate-600',
};

function EstadoBadge({ estado }: { estado: Consulta['estado'] }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTADO_COLORS[estado]}`}>
      {ESTADO_LABELS[estado]}
    </span>
  );
}

function ConsultaCard({
  consulta, onEstado, puedeEditar,
}: {
  consulta: Consulta;
  onEstado: (id: number, estado: Consulta['estado']) => void;
  puedeEditar: boolean;
}) {
  const noches = diffDays(consulta.fecha_inicio, consulta.fecha_fin);
  const personas = consulta.adultos + consulta.ninos;

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 space-y-3 ${consulta.estado === 'pendiente' ? 'border-amber-200' : 'border-slate-200'}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800 text-base">{consulta.nombre}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(consulta.created_at)}</p>
        </div>
        <EstadoBadge estado={consulta.estado} />
      </div>

      {/* Dates & details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-400 font-medium">Ingreso</p>
          <p className="font-semibold text-slate-700">{formatDate(consulta.fecha_inicio)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Salida</p>
          <p className="font-semibold text-slate-700">{formatDate(consulta.fecha_fin)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Noches</p>
          <p className="font-semibold text-slate-700">{noches}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Personas</p>
          <p className="font-semibold text-slate-700">
            {consulta.adultos} adulto{consulta.adultos !== 1 ? 's' : ''}
            {consulta.ninos > 0 && ` · ${consulta.ninos} niño${consulta.ninos !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-2">
        {consulta.llegada_tarde && (
          <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2.5 py-0.5">
            🌙 Llegada tardecita
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5">
          USD {personas * 29 * noches} estimado
        </span>
      </div>

      {/* Notas */}
      {consulta.notas && (
        <div className="bg-stone-50 rounded-lg px-3 py-2 text-sm text-slate-700 border border-stone-200">
          <p className="text-xs font-medium text-slate-400 mb-0.5">Notas</p>
          {consulta.notas}
        </div>
      )}

      {/* Action buttons */}
      {puedeEditar && consulta.estado !== 'convertida' && consulta.estado !== 'rechazada' && (
        <div className="flex flex-wrap gap-2 pt-1">
          {consulta.estado !== 'contactado' && (
            <button
              onClick={() => onEstado(consulta.id, 'contactado')}
              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Marcar contactado
            </button>
          )}
          <button
            onClick={() => onEstado(consulta.id, 'convertida')}
            className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            Convertida en reserva
          </button>
          <button
            onClick={() => onEstado(consulta.id, 'rechazada')}
            className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Rechazar
          </button>
        </div>
      )}

      {/* Reopen if rejected */}
      {puedeEditar && (consulta.estado === 'rechazada' || consulta.estado === 'convertida') && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onEstado(consulta.id, 'pendiente')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Volver a pendiente
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ConsultasClient({
  consultas: initialConsultas, puedeEditar,
}: {
  consultas: Consulta[];
  puedeEditar: boolean;
}) {
  const [consultas, setConsultas] = useState<Consulta[]>(initialConsultas);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const pendienteCount = consultas.filter((c) => c.estado === 'pendiente').length;

  function handleEstado(id: number, estado: Consulta['estado']) {
    // Optimistic update
    setConsultas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado } : c))
    );
    startTransition(async () => {
      await marcarConsultaEstado(id, estado);
      router.refresh();
    });
  }

  // Sort: pending first, then by created_at desc
  const sorted = [...consultas].sort((a, b) => {
    if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1;
    if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1;
    return b.created_at.localeCompare(a.created_at);
  });

  const filtered = filtro === 'todas' ? sorted : sorted.filter((c) => c.estado === filtro);

  const FILTROS: { value: Filtro; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'contactado', label: 'Contactadas' },
    { value: 'convertida', label: 'Convertidas' },
    { value: 'rechazada', label: 'Rechazadas' },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Consultas de reserva</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {consultas.length} consulta{consultas.length !== 1 ? 's' : ''} en total
            {pendienteCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                {pendienteCount} pendiente{pendienteCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        {isPending && (
          <span className="text-xs text-slate-400 mt-1.5">Guardando…</span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {FILTROS.map(({ value, label }) => {
          const count = value === 'todas'
            ? consultas.length
            : consultas.filter((c) => c.estado === value).length;
          return (
            <button
              key={value}
              onClick={() => setFiltro(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtro === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  filtro === value ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          No hay consultas {filtro !== 'todas' ? `en estado "${ESTADO_LABELS[filtro as Consulta['estado']].toLowerCase()}"` : ''}.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((consulta) => (
            <ConsultaCard
              key={consulta.id}
              consulta={consulta}
              onEstado={handleEstado}
              puedeEditar={puedeEditar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
