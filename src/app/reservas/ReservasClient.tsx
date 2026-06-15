'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Users, PawPrint, CheckCircle2, Circle, RefreshCw, FileText, ScrollText } from 'lucide-react';
import Modal from '@/components/Modal';
import ReservaForm from '@/components/ReservaForm';
import MontoInput from '@/components/MontoInput';
import { eliminarReserva, pagarSaldo } from '@/actions/reservas';
import { formatARS, formatDate, getNights } from '@/lib/utils';
import { SOCIOS } from '@/lib/types';
import type { Reserva } from '@/lib/types';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTH_BG = [
  'bg-sky-100 text-sky-700',
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-rose-100 text-rose-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-700',
  'bg-yellow-100 text-yellow-700',
  'bg-lime-100 text-lime-700',
  'bg-green-100 text-green-700',
  'bg-teal-100 text-teal-700',
];

const plataformaBadge: Record<string, string> = {
  airbnb: 'bg-orange-50 text-orange-700',
  particular: 'bg-blue-50 text-blue-700',
};

export default function ReservasClient({ reservas, highlightId }: { reservas: Reserva[]; highlightId?: number }) {
  const [modal, setModal] = useState<'nueva' | Reserva | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [, startTransition] = useTransition();
  const highlightRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId]);

  const filtradas = reservas.filter((r) => {
    const matchBusqueda =
      !busqueda ||
      r.huesped.toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.dni ?? '').includes(busqueda);
    const matchEstado = !filtroEstado || r.estado === filtroEstado;
    
    // Parse the date carefully, assuming format YYYY-MM-DD
    const dateParts = r.fecha_inicio.split('-');
    const year = dateParts[0];
    const month = parseInt(dateParts[1], 10).toString();
    
    const matchAnio = !filtroAnio || year === filtroAnio;
    const matchMes = !filtroMes || month === filtroMes;

    return matchBusqueda && matchEstado && matchAnio && matchMes;
  });

  const years = Array.from(new Set(reservas.map(r => r.fecha_inicio.split('-')[0]))).sort((a, b) => b.localeCompare(a));
  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const totalFiltrado = filtradas
    .filter((r) => r.estado === 'confirmada')
    .reduce((sum, r) => sum + r.monto, 0);

  const handleEliminar = (id: number) => {
    if (!confirm('¿Eliminar esta reserva?')) return;
    startTransition(() => eliminarReserva(id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reservas</h1>
          <p className="text-sm text-slate-500">{filtradas.length} reservas</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('nueva')}>
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva reserva</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-8"
            placeholder="Buscar nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={filtroAnio}
          onChange={(e) => setFiltroAnio(e.target.value)}
        >
          <option value="">Todos los años</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
        >
          <option value="">Todos los meses</option>
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="confirmada">Confirmada</option>
          <option value="pendiente">Pendiente</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {filtradas.length > 0 && (
        <div className="text-sm text-slate-600 bg-green-50 border border-green-100 rounded-lg px-4 py-2">
          Total confirmadas: <span className="font-semibold text-green-700">{formatARS(totalFiltrado)}</span>
        </div>
      )}

      {/* Tabla desktop */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-center px-2 py-3 font-semibold text-slate-600 text-xs w-14">Mes</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Huésped</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Check-in</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Check-out</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Días</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Ocup.</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Plataforma</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Cobré yo</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Cobró socio</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">No hay reservas</td>
                </tr>
              ) : (
                filtradas.map((r) => {
                  const noches = getNights(r.fecha_inicio, r.fecha_fin);
                  const ocupantes = (r.adultos ?? 1) + (r.ninos ?? 0);
                  const tieneSaldo = (r.saldo_pendiente ?? 0) > 0 && !r.saldo_pagado;
                  const estadiaCompleta = r.saldo_pagado && r.monto > 0;
                  const mesIdx = parseInt(r.fecha_inicio.slice(5, 7)) - 1;
                  const anio = r.fecha_inicio.slice(0, 4);
                  return (
                    <tr
                      key={r.id}
                      ref={r.id === highlightId ? (el) => { highlightRef.current = el; } : undefined}
                      className={`border-b border-slate-100 ${
                        r.id === highlightId ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/40' :
                        tieneSaldo ? 'bg-red-50/50' : estadiaCompleta ? 'bg-green-50/50' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-2 py-3 text-center whitespace-nowrap">
                        <span className={`inline-block text-xs font-bold rounded px-1.5 py-0.5 ${MONTH_BG[mesIdx]}`}>
                          {MESES[mesIdx]}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">{anio}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-medium ${
                          tieneSaldo ? 'text-red-700' : estadiaCompleta ? 'text-green-700' : 'text-slate-800'
                        }`}>{r.huesped}</p>
                        {r.dni && <p className="text-xs text-slate-400">DNI {r.dni}</p>}
                        {tieneSaldo && (
                          <p className="text-xs font-semibold text-red-500 mt-0.5">● Saldo pendiente: {formatARS(r.saldo_pendiente ?? 0)}</p>
                        )}
                        {estadiaCompleta && (
                          <p className="text-xs font-semibold text-green-600 mt-0.5">✓ Estadía completada</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{formatDate(r.fecha_inicio)}</p>
                        {r.hora_inicio && <p className="text-xs text-slate-400">{r.hora_inicio} hs</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{formatDate(r.fecha_fin)}</p>
                        {r.hora_fin && <p className="text-xs text-slate-400">{r.hora_fin} hs</p>}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">{noches}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-500 text-xs">
                          <Users size={12} />
                          <span>{ocupantes}</span>
                          {(r.mascotas ?? 0) > 0 && (
                            <>
                              <PawPrint size={12} className="ml-1 text-amber-500" />
                              <span>{r.mascotas}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plataformaBadge[r.plataforma]}`}>
                          {r.plataforma === 'airbnb' ? 'Airbnb' : 'Particular'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-green-700 font-medium">
                        {formatARS((r.monto_yo ?? 0) + (estadiaCompleta ? (r.saldo_yo ?? 0) : 0))}
                        {estadiaCompleta && (
                          <p className="text-xs text-green-400 font-normal">
                            {(r.monto_yo ?? 0) > 0 && <span>Parcial {formatARS(r.monto_yo ?? 0)}</span>}
                            {(r.saldo_yo ?? 0) > 0 && <span>{(r.monto_yo ?? 0) > 0 ? ' + ' : ''}Saldo {formatARS(r.saldo_yo ?? 0)}</span>}
                            {(r.monto_yo ?? 0) === 0 && (r.saldo_yo ?? 0) === 0 && <span className="text-slate-300">—</span>}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-700 font-medium">
                        {formatARS((r.monto_socio ?? 0) + (estadiaCompleta ? (r.saldo_socio ?? 0) : 0))}
                        {estadiaCompleta && (
                          <p className="text-xs text-blue-400 font-normal">
                            {(r.monto_socio ?? 0) > 0 && <span>Parcial {formatARS(r.monto_socio ?? 0)}</span>}
                            {(() => {
                              const luz = r.monto_luz ?? 0;
                              const saldoBase = (r.saldo_socio ?? 0) - luz;
                              const sep = (r.monto_socio ?? 0) > 0 ? ' + ' : '';
                              return <>
                                {saldoBase > 0 && <span>{sep}Saldo {formatARS(saldoBase)}</span>}
                                {luz > 0 && <span className="text-yellow-500"> ⚡ Luz {formatARS(luz)}</span>}
                              </>;
                            })()}
                            {(r.monto_socio ?? 0) === 0 && (r.saldo_socio ?? 0) === 0 && <span className="text-slate-300">—</span>}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {r.monto_usd != null
                          ? <span className="text-blue-700">USD {r.monto_usd.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                          : formatARS(r.monto)
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <a href={`/reservas/${r.id}/resumen`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors" title="Ver resumen PDF">
                            <FileText size={14} />
                          </a>
                          {r.plataforma === 'particular' && r.saldo_pagado && (
                            <a href={`/reservas/${r.id}/contrato`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors" title="Ver contrato PDF">
                              <ScrollText size={14} />
                            </a>
                          )}
                          <button onClick={() => setModal(r)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleEliminar(r.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
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
        {filtradas.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">No hay reservas</div>
        ) : (
          filtradas.map((r) => {
            const noches = getNights(r.fecha_inicio, r.fecha_fin);
            const ocupantes = (r.adultos ?? 1) + (r.ninos ?? 0);
            const tieneSaldo = (r.saldo_pendiente ?? 0) > 0 && !r.saldo_pagado;
            const estadiaCompleta = (r.saldo_pendiente ?? 0) > 0 && r.saldo_pagado;
            return (
              <div
                key={r.id}
                ref={r.id === highlightId ? (el) => { highlightRef.current = el; } : undefined}
                className={`card p-4 space-y-3 border-l-4 ${
                  r.id === highlightId ? 'border-l-blue-400 ring-2 ring-blue-300' :
                  tieneSaldo    ? 'border-l-red-400   bg-red-50/30'   :
                  estadiaCompleta ? 'border-l-green-400 bg-green-50/30' :
                  'border-l-transparent'
                }`}
              >
                {/* Encabezado */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-semibold ${
                      tieneSaldo ? 'text-red-700' : estadiaCompleta ? 'text-green-700' : 'text-slate-800'
                    }`}>
                      {r.huesped}
                    </p>
                    {r.dni && <p className="text-xs text-slate-400">DNI {r.dni}</p>}
                    {r.direccion && <p className="text-xs text-slate-400">{r.direccion}</p>}
                  </div>
                  <p className="font-bold text-base">
                    {r.monto_usd != null
                      ? <span className="text-blue-700">USD {r.monto_usd.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                      : <span className="text-slate-800">{formatARS(r.monto)}</span>
                    }
                  </p>
                </div>

                {/* Estadía */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-slate-400 mb-0.5">Check-in</p>
                    <p className="font-semibold text-slate-700">{formatDate(r.fecha_inicio)}</p>
                    {r.hora_inicio && <p className="text-slate-500">{r.hora_inicio} hs</p>}
                  </div>
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-slate-400 mb-0.5">Check-out</p>
                    <p className="font-semibold text-slate-700">{formatDate(r.fecha_fin)}</p>
                    {r.hora_fin && <p className="text-slate-500">{r.hora_fin} hs</p>}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
                    {noches} {noches === 1 ? 'día' : 'días'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plataformaBadge[r.plataforma]}`}>
                    {r.plataforma === 'airbnb' ? 'Airbnb' : 'Particular'}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Users size={11} /> {ocupantes}
                    {(r.mascotas ?? 0) > 0 && (
                      <><PawPrint size={11} className="ml-1 text-amber-500" /> {r.mascotas}</>
                    )}
                  </span>
                </div>

                {/* Cobros */}
                {estadiaCompleta ? (
                  <div className="space-y-1.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-50 rounded-lg px-2 py-1.5">
                        <p className="text-green-600 font-medium">Cobré yo · total</p>
                        <p className="text-green-800 font-bold">{formatARS((r.monto_yo ?? 0) + (r.saldo_yo ?? 0))}</p>
                        <p className="text-green-500 mt-0.5">Parcial {formatARS(r.monto_yo ?? 0)} + Saldo {formatARS(r.saldo_yo ?? 0)}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg px-2 py-1.5">
                        <p className="text-blue-600 font-medium">Cobró socio · total</p>
                        <p className="text-blue-800 font-bold">{formatARS((r.monto_socio ?? 0) + (r.saldo_socio ?? 0))}</p>
                        <p className="text-blue-500 mt-0.5">Parcial {formatARS(r.monto_socio ?? 0)} + Saldo {formatARS(r.saldo_socio ?? 0)}</p>
                      </div>
                    </div>
                    {r.fecha_pago_saldo && (
                      <p className="text-slate-400 text-center">
                        Saldo cobrado el {r.fecha_pago_saldo.split('T')[0].split('-').reverse().join('/')}
                        {r.cotizacion_saldo && <span> · cotiz. ${r.cotizacion_saldo.toLocaleString('es-AR')}/USD</span>}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-50 rounded-lg px-2 py-1.5">
                      <p className="text-green-600 font-medium">Cobré yo</p>
                      <p className="text-green-800 font-bold">{formatARS(r.monto_yo ?? 0)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg px-2 py-1.5">
                      <p className="text-blue-600 font-medium">Cobró socio</p>
                      <p className="text-blue-800 font-bold">{formatARS(r.monto_socio ?? 0)}</p>
                    </div>
                  </div>
                )}

                {r.notas && <p className="text-xs text-slate-500 italic">{r.notas}</p>}

                {/* Saldo toggle — visible si tiene saldo (pendiente o ya pagado) */}
                {(r.saldo_pendiente ?? 0) > 0 && (
                  <SaldoToggle reserva={r} />
                )}


                <div className="flex gap-2 pt-1">
                  <a href={`/reservas/${r.id}/resumen`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1 flex-1 flex items-center justify-center gap-1">
                    <FileText size={13} /> Resumen
                  </a>
                  {r.plataforma === 'particular' && r.saldo_pagado && (
                    <a href={`/reservas/${r.id}/contrato`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1 flex-1 flex items-center justify-center gap-1 text-violet-600 hover:text-violet-700">
                      <ScrollText size={13} /> Contrato
                    </a>
                  )}
                  <button onClick={() => setModal(r)} className="btn-secondary text-xs py-1 flex-1">
                    <Pencil size={13} /> Editar
                  </button>
                  <button onClick={() => handleEliminar(r.id)} className="btn-danger text-xs py-1 flex-1">
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'nueva' ? 'Nueva reserva' : 'Editar reserva'}
          onClose={() => setModal(null)}
        >
          <ReservaForm
            initial={modal !== 'nueva' ? modal : undefined}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function SaldoToggle({ reserva: r }: { reserva: Reserva }) {
  const [confirming, setConfirming] = useState(false);
  const [, startTransition] = useTransition();
  const hoy = new Date().toISOString().split('T')[0];
  const [fechaCobro, setFechaCobro] = useState(hoy);
  const [cotizacionSaldo, setCotizacionSaldo] = useState('');
  const [saldoYo, setSaldoYo] = useState('');
  const [saldoSocio, setSaldoSocio] = useState('');

  const cotizacionVal  = parseFloat(cotizacionSaldo) || 0;
  const saldoYoVal     = parseFloat(saldoYo) || 0;
  const saldoSocioVal  = parseFloat(saldoSocio) || 0;
  const totalSaldo     = saldoYoVal + saldoSocioVal;

  const cobradoParcial = (r.monto_yo ?? 0) + (r.monto_socio ?? 0);
  const cobradoUsd     = r.cotizacion && r.cotizacion > 0 ? cobradoParcial / r.cotizacion : null;
  const saldoUsd       = r.monto_usd && cobradoUsd != null ? r.monto_usd - cobradoUsd : null;
  const saldoArsCalc   = saldoUsd != null && cotizacionVal > 0 ? Math.round(saldoUsd * cotizacionVal) : 0;
  const saldoYoCalc    = Math.round(saldoArsCalc * SOCIOS.yo.porcentaje);
  const saldoSocioCalc = Math.round(saldoArsCalc * SOCIOS.socio.porcentaje);
  const puedeCalcular  = saldoArsCalc > 0;

  const aplicarCalculo = () => {
    setSaldoYo(String(saldoYoCalc));
    setSaldoSocio(String(saldoSocioCalc));
  };

  const handlePagar = () => {
    startTransition(async () => {
      await pagarSaldo(r.id, fechaCobro, saldoYoVal, saldoSocioVal, cotizacionVal || null);
      setConfirming(false);
    });
  };

  // Estado: estadía completada
  if (r.saldo_pagado) {
    return (
      <div className="rounded-xl bg-green-100 border border-green-300 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">Estadía completada</p>
            <p className="text-xs text-green-600">Saldo cobrado el {r.fecha_pago_saldo ? r.fecha_pago_saldo.split('T')[0].split('-').reverse().join('/') : '—'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/70 rounded-lg px-2.5 py-2">
            <p className="text-green-700 font-semibold mb-0.5">Cobré yo (saldo)</p>
            <p className="text-green-900 font-bold text-sm">{(r.saldo_yo ?? 0) > 0 ? formatARS(r.saldo_yo ?? 0) : <span className="text-slate-400 font-normal">No cobré</span>}</p>
          </div>
          <div className="bg-white/70 rounded-lg px-2.5 py-2">
            <p className="text-blue-700 font-semibold mb-0.5">Cobró socio (saldo)</p>
            <p className="text-blue-900 font-bold text-sm">{(r.saldo_socio ?? 0) > 0 ? formatARS(r.saldo_socio ?? 0) : <span className="text-slate-400 font-normal">No cobró</span>}</p>
          </div>
        </div>
        {r.cotizacion_saldo && (
          <p className="text-xs text-green-600 text-center">Cotiz. saldo: ${r.cotizacion_saldo.toLocaleString('es-AR')}/USD</p>
        )}
      </div>
    );
  }

  // Estado: formulario de cobro de saldo
  if (confirming) {
    return (
      <div className="rounded-xl bg-green-50 border-2 border-green-300 p-4 space-y-3">
        <p className="text-sm text-green-800 font-semibold">Registrar cobro del saldo</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha de cobro</label>
            <input type="date" className="input" value={fechaCobro}
              onChange={(e) => setFechaCobro(e.target.value)} />
          </div>
          <div>
            <label className="label">Cotización dólar oficial (venta)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
              <input type="number" min="0" step="1" className="input pl-7" placeholder="0"
                value={cotizacionSaldo} onChange={(e) => setCotizacionSaldo(e.target.value)} />
            </div>
          </div>
        </div>

        {puedeCalcular && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-center justify-between gap-3">
            <div className="text-xs text-amber-800 leading-snug">
              <span className="font-semibold">Saldo calculado:</span>{' '}
              {formatARS(saldoArsCalc)}
              <span className="text-amber-600 ml-1">· Yo {formatARS(saldoYoCalc)} · Socio {formatARS(saldoSocioCalc)}</span>
            </div>
            <button type="button" onClick={aplicarCalculo}
              className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg transition-colors">
              <RefreshCw size={11} /> Aplicar
            </button>
          </div>
        )}

        <p className="text-xs text-green-700 font-medium">Montos cobrados en ARS</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Recibí yo</label>
            <MontoInput value={saldoYo} onChange={setSaldoYo} placeholder="0" />
          </div>
          <div>
            <label className="label">Recibió el socio</label>
            <MontoInput value={saldoSocio} onChange={setSaldoSocio} placeholder="0" />
          </div>
        </div>

        {totalSaldo > 0 && (
          <div className="rounded-lg bg-white border border-green-200 px-3 py-2 flex justify-between items-center">
            <span className="text-sm text-slate-500">Total saldo cobrado</span>
            <span className="font-bold text-green-800">{formatARS(totalSaldo)}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button className="btn-secondary flex-1 justify-center text-xs py-1.5" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
          <button onClick={handlePagar} disabled={totalSaldo === 0}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50">
            <CheckCircle2 size={15} /> Confirmar cobro
          </button>
        </div>
      </div>
    );
  }

  // Estado: saldo pendiente — botón prominente rojo
  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full flex items-center justify-between gap-3 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-4 py-3 transition-colors shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <Circle size={18} className="text-red-200 shrink-0" />
        <div className="text-left">
          <p className="text-sm font-bold leading-tight">Saldo pendiente de pago</p>
          <p className="text-xs text-red-200 leading-tight">Tocar para registrar cobro</p>
        </div>
      </div>
      <span className="text-base font-bold shrink-0">{formatARS(r.saldo_pendiente ?? 0)}</span>
    </button>
  );
}
