'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '@/components/Modal';
import GastoForm from '@/components/GastoForm';
import { eliminarGasto } from '@/actions/gastos';
import { formatARS, formatDate } from '@/lib/utils';
import { CATEGORIAS } from '@/lib/types';
import type { Gasto } from '@/lib/types';

const MONTH_COLORS = [
  'border-l-sky-400',
  'border-l-indigo-400',
  'border-l-violet-500',
  'border-l-purple-400',
  'border-l-pink-400',
  'border-l-rose-400',
  'border-l-orange-400',
  'border-l-amber-400',
  'border-l-yellow-500',
  'border-l-lime-500',
  'border-l-green-500',
  'border-l-teal-400',
];

const MONTH_BG = [
  'bg-sky-50 text-sky-700',
  'bg-indigo-50 text-indigo-700',
  'bg-violet-50 text-violet-700',
  'bg-purple-50 text-purple-700',
  'bg-pink-50 text-pink-700',
  'bg-rose-50 text-rose-700',
  'bg-orange-50 text-orange-700',
  'bg-amber-50 text-amber-700',
  'bg-yellow-50 text-yellow-700',
  'bg-lime-50 text-lime-700',
  'bg-green-50 text-green-700',
  'bg-teal-50 text-teal-700',
];

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function monthIdx(fecha: string) {
  return parseInt(fecha.slice(5, 7)) - 1;
}

