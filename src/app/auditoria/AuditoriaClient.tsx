'use client';

import { useState, useRef } from 'react';
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
  entriesIniciales, totalInicial, usuarios, usuarioInicial,
}: {
  entriesIniciales: AuditLogEntry[];
  totalInicial: number;
  usuarios: Usuario[];
  usuarioInicial?: number;
}) {
  const [entries, setEntries] = useState(entriesIniciales);
  const [total, setTotal] = useState(totalInicial);
  const [usuarioId, setUsuarioId] = useState<number | 'todos'>(usuarioInicial ?? 'todos');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  async function cargar(offset: number, filtro: number | 'todos') {
    const request = ++requestId.current;
    setCargando(true);
    setError('');
    try {
      const res = await obtenerAuditLog(offset, filtro === 'todos' ? undefined : filtro);
      if (request !== requestId.current) return;
      if (offset === 0) setEntries(res.entries);
      else setEntries((prev) => [...prev, ...res.entries]);
      setTotal(res.total);
    } catch {
      if (request === requestId.current) setError('No se pudieron cargar los movimientos. Volvé a actualizar.');
    } finally {
      if (request === requestId.current) setCargando(false);
    }
  }

  async function handleFiltroChange(value: string) {
    const filtro = value === 'todos' ? 'todos' : Number(value);
    setUsuarioId(filtro);
    setEntries([]);
    setTotal(0);
    window.history.replaceState(null, '', filtro === 'todos' ? '/auditoria' : `/auditoria?usuario=${filtro}`);
    await cargar(0, filtro);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Auditoría</h1>
        <select
          aria-label="Filtrar movimientos por usuario"
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

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-slate-500">{cargando ? 'Cargando movimientos…' : `${entries.length} de ${total} movimientos registrados`} · {usuarioId === 'todos' ? 'Todos los usuarios' : usuarios.find(u => u.id === usuarioId)?.nombre ?? 'Usuario seleccionado'}</p>
        <button type="button" onClick={() => cargar(0, usuarioId)} disabled={cargando} className="text-blue-600 underline disabled:opacity-50">Actualizar</button>
      </div>
      <p className="text-sm text-slate-500">Incluye altas, modificaciones, eliminaciones, cobros de saldo y demás acciones registradas. La fecha indica cuándo se realizó el movimiento.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

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
                  <td className="px-4 py-2.5 text-slate-700">{usuarios.find(u => u.id === e.usuario_id)?.nombre ?? e.usuario_email ?? '—'}<p className="text-xs text-slate-400">{e.usuario_email}</p></td>
                  <td className="px-4 py-2.5"><AccionBadge accion={e.accion} /></td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {e.entidad}{e.entidad_id != null && <span className="text-slate-400"> #{e.entidad_id}</span>}
                    {e.entidad === 'gasto' && e.entidad_id != null && e.accion !== 'eliminar' && <a href={`/gastos?gasto=${e.entidad_id}`} className="block text-xs text-blue-600 underline">Ver gasto</a>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs min-w-[220px] max-w-md whitespace-normal break-words" title={e.detalle ? JSON.stringify(e.detalle) : ''}>
                    {e.detalle ? Object.entries(e.detalle).map(([key, value]) => (
                      <div key={key}><span className="font-medium">{({ monto: 'Monto', descripcion: 'Descripción', fecha: 'Fecha del gasto', categoria: 'Categoría', pagado_por: 'Pagado por', huesped: 'Huésped', saldoYo: 'Cobrado por Victoria', saldoSocio: 'Cobrado por Luis' } as Record<string, string>)[key] ?? key.replace(/_/g, ' ')}: </span>{key === 'monto' && typeof value === 'number' ? value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</div>
                    )) : '—'}
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
