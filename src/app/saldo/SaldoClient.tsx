'use client';

import { useState, useTransition, useEffect } from 'react';
import { CheckCircle2, Clock, CalendarDays, User, DollarSign, RefreshCw } from 'lucide-react';
import { pagarSaldo } from '@/actions/reservas';
import { formatARS, formatDate, getNights } from '@/lib/utils';
import { SOCIOS } from '@/lib/types';
import MontoInput from '@/components/MontoInput';
import type { Reserva } from '@/lib/types';

export default function SaldoClient({ pendientes }: { pendientes: Reserva[] }) {
  const totalPendiente = pendientes.reduce((sum, r) => sum + (r.saldo_pendiente ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Saldos pendientes</h1>
        <p className="text-sm text-slate-500">Reservas confirmadas con saldo aún no abonado</p>
      </div>

      <div className="card p-4 flex items-center justify-between border border-amber-100 bg-amber-50">
        <div>
          <p className="text-sm text-amber-700 font-medium">Total estimado a cobrar</p>
          <p className="text-2xl font-bold text-amber-800">{formatARS(totalPendiente)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-amber-700 font-medium">Reservas pendientes</p>
          <p className="text-2xl font-bold text-amber-800">{pendientes.length}</p>
        </div>
      </div>

      {pendientes.length === 0 ? (
        <div className="card p-10 text-center space-y-2">
          <CheckCircle2 size={36} className="text-green-500 mx-auto" />
          <p className="font-semibold text-slate-700">Todo al día</p>
          <p className="text-sm text-slate-400">No hay saldos pendientes de cobro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendientes.map((r) => <SaldoCard key={r.id} reserva={r} />)}
        </div>
      )}
    </div>
  );
}

function SaldoCard({ reserva: r }: { reserva: Reserva }) {
  const [confirming, setConfirming] = useState(false);
  const [, startTransition] = useTransition();

  const hoy = new Date().toISOString().split('T')[0];
  const [fechaCobro, setFechaCobro] = useState(hoy);
  const [cotizacionSaldo, setCotizacionSaldo] = useState('');
  const [fetchingCotiz, setFetchingCotiz] = useState(false);

  // Auto-fetch cotización según fecha de cobro (hoy por defecto)
  useEffect(() => {
    if (!confirming || cotizacionSaldo) return;
    setFetchingCotiz(true);
    fetch(`/api/cotizacion?fecha=${fechaCobro}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.cotizacion) setCotizacionSaldo(String(data.cotizacion));
      })
      .finally(() => setFetchingCotiz(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirming]);
  const [saldoYo, setSaldoYo] = useState('');
  const [saldoSocio, setSaldoSocio] = useState('');
  const [luzSocio, setLuzSocio] = useState('');

  const cotizacionVal  = parseFloat(cotizacionSaldo) || 0;
  const saldoYoVal     = parseFloat(saldoYo) || 0;
  const saldoSocioVal  = parseFloat(saldoSocio) || 0;
  const luzSocioVal    = parseFloat(luzSocio) || 0;
  const totalSaldo     = saldoYoVal + saldoSocioVal + luzSocioVal;

  // Cálculo automático desde USD y cotización del día
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

  const dias = getNights(r.fecha_inicio, r.fecha_fin);
  const diasParaIngreso = Math.ceil(
    (new Date(r.fecha_inicio).getTime() - new Date(hoy).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handlePagar = () => {
    startTransition(async () => {
      await pagarSaldo(r.id, fechaCobro, saldoYoVal, saldoSocioVal + luzSocioVal, cotizacionVal || null, luzSocioVal || null);
      setConfirming(false);
    });
  };

  return (
    <div className="card p-4 space-y-3">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <User size={14} className="text-slate-400" />
            <p className="font-semibold text-slate-800">{r.huesped}</p>
          </div>
          {r.dni && <p className="text-xs text-slate-400 ml-5">DNI {r.dni}</p>}
        </div>
        {diasParaIngreso > 0 ? (
          <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
            <Clock size={11} /> En {diasParaIngreso} días
          </span>
        ) : diasParaIngreso === 0 ? (
          <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">Ingresa hoy</span>
        ) : (
          <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-full whitespace-nowrap">Ya ingresó</span>
        )}
      </div>

      {/* Estadía */}
      <div className="flex items-center gap-1.5 text-sm text-slate-600">
        <CalendarDays size={14} className="text-slate-400" />
        <span>
          {formatDate(r.fecha_inicio)}{r.hora_inicio ? ` ${r.hora_inicio}hs` : ''} →{' '}
          {formatDate(r.fecha_fin)}{r.hora_fin ? ` ${r.hora_fin}hs` : ''} · {dias} días
        </span>
      </div>

      {/* Montos */}
      <div className="space-y-1.5 text-xs">
        {r.monto_usd && (
          <div className="bg-blue-50 rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-blue-600 flex items-center gap-1">
              <DollarSign size={12} /> Acordado en USD
              {r.cotizacion && <span className="text-blue-400 ml-1">· cotiz. reserva ${r.cotizacion.toLocaleString('es-AR')}</span>}
            </span>
            <span className="font-bold text-blue-800">
              USD {r.monto_usd.toLocaleString('es-AR')}
              {saldoUsd != null && (
                <span className="text-blue-500 font-normal ml-1">· saldo USD {saldoUsd.toFixed(0)}</span>
              )}
            </span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
            <p className="text-slate-500 mb-0.5">Cobrado parcial</p>
            <p className="font-bold text-slate-800">{formatARS(cobradoParcial)}</p>
          </div>
          <div className="bg-amber-50 rounded-lg px-3 py-2 text-center border border-amber-200">
            <p className="text-amber-600 mb-0.5">Saldo estimado</p>
            <p className="font-bold text-amber-800">{formatARS(r.saldo_pendiente ?? 0)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
            <p className="text-slate-500 mb-0.5">Total est. ARS</p>
            <p className="font-bold text-slate-700">{formatARS(cobradoParcial + (r.saldo_pendiente ?? 0))}</p>
          </div>
        </div>
      </div>

      {/* Confirmar cobro */}
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-green-400 hover:bg-green-50 px-4 py-3 transition-colors group"
        >
          <div className="w-5 h-5 rounded border-2 border-slate-300 group-hover:border-green-500 shrink-0 transition-colors" />
          <span className="text-sm text-slate-500 group-hover:text-green-700 font-medium transition-colors">
            Registrar cobro del saldo
          </span>
        </button>
      ) : (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-3">
          <p className="text-sm font-semibold text-green-800">Registrar cobro del saldo</p>

          {/* Fecha + cotización */}
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
                <input type="number" min="0" step="1" className="input pl-7" placeholder={fetchingCotiz ? 'Buscando…' : '0'}
                  value={cotizacionSaldo} onChange={(e) => setCotizacionSaldo(e.target.value)} disabled={fetchingCotiz} />
              </div>
            </div>
          </div>

          {/* Sugerencia de cálculo */}
          {puedeCalcular && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-800 leading-snug">
                <span className="font-semibold">
                  {saldoUsd != null ? `USD ${saldoUsd.toFixed(0)} × $${cotizacionVal.toLocaleString('es-AR')} =` : 'Saldo calculado:'}{' '}
                </span>
                {formatARS(saldoArsCalc)}
                <span className="text-amber-600 ml-1">
                  · Yo {formatARS(saldoYoCalc)} · Luis {formatARS(saldoSocioCalc)}
                </span>
              </div>
              <button
                type="button"
                onClick={aplicarCalculo}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw size={11} /> Aplicar
              </button>
            </div>
          )}

          {/* Montos cobrados */}
          <p className="text-xs text-green-700 font-medium">Montos cobrados en ARS</p>
          <div className={`grid gap-3 ${r.plataforma === 'airbnb' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className="label">Recibí yo</label>
              <MontoInput value={saldoYo} onChange={setSaldoYo} placeholder="0" />
            </div>
            {r.plataforma !== 'airbnb' && (
              <div>
                <label className="label">Recibió Luis</label>
                <MontoInput value={saldoSocio} onChange={setSaldoSocio} placeholder="0" />
              </div>
            )}
          </div>

          {/* Luz — solo reservas particulares */}
          {r.plataforma !== 'airbnb' && (
            <div>
              <label className="label">Luz cobrada por Luis</label>
              <MontoInput value={luzSocio} onChange={setLuzSocio} placeholder="0" />
              {luzSocioVal > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Se sumará al monto de Luis → total Luis: <span className="font-semibold">{formatARS(saldoSocioVal + luzSocioVal)}</span>
                </p>
              )}
            </div>
          )}

          {totalSaldo > 0 && (
            <div className="rounded-lg bg-white border border-green-200 px-3 py-2 flex justify-between items-center">
              <span className="text-sm text-slate-500">Total saldo cobrado</span>
              <span className="font-bold text-green-800">{formatARS(totalSaldo)}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn-secondary flex-1 justify-center text-sm py-1.5"
              onClick={() => setConfirming(false)}>
              Cancelar
            </button>
            <button
              className="flex-1 justify-center inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              onClick={handlePagar}
              disabled={totalSaldo === 0}
            >
              <CheckCircle2 size={15} /> Confirmar cobro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