export default function GastosClient({
  gastos, puedeCrear, puedeEditar, puedeEliminar,
}: {
  gastos: Gasto[];
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}) {
  const [modal, setModal] = useState<'nuevo' | Gasto | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroPagador, setFiltroPagador] = useState('');
  const [periodoTipo, setPeriodoTipo] = useState<'mes' | 'anio'>('mes');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [, startTransition] = useTransition();

  const prefijo = periodoTipo === 'mes' ? filtroMes : filtroAnio;

  const filtrados = gastos.filter((g) => {
    const matchBusqueda =
      !busqueda ||
      (g.descripcion ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
      g.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
      (g.subcategoria ?? '').toLowerCase().includes(busqueda.toLowerCase());
    const matchCat     = !filtroCategoria || g.categoria === filtroCategoria;
    const matchTipo    = !filtroTipo      || g.tipo === filtroTipo;
    const matchPagador = !filtroPagador   || g.pagado_por === filtroPagador;
    const matchPeriodo = !prefijo         || g.fecha.startsWith(prefijo);
    return matchBusqueda && matchCat && matchTipo && matchPagador && matchPeriodo;
  });

  const totalFiltrado = filtrados.reduce((sum, g) => sum + g.monto, 0);
  const totalYo       = filtrados.filter((g) => g.pagado_por === 'yo').reduce((s, g) => s + g.monto, 0);
  const totalSocio    = filtrados.filter((g) => g.pagado_por === 'socio').reduce((s, g) => s + g.monto, 0);

  const hayFiltros = busqueda || filtroCategoria || filtroTipo || filtroPagador || prefijo;
  const limpiar = () => {
    setBusqueda(''); setFiltroCategoria(''); setFiltroTipo('');
    setFiltroPagador(''); setFiltroMes(''); setFiltroAnio('');
  };

  const anioActual = filtroAnio ? parseInt(filtroAnio) : new Date().getFullYear();
  const prevAnio = () => setFiltroAnio(String(anioActual - 1));
  const nextAnio = () => setFiltroAnio(String(anioActual + 1));

  const handleEliminar = (id: number) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    startTransition(() => eliminarGasto(id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gastos</h1>
          <p className="text-sm text-slate-500">{filtrados.length} registros</p>
        </div>
        {puedeCrear && (
          <button className="btn-primary" onClick={() => setModal('nuevo')}>
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo gasto</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap items-center">
          {/* Toggle Mes / Año */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
            <button
              onClick={() => { setPeriodoTipo('mes'); setFiltroAnio(''); }}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${periodoTipo === 'mes' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >Mes</button>
            <button
              onClick={() => { setPeriodoTipo('anio'); setFiltroMes(''); setFiltroAnio(String(new Date().getFullYear())); }}
              className={`px-3 py-1.5 text-sm font-medium border-l border-slate-200 transition-colors ${periodoTipo === 'anio' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >Año</button>
          </div>

          {/* Selector período */}
          {periodoTipo === 'mes' ? (
            <input
              type="month"
              className="input w-auto"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
            />
          ) : (
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={prevAnio} className="p-1.5 hover:bg-slate-100 text-slate-600"><ChevronLeft size={16} /></button>
              <span className="px-2 text-sm font-semibold text-slate-800 w-14 text-center">{anioActual}</span>
              <button onClick={nextAnio} className="p-1.5 hover:bg-slate-100 text-slate-600"><ChevronRight size={16} /></button>
            </div>
          )}

          <select className="input w-auto" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {Object.keys(CATEGORIAS).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input w-auto" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="ordinario">Ordinario</option>
            <option value="extraordinario">Extraordinario</option>
          </select>
          <select className="input w-auto" value={filtroPagador} onChange={(e) => setFiltroPagador(e.target.value)}>
            <option value="">Todos</option>
            <option value="yo">Pagados por mí</option>
            <option value="socio">Pagados por Luis</option>
          </select>

          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[140px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-8" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>

          {hayFiltros && (
            <button onClick={limpiar} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
              <X size={13} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Resumen */}
      {filtrados.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: totalFiltrado, color: 'text-red-700 bg-red-50 border-red-100' },
            { label: 'Pagado por mí', value: totalYo, color: 'text-slate-700 bg-slate-50 border-slate-100' },
            { label: 'Pagado por Luis', value: totalSocio, color: 'text-slate-700 bg-slate-50 border-slate-100' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-lg border px-3 py-2 ${color}`}>
              <p className="text-xs opacity-70">{label}</p>
              <p className="text-sm font-semibold">{formatARS(value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla desktop */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Descripción</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Categoría</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Subcategoría</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Pagado por</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Monto</th>
                {(puedeEditar || puedeEliminar) && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">No hay gastos</td>
                </tr>
              ) : (
                filtrados.map((g) => {
                  const mi = monthIdx(g.fecha);
                  return (
                  <tr key={g.id} className={`border-b border-slate-50 border-l-4 ${MONTH_COLORS[mi]} hover:bg-slate-50/50`}>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <span className={`inline-block text-xs font-semibold rounded px-1.5 py-0.5 mr-1.5 ${MONTH_BG[mi]}`}>{MESES[mi]}</span>
                      {formatDate(g.fecha)}
                    </td>
                    <td className="px-4 py-3 text-slate-800">{g.descripcion ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{g.categoria}</td>
                    <td className="px-4 py-3 text-slate-500">{g.subcategoria ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        g.tipo === 'ordinario' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {g.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {g.pagado_por === 'yo' ? 'Yo' : 'Luis'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-700 whitespace-nowrap">
                      {formatARS(g.monto)}
                    </td>
                    {(puedeEditar || puedeEliminar) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {puedeEditar && (
                            <button onClick={() => setModal(g)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                              <Pencil size={14} />
                            </button>
                          )}
                          {puedeEliminar && (
                            <button onClick={() => handleEliminar(g.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {filtrados.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">No hay gastos</div>
        ) : (
          filtrados.map((g) => {
            const mi = monthIdx(g.fecha);
            return (
            <div key={g.id} className={`card p-4 space-y-2 border-l-4 ${MONTH_COLORS[mi]}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{g.descripcion || g.categoria}</p>
                  <p className="text-xs text-slate-500">
                    <span className={`inline-block font-semibold rounded px-1 mr-1 ${MONTH_BG[mi]}`}>{MESES[mi]}</span>
                    {formatDate(g.fecha)} · {g.categoria}{g.subcategoria ? ` · ${g.subcategoria}` : ''}
                  </p>
                </div>
                <p className="font-bold text-red-700 whitespace-nowrap">{formatARS(g.monto)}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  g.tipo === 'ordinario' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {g.tipo}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {g.pagado_por === 'yo' ? 'Pagado por mí' : 'Pagado por Luis'}
                </span>
              </div>
              {(puedeEditar || puedeEliminar) && (
                <div className="flex gap-2 pt-1">
                  {puedeEditar && (
                    <button onClick={() => setModal(g)} className="btn-secondary text-xs py-1 flex-1">
                      <Pencil size={13} /> Editar
                    </button>
                  )}
                  {puedeEliminar && (
                    <button onClick={() => handleEliminar(g.id)} className="btn-danger text-xs py-1 flex-1">
                      <Trash2 size={13} /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
            );
          })
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'nuevo' ? 'Nuevo gasto' : 'Editar gasto'}
          onClose={() => setModal(null)}
        >
          <GastoForm
            initial={modal !== 'nuevo' ? modal : undefined}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
