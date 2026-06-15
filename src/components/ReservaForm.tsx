'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  CalendarCheck, User, Users, BedDouble,
  ClipboardList, Banknote, Clock3, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { agregarReserva, editarReserva } from '@/actions/reservas';
import MontoInput from '@/components/MontoInput';
import HoraInput from '@/components/HoraInput';
import { formatARS, getNights } from '@/lib/utils';
import { SOCIOS } from '@/lib/types';
import type { Reserva } from '@/lib/types';

interface Props {
  initial?: Reserva;
  onClose: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

const empty = {
  fecha_reserva: today(),
  huesped: '',
  dni: '',
  direccion: '',
  adultos: '1',
  ninos: '0',
  mascotas: '0',
  fecha_inicio: '',
  hora_inicio: '14:00',
  fecha_fin: '',
  hora_fin: '10:00',
  plataforma: 'particular' as const,
  monto_usd: '',
  cotizacion: '',
  monto_ars: '',
  monto_yo: '',
  monto_socio: '',
  saldo_yo: '',
  saldo_socio: '',
  cotizacion_saldo: '',
  fecha_pago_saldo: '',
  monto_luz: '',
  estado: 'confirmada' as const,
  notas: '',
};

function toForm(r: Reserva) {
  return {
    fecha_reserva: r.fecha_reserva ?? today(),
    huesped: r.huesped,
    dni: r.dni ?? '',
    direccion: r.direccion ?? '',
    adultos: String(r.adultos ?? 1),
    ninos: String(r.ninos ?? 0),
    mascotas: String(r.mascotas ?? 0),
    fecha_inicio: r.fecha_inicio,
    hora_inicio: r.hora_inicio ?? '14:00',
    fecha_fin: r.fecha_fin,
    hora_fin: r.hora_fin ?? '10:00',
    plataforma: r.plataforma,
    monto_usd: r.monto_usd != null ? String(r.monto_usd) : '',
    cotizacion: r.cotizacion != null ? String(r.cotizacion) : '',
    monto_ars: '',
    monto_yo: String(r.monto_yo ?? 0),
    monto_socio: String(r.monto_socio ?? 0),
    saldo_yo: String(r.saldo_yo ?? 0),
    saldo_socio: String(r.saldo_socio ?? 0),
    cotizacion_saldo: r.cotizacion_saldo != null ? String(r.cotizacion_saldo) : '',
    fecha_pago_saldo: r.fecha_pago_saldo ?? '',
    monto_luz: r.monto_luz != null ? String(r.monto_luz) : '',
    estado: r.estado,
    notas: r.notas ?? '',
  };
}

export default function ReservaForm({ initial, onClose }: Props) {
  const [form, setForm] = useState(initial ? toForm(initial) : empty);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [fetchingCotiz, setFetchingCotiz] = useState(false);
  const [editandoSaldo, setEditandoSaldo] = useState(false);
  const [usdManualizado, setUsdManualizado] = useState(!!(initial?.monto_usd));
  // Cuando hay reserva inicial con saldo ya cargado, empezamos en modo manual
  const [saldoManualizado, setSaldoManualizado] = useState(
    !!(initial?.saldo_yo || initial?.saldo_socio)
  );

  // Auto-fetch cotización según fecha de reserva (solo si el campo está vacío)
  useEffect(() => {
    if (form.cotizacion || !form.fecha_reserva) return;
    setFetchingCotiz(true);
    fetch(`/api/cotizacion?fecha=${form.fecha_reserva}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.cotizacion) setForm((f) => ({ ...f, cotizacion: String(data.cotizacion) }));
      })
      .finally(() => setFetchingCotiz(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fecha_reserva]);

  const isAirbnb = form.plataforma === 'airbnb';

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const setPlataforma = (v: string) => {
    setForm((f) => ({
      ...f,
      plataforma: v as Reserva['plataforma'],
      // Al cambiar a airbnb, limpiar pagos del socio
      ...(v === 'airbnb' ? { monto_socio: '0', saldo_socio: '0' } : {}),
    }));
    setSaldoManualizado(false);
  };

  const setSaldoManual = (k: 'saldo_yo' | 'saldo_socio', v: string) => {
    setSaldoManualizado(true);
    set(k, v);
  };

  // Noches (necesario para el cálculo USD)
  const dias =
    form.fecha_inicio && form.fecha_fin && form.fecha_fin >= form.fecha_inicio
      ? getNights(form.fecha_inicio, form.fecha_fin)
      : null;
  const diasNum = dias ?? 0;

  // Cálculo automático USD: USD 29 × personas × noches (niños < 3 no cuentan → el usuario ajusta ninos)
  const TARIFA_USD = 29;
  const adultosN = parseInt(form.adultos) || 0;
  const ninosN   = parseInt(form.ninos)   || 0;
  const personasN = adultosN + ninosN;
  const montoUsdAuto = diasNum > 0 ? personasN * TARIFA_USD * diasNum : 0;
  const usdEfectivo  = !usdManualizado && montoUsdAuto > 0 ? String(montoUsdAuto) : form.monto_usd;

  // Valores numéricos
  const montoUsd   = parseFloat(usdEfectivo) || 0;
  const cotizacion = parseFloat(form.cotizacion) || 0;
  const montoArsDirecto = parseFloat(form.monto_ars) || 0;
  const montoYo    = isAirbnb ? 0 : (parseFloat(form.monto_yo) || 0);
  const montoSocio = isAirbnb ? 0 : (parseFloat(form.monto_socio) || 0);

  const cobradoParcial = montoYo + montoSocio;

  // Total: ARS directo tiene precedencia; si no, USD × cotización
  const totalArsCalculado = montoArsDirecto > 0
    ? montoArsDirecto
    : (montoUsd > 0 && cotizacion > 0 ? Math.round(montoUsd * cotizacion) : 0);
  const usandoArsDirecto    = montoArsDirecto > 0;
  const saldoCalculado      = totalArsCalculado > 0 ? Math.max(0, totalArsCalculado - cobradoParcial) : 0;
  // Airbnb: 100% a mí, 0% al socio
  const saldoYoCalculado    = isAirbnb ? saldoCalculado : Math.round(saldoCalculado * SOCIOS.yo.porcentaje);
  const saldoSocioCalculado = isAirbnb ? 0             : Math.round(saldoCalculado * SOCIOS.socio.porcentaje);
  const puedeCalcular       = totalArsCalculado > 0;

  // Valores efectivos: auto si no hay override manual, manual si el usuario editó
  const saldoYoEfectivo    = !saldoManualizado && puedeCalcular ? String(saldoYoCalculado)    : form.saldo_yo;
  const saldoSocioEfectivo = !saldoManualizado && puedeCalcular ? String(saldoSocioCalculado) : form.saldo_socio;

  const saldoYoVal        = parseFloat(saldoYoEfectivo) || 0;
  const saldoSocioVal     = parseFloat(saldoSocioEfectivo) || 0;
  const saldoPendienteVal = saldoYoVal + saldoSocioVal;
  const totalAcordado     = cobradoParcial + saldoPendienteVal;

  // Sugerencia de seña (50% del total en USD, convertido a ARS por socio)
  const senaUsd   = montoUsd > 0 ? montoUsd / 2 : 0;
  const senaArs   = cotizacion > 0 ? Math.round(senaUsd * cotizacion) : 0;
  const senaYo    = Math.round(senaArs * SOCIOS.yo.porcentaje);
  const senaSocio = Math.round(senaArs * SOCIOS.socio.porcentaje);
  const puedeSeña = senaArs > 0 && !isAirbnb;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.huesped || !form.fecha_inicio || !form.fecha_fin) {
      setError('Completá nombre, apellido y fechas de estadía.');
      return;
    }
    if (form.fecha_fin < form.fecha_inicio) {
      setError('La fecha de salida debe ser posterior a la de ingreso.');
      return;
    }
    if (totalAcordado === 0) {
      setError('Ingresá el monto de la reserva.');
      return;
    }

    const data: Omit<Reserva, 'id' | 'created_at'> = {
      fecha_reserva: form.fecha_reserva,
      huesped: form.huesped.trim(),
      dni: form.dni.trim(),
      direccion: form.direccion.trim(),
      adultos: parseInt(form.adultos) || 1,
      ninos: parseInt(form.ninos) || 0,
      mascotas: parseInt(form.mascotas) || 0,
      fecha_inicio: form.fecha_inicio,
      hora_inicio: form.hora_inicio,
      fecha_fin: form.fecha_fin,
      hora_fin: form.hora_fin,
      plataforma: form.plataforma,
      monto_usd: montoUsd || null,
      cotizacion: cotizacion || null,
      monto: editandoSaldo
        ? cobradoParcial + (parseFloat(form.saldo_yo) || 0) + (parseFloat(form.saldo_socio) || 0)
        : totalAcordado,
      monto_yo: montoYo,
      monto_socio: montoSocio,
      saldo_pendiente: editandoSaldo
        ? (parseFloat(form.saldo_yo) || 0) + (parseFloat(form.saldo_socio) || 0)
        : saldoPendienteVal,
      saldo_yo: editandoSaldo ? (parseFloat(form.saldo_yo) || 0) : saldoYoVal,
      saldo_socio: editandoSaldo ? (parseFloat(form.saldo_socio) || 0) : saldoSocioVal,
      monto_luz: editandoSaldo ? (parseFloat(form.monto_luz) || null) : (initial?.monto_luz ?? null),
      cotizacion_saldo: editandoSaldo ? (parseFloat(form.cotizacion_saldo) || null) : (initial?.cotizacion_saldo ?? null),
      saldo_pagado: initial?.saldo_pagado ? true : (isAirbnb ? (saldoYoVal > 0 || totalArsCalculado > 0) : false),
      fecha_pago_saldo: initial?.saldo_pagado
        ? (form.fecha_pago_saldo || initial.fecha_pago_saldo || null)
        : (isAirbnb && (saldoYoVal > 0 || totalArsCalculado > 0)
          ? (() => {
              const d = new Date(form.fecha_fin + 'T12:00:00Z');
              d.setUTCDate(d.getUTCDate() + 1);
              return d.toISOString().split('T')[0];
            })()
          : null),
      estado: form.estado,
      notas: form.notas.trim() || null,
    };

    startTransition(async () => {
      if (initial) await editarReserva(initial.id, data);
      else await agregarReserva(data);
      onClose();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ① Fecha de reserva */}
      <Block icon={<CalendarCheck size={16} />} color="blue" title="Fecha de reserva" subtitle="¿Cuándo se realizó la reserva?">
        <input type="date" className="input" value={form.fecha_reserva}
          onChange={(e) => set('fecha_reserva', e.target.value)} />
      </Block>

      {/* ② Datos del huésped */}
      <Block icon={<User size={16} />} color="violet" title="Datos del huésped">
        <div>
          <label className="label">Nombre y apellido *</label>
          <input type="text" className="input" placeholder="Ej: Juan García"
            value={form.huesped} onChange={(e) => set('huesped', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">DNI</label>
            <input type="text" inputMode="numeric" className="input" placeholder="12.345.678"
              value={form.dni} onChange={(e) => set('dni', e.target.value)} />
          </div>
          <div>
            <label className="label">Dirección / Origen</label>
            <input type="text" className="input" placeholder="Ciudad, provincia"
              value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
          </div>
        </div>
      </Block>

      {/* ③ Ocupantes */}
      <Block icon={<Users size={16} />} color="teal" title="Ocupantes">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Adultos</label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" className="input text-center"
              value={form.adultos}
              onChange={(e) => { if (/^\d*$/.test(e.target.value)) { set('adultos', e.target.value); setUsdManualizado(false); } }} />
          </div>
          <div>
            <label className="label">Niños</label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" className="input text-center"
              value={form.ninos}
              onChange={(e) => { if (/^\d*$/.test(e.target.value)) { set('ninos', e.target.value); setUsdManualizado(false); } }} />
            <p className="text-[10px] text-slate-400 mt-0.5 text-center">Menores de 3 no cuentan</p>
          </div>
          <div>
            <label className="label">Mascotas</label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" className="input text-center"
              value={form.mascotas}
              onChange={(e) => { if (/^\d*$/.test(e.target.value)) set('mascotas', e.target.value); }} />
          </div>
        </div>
      </Block>

      {/* ④ Estadía */}
      <Block icon={<BedDouble size={16} />} color="indigo" title="Estadía"
        subtitle={dias !== null ? `${dias} ${dias === 1 ? 'día' : 'días'}` : undefined} subtitleHighlight>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <div>
            <label className="label">📅 Fecha de ingreso *</label>
            <input type="date" className="input" value={form.fecha_inicio}
              onChange={(e) => set('fecha_inicio', e.target.value)} required />
          </div>
          <div>
            <label className="label">🕐 Horario check-in</label>
            <HoraInput value={form.hora_inicio} onChange={(v) => set('hora_inicio', v)} />
          </div>
          <div>
            <label className="label">📅 Fecha de salida *</label>
            <input type="date" className="input" value={form.fecha_fin}
              onChange={(e) => set('fecha_fin', e.target.value)} required />
          </div>
          <div>
            <label className="label">🕐 Horario check-out</label>
            <HoraInput value={form.hora_fin} onChange={(v) => set('hora_fin', v)} />
          </div>
        </div>
      </Block>

      {/* ⑤ Info de reserva */}
      <Block icon={<ClipboardList size={16} />} color="slate" title="Información de la reserva">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Plataforma</label>
            <select className="input" value={form.plataforma} onChange={(e) => setPlataforma(e.target.value)}>
              <option value="particular">Particular</option>
              <option value="airbnb">Airbnb</option>
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
              <option value="confirmada">Confirmada</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        {/* USD + cotización */}
        <div className={`grid grid-cols-2 gap-3 ${usandoArsDirecto ? 'opacity-40 pointer-events-none' : ''}`}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Monto total en USD</label>
              {montoUsdAuto > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${!usdManualizado ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  {!usdManualizado
                    ? `${personasN} pers. × $${TARIFA_USD} × ${diasNum} noches`
                    : <button type="button" onClick={() => setUsdManualizado(false)} className="underline">↺ Recalcular</button>
                  }
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">USD</span>
              <input type="number" min="0" step="0.01" className="input pl-12" placeholder="0"
                value={usdEfectivo}
                onChange={(e) => { setUsdManualizado(true); set('monto_usd', e.target.value); }} />
            </div>
          </div>
          <div>
            <label className="label">Cotización dólar oficial (venta)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
              <input type="number" min="0" step="1" className="input pl-7" placeholder={fetchingCotiz ? 'Buscando…' : '0'}
                value={form.cotizacion} onChange={(e) => set('cotizacion', e.target.value)} disabled={fetchingCotiz} />
            </div>
          </div>
        </div>

        {/* O total directo en ARS */}
        <div>
          <label className="label">
            Total en ARS <span className="text-slate-400 font-normal">(alternativa — reemplaza el cálculo USD)</span>
          </label>
          <MontoInput value={form.monto_ars} onChange={(v) => { set('monto_ars', v); setSaldoManualizado(false); }} placeholder="0" />
        </div>

        {/* Total ARS estimado */}
        {totalArsCalculado > 0 && (
          <div className="rounded-lg bg-slate-100 border border-slate-300 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-slate-600 font-medium">Total en ARS estimado</p>
            <p className="text-base font-bold text-slate-800">{formatARS(totalArsCalculado)}</p>
          </div>
        )}
      </Block>

      {/* ⑥ Pago parcial — oculto para Airbnb */}
      {!isAirbnb && (
        <Block icon={<Banknote size={16} />} color="green" title="Pago parcial recibido"
          subtitle="Monto cobrado al confirmar la reserva">

          {/* Sugerencia seña 50% */}
          {puedeSeña && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="text-xs text-blue-800 leading-snug">
                <span className="font-semibold">Seña sugerida 50%:</span>{' '}
                USD {senaUsd.toFixed(0)} = {formatARS(senaArs)}
                <span className="text-blue-500 ml-1">· Yo {formatARS(senaYo)} · Socio {formatARS(senaSocio)}</span>
              </div>
              <button
                type="button"
                onClick={() => { set('monto_yo', String(senaYo)); set('monto_socio', String(senaSocio)); }}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw size={11} /> Aplicar
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Recibí yo</label>
              <MontoInput value={form.monto_yo} onChange={(v) => set('monto_yo', v)} placeholder="0" />
            </div>
            <div>
              <label className="label">Recibió el socio</label>
              <MontoInput value={form.monto_socio} onChange={(v) => set('monto_socio', v)} placeholder="0" />
            </div>
          </div>
        </Block>
      )}

      {/* ⑦ Saldo pendiente */}
      <Block icon={<Clock3 size={16} />} color="amber" title="Saldo pendiente de pago"
        subtitle="Se abona antes del ingreso">
        {initial?.saldo_pagado ? (
          <>
            <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={22} className="text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Total de estadía completada</p>
                  {form.fecha_pago_saldo && (
                    <p className="text-xs text-green-600">
                      Cobrado el {form.fecha_pago_saldo.split('T')[0].split('-').reverse().join('/')}
                    </p>
                  )}
                </div>
              </div>
              <button type="button"
                onClick={() => setEditandoSaldo((v) => !v)}
                className="text-xs font-semibold text-green-700 hover:text-green-900 underline shrink-0 ml-3">
                {editandoSaldo ? 'Cerrar' : 'Modificar'}
              </button>
            </div>

            {editandoSaldo && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Fecha de cobro</label>
                    <input type="date" className="input" value={form.fecha_pago_saldo}
                      onChange={(e) => set('fecha_pago_saldo', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Cotización dólar (saldo)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
                      <input type="number" min="0" step="1" className="input pl-7" placeholder="0"
                        value={form.cotizacion_saldo} onChange={(e) => set('cotizacion_saldo', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className={`grid gap-3 ${isAirbnb ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div>
                    <label className="label">Cobré yo (saldo)</label>
                    <MontoInput value={form.saldo_yo} onChange={(v) => set('saldo_yo', v)} placeholder="0" />
                  </div>
                  {!isAirbnb && (
                    <div>
                      <label className="label">Cobró el socio (saldo)</label>
                      <MontoInput value={form.saldo_socio} onChange={(v) => set('saldo_socio', v)} placeholder="0" />
                    </div>
                  )}
                </div>
                {!isAirbnb && (
                  <div>
                    <label className="label">⚡ Luz cobrada por socio</label>
                    <MontoInput value={form.monto_luz} onChange={(v) => set('monto_luz', v)} placeholder="0" />
                    <p className="text-xs text-slate-400 mt-1">Porción de luz incluida dentro del monto del socio</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Saldo en USD — referencia fija */}
            {senaUsd > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="text-xs text-blue-800 leading-snug">
                  <span className="font-bold text-blue-900">Saldo en USD: USD {senaUsd.toFixed(0)}</span>
                  <span className="text-blue-500 ml-2">(50% del total acordado)</span>
                </div>
                <span className="text-[10px] text-blue-400 whitespace-nowrap">Se pesifica al cobrar</span>
              </div>
            )}

            {/* Indicador: auto vs manual */}
            {puedeCalcular && (
              <div className="rounded-lg bg-amber-100 border border-amber-300 px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="text-xs text-amber-800 leading-snug">
                  <span className="font-semibold">
                    {saldoManualizado ? 'Saldo ingresado manualmente' : 'Estimado ARS (cotiz. de reserva):'}
                  </span>{' '}
                  {!saldoManualizado && (
                    <span>
                      {formatARS(saldoCalculado)}
                      {!isAirbnb && (
                        <span className="text-amber-600 ml-1">
                          · Yo {formatARS(saldoYoCalculado)} · Socio {formatARS(saldoSocioCalculado)}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {saldoManualizado && (
                  <button
                    type="button"
                    onClick={() => setSaldoManualizado(false)}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <RefreshCw size={11} /> Recalcular
                  </button>
                )}
              </div>
            )}

            <div className={`grid gap-3 ${isAirbnb ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div>
                <label className="label">Recibí yo</label>
                <MontoInput value={saldoYoEfectivo} onChange={(v) => setSaldoManual('saldo_yo', v)} placeholder="0" />
              </div>
              {!isAirbnb && (
                <div>
                  <label className="label">Recibió el socio</label>
                  <MontoInput value={saldoSocioEfectivo} onChange={(v) => setSaldoManual('saldo_socio', v)} placeholder="0" />
                </div>
              )}
            </div>
          </>
        )}

        {/* Resumen financiero */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white border border-slate-200 px-3 py-2.5 text-center">
            <p className="text-xs text-slate-400 mb-1">Cobrado</p>
            <p className="font-bold text-slate-700 text-sm">{formatARS(cobradoParcial)}</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-center">
            <p className="text-xs text-amber-500 mb-1">Saldo</p>
            <p className="font-bold text-amber-700 text-sm">{formatARS(saldoPendienteVal)}</p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-center">
            <p className="text-xs text-blue-500 mb-1">Total ARS</p>
            <p className="font-bold text-blue-700 text-sm">{formatARS(totalAcordado)}</p>
          </div>
        </div>
      </Block>

      {/* Notas */}
      <div>
        <label className="label">Notas</label>
        <textarea className="input resize-none" rows={2} placeholder="Información adicional..."
          value={form.notas} onChange={(e) => set('notas', e.target.value)} />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1 pb-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary flex-1" disabled={pending}>
          {pending ? 'Guardando...' : initial ? 'Guardar cambios' : 'Agregar reserva'}
        </button>
      </div>
    </form>
  );
}

// ── Block component ───────────────────────────────────────────────────────────

const colorMap = {
  blue:   { border: 'border-blue-400',   bg: 'bg-blue-50',   icon: 'bg-blue-500 text-white',   text: 'text-blue-800'  },
  violet: { border: 'border-violet-400', bg: 'bg-violet-50', icon: 'bg-violet-500 text-white', text: 'text-violet-800' },
  teal:   { border: 'border-teal-400',   bg: 'bg-teal-50',   icon: 'bg-teal-500 text-white',   text: 'text-teal-800'  },
  indigo: { border: 'border-indigo-400', bg: 'bg-indigo-50', icon: 'bg-indigo-500 text-white', text: 'text-indigo-800' },
  slate:  { border: 'border-slate-400',  bg: 'bg-slate-50',  icon: 'bg-slate-500 text-white',  text: 'text-slate-800' },
  green:  { border: 'border-green-400',  bg: 'bg-green-50',  icon: 'bg-green-600 text-white',  text: 'text-green-800' },
  amber:  { border: 'border-amber-400',  bg: 'bg-amber-50',  icon: 'bg-amber-500 text-white',  text: 'text-amber-800' },
};

type BlockColor = keyof typeof colorMap;

function Block({
  icon, color, title, subtitle, subtitleHighlight, children,
}: {
  icon: React.ReactNode;
  color: BlockColor;
  title: string;
  subtitle?: string;
  subtitleHighlight?: boolean;
  children: React.ReactNode;
}) {
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border-l-4 ${c.border} ${c.bg} p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex p-1.5 rounded-lg ${c.icon}`}>{icon}</span>
          <span className={`font-semibold text-sm ${c.text}`}>{title}</span>
        </div>
        {subtitle && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            subtitleHighlight
              ? 'bg-indigo-600 text-white'
              : `${c.bg} ${c.text} border border-current opacity-70`
          }`}>
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
