'use client';

import { useState } from 'react';
import { obtenerAuditLog } from '@/actions/auditoria';
import type { AuditLogEntry, Usuario } from '@/lib/types';

function formatDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const ACCION_COLORS: Record<string, string> = {
  crear: 'bg-emerald-100 text-emerald-700',
  editar: 'bg-blue-100 text-blue-700',
  eliminar: 'bg-red-100 text-red-700',
  login: 'bg-slate-100 text-slate-600',
  login_fallido: 'bg-amber-100 text-amber-700',
  activar: 'bg-emerald-100 text-emerald-700',
  desactivar: 'bg-slate-200 text-slate-600',
  pagar_saldo: 'bg-purple-100 text-purple-700',
  cambiar_estado: 'bg-blue-100 text-blue-700',
  resetear_password: 'bg-amber-100 text-amber-700',
  cambiar_password_propia: 'bg-amber-100 text-amber-700',
};

function AccionBadge({ accion }: { accion: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${ACCION_COLORS[accion] ?? 'bg-slate-100 text-slate-600'}`}>
      {accion.replace(/_/g, ' ')}
    </span>
  );
}

export default function AuditoriaClient({
  entriesIniciales, totalInicial, usuarios,
}: {
  entriesIniciales: AuditLogEntry[];
  totalInicial: number;
  usuarios: Usuario[];
}) {
  const [entries, setEntries] = useState(entriesIniciales);
  const [total, setTotal] = useState(totalInicial);
  const [usuarioId, setUsuarioId] = useState<number | 'todos'>('todos');
  const [cargando, setCargando] = useState(false);

  async function cargar(offset: number, filtro: number | 'todos') {
    setCargando(true);
    try {
      const res = await obtenerAuditLog(offset, filtro === 'todos' ? undefined : filtro);
      if (offset === 0) setEntries(res.entries);
      else setEntries((prev) => [...prev, ...res.entries]);
      setTotal(res.total);
    } finally {
      setCargando(false);
    }
  }

  async function handleFiltroChange(value: string) {
    const filtro = value === 'todos' ? 'todos' : Number(value);
    setUsuarioId(filtro);
    await cargar(0, filtro);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Auditoría</h1>
        <select
          value={usuarioId}
          onChange={(e) => handleFiltroChange(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos los usuarios</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nombre}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5">Fecha</th>
                <th className="text-left px-4 py-2.5">Usuario</th>
                <th className="text-left px-4 py-2.5">Acción</th>
                <th className="text-left px-4 py-2.5">Entidad</th>
                <th className="text-left px-4 py-2.5">Detalle</th>
                <th className="text-left px-4 py-2.5">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(e.created_at)}</td>
                  <td className="px-4 py-2.5 text-slate-700">{e.usuario_email ?? '—'}</td>
                  <td className="px-4 py-2.5"><AccionBadge accion={e.accion} /></td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {e.entidad}{e.entidad_id != null && <span className="text-slate-400"> #{e.entidad_id}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs max-w-xs truncate" title={e.detalle ? JSON.stringify(e.detalle) : ''}>
                    {e.detalle ? JSON.stringify(e.detalle) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{e.ip ?? '—'}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Sin eventos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {entries.length < total && (
        <div className="flex justify-center">
          <button
            onClick={() => cargar(entries.length, usuarioId)}
            disabled={cargando}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 px-4 py-2"
          >
            {cargando ? 'Cargando...' : `Cargar más (${entries.length}/${total})`}
          </button>
        </div>
      )}
    </div>
  );
}
