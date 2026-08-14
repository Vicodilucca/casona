'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { formatARS, formatDate } from '@/lib/utils';
import { SOCIOS } from '@/lib/types';
import type { Reserva, Gasto } from '@/lib/types';
import { TrendingUp, TrendingDown, Wallet, ArrowRightLeft, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface EntradaIngreso {
  reserva: Reserva;
  tipo: 'anticipo' | 'saldo';
  fecha: string;
  yo: number;
  socio: number;
}

interface ReportData {
  desde: string;
  hasta: string;
  ingresos: number;
  gastosTotales: number;
  neto: number;
  miParteIngresos: number;
  socioParteIngresos: number;
  miParteGastos: number;
  socioParteGastos: number;
  miNeto: number;
  socioNeto: number;
  yoCobre: number;
  socioCobro: number;
  yoPague: number;
  socioPago: number;
  miPosicionReal: number;
  socioPosicionReal: number;
  saldo: number;
  entradasIngreso: EntradaIngreso[];
  reservasUnicas: number;
  gastos: Gasto[];
  acumuladoHasta: string;
  ingresosAcum: number;
  gastosAcum: number;
  miNetoAcum: number;
  socioNetoAcum: number;
  miPosicionRealAcum: number;
  socioPosicionRealAcum: number;
  saldoAcum: number;
}

export default function ReportesClient({ data }: { data: ReportData }) {
  const router = useRouter();

  const yearActual = parseInt(data.desde.slice(0, 4));
  const esAnio = data.desde.endsWith('-01-01') && data.hasta.endsWith('-12-31');
  const [modo, setModo] = useState<'mes' | 'anio'>(esAnio ? 'anio' : 'mes');

  const setRange = (desde: string, hasta: string) => {
    router.push(`/reportes?desde=${desde}&hasta=${hasta}`);
  };

  const handleMes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [y, m] = e.target.value.split('-');
    const last = new Date(parseInt(y), parseInt(m), 0).getDate();
    setRange(`${y}-${m}-01`, `${y}-${m}-${String(last).padStart(2, '0')}`);
  };

  const handleModo = (nuevo: 'mes' | 'anio') => {
    setModo(nuevo);
    if (nuevo === 'anio') {
      setRange(`${yearActual}-01-01`, `${yearActual}-12-31`);
    } else {
      const hoy = new Date();
      const y = hoy.getFullYear();
      const m = String(hoy.getMonth() + 1).padStart(2, '0');
      const last = new Date(y, hoy.getMonth() + 1, 0).getDate();
      setRange(`${y}-${m}-01`, `${y}-${m}-${String(last).padStart(2, '0')}`);
    }
  };

  const prevAnio = () => setRange(`${yearActual - 1}-01-01`, `${yearActual - 1}-12-31`);
  const nextAnio = () => setRange(`${yearActual + 1}-01-01`, `${yearActual + 1}-12-31`);

  const gastosPorCategoria = data.gastos.reduce<Record<string, number>>((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto;
    return acc;
  }, {});

  const mesValue = data.desde.slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500">Análisis financiero del período</p>
        </div>
        <Link
          href={`/resumen-ejecutivo?anio=${yearActual}`}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <FileText size={15} />
          Resumen ejecutivo PDF
        </Link>
      </div>

      {/* Balance acumulado histórico con el socio */}
      <div className={`card p-5 border-2 ${data.saldoAcum >= 0 ? 'border-green-200' : 'border-orange-200'}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-slate-800">Balance histórico con el socio</h3>
          <span className="text-xs text-slate-400">Actualizado al {formatDate(data.acumuladoHasta)}</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">Considera todos los ingresos y gastos desde el inicio, sin importar el período elegido abajo.</p>

        {data.saldoAcum === 0 ? (
          <p className="text-green-700 font-semibold">✓ Están al día, no hay saldo acumulado.</p>
        ) : data.saldoAcum > 0 ? (
          <div className="bg-green-50 rounded-xl px-4 py-3">
            <p className="text-sm text-slate-600 mb-1">Hasta ahora, el socio me debe:</p>
            <p className="text-2xl font-bold text-green-700">{formatARS(data.saldoAcum)}</p>
          </div>
        ) : (
          <div className="bg-orange-50 rounded-xl px-4 py-3">
            <p className="text-sm text-slate-600 mb-1">Hasta ahora, yo le debo al socio:</p>
            <p className="text-2xl font-bold text-orange-700">{formatARS(Math.abs(data.saldoAcum))}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-500 text-xs mb-1">Neto teórico del socio (35%)</p>
            <p className="font-bold text-blue-700">{formatARS(data.socioNetoAcum)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-500 text-xs mb-1">Posición real del socio</p>
            <p className={`font-bold ${data.socioPosicionRealAcum >= 0 ? 'text-slate-700' : 'text-red-700'}`}>
              {formatARS(data.socioPosicionRealAcum)}
            </p>
          </div>
        </div>
      </div>

      {/* Selector período */}
      <div className="card p-4 space-y-3">
        {/* Toggle Mes / Año */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Ver por:</span>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => handleModo('mes')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors
                ${modo === 'mes' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Mes
            </button>
            <button
              onClick={() => handleModo('anio')}
              className={`px-3 py-1.5 text-sm font-medium border-l border-slate-200 transition-colors
                ${modo === 'anio' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Año
            </button>
          </div>
        </div>

        {modo === 'mes' ? (
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="label">Mes</label>
              <input type="month" className="input w-auto" value={mesValue} onChange={handleMes} />
            </div>
            <div className="text-slate-400 text-sm pb-2">o rango personalizado:</div>
            <div>
              <label className="label">Desde</label>
              <input type="date" className="input w-auto" value={data.desde} onChange={(e) => setRange(e.target.value, data.hasta)} />
            </div>
            <div>
              <label className="label">Hasta</label>
              <input type="date" className="input w-auto" value={data.hasta} onChange={(e) => setRange(data.desde, e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={prevAnio} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
              <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-slate-800 text-lg w-16 text-center">{yearActual}</span>
            <button onClick={nextAnio} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <h2 className="font-semibold text-slate-700">
        Período: {formatDate(data.desde)} — {formatDate(data.hasta)}
      </h2>

      {/* Resumen general */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ingresos', value: data.ingresos, icon: TrendingUp, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Gastos', value: data.gastosTotales, icon: TrendingDown, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Balance neto', value: data.neto, icon: Wallet, color: data.neto >= 0 ? 'text-blue-700' : 'text-red-700', bg: data.neto >= 0 ? 'bg-blue-50' : 'bg-red-50' },
          { label: 'Reservas', value: data.reservasUnicas, icon: ArrowRightLeft, color: 'text-violet-700', bg: 'bg-violet-50', isCount: true },
        ].map(({ label, value, icon: Icon, color, bg, isCount }) => (
          <div key={label} className="card p-4">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className={`text-lg font-bold ${color}`}>
              {isCount ? value : formatARS(value as number)}
            </p>
          </div>
        ))}
      </div>

      {/* Distribución entre socios */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Distribución entre socios</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              nombre: SOCIOS.yo.nombre,
              pct: '65%',
              parteIngresos: data.miParteIngresos,
              parteGastos: data.miParteGastos,
              neto: data.miNeto,
              cobrado: data.yoCobre,
              pagado: data.yoPague,
              posicionReal: data.miPosicionReal,
            },
            {
              nombre: SOCIOS.socio.nombre,
              pct: '35%',
              parteIngresos: data.socioParteIngresos,
              parteGastos: data.socioParteGastos,
              neto: data.socioNeto,
              cobrado: data.socioCobro,
              pagado: data.socioPago,
              posicionReal: data.socioPosicionReal,
            },
          ].map((s) => (
            <div key={s.nombre} className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                  {s.nombre[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{s.nombre}</p>
                  <p className="text-xs text-slate-500">Participación {s.pct}</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Teórico (65/35)</p>
              <Row label="Parte de ingresos" value={s.parteIngresos} color="text-green-700" />
              <Row label="Parte de gastos" value={-s.parteGastos} color="text-red-700" />
              <Row label="Neto teórico" value={s.neto} color={s.neto >= 0 ? 'text-blue-700' : 'text-red-700'} bold />

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-2 border-t border-slate-200 mt-2">Real</p>
              <Row label="Cobrado" value={s.cobrado} color="text-green-700" />
              <Row label="Gastos pagados" value={-s.pagado} color="text-red-700" />
              <Row label="Posición real" value={s.posicionReal} color={s.posicionReal >= 0 ? 'text-slate-700' : 'text-red-700'} bold />
            </div>
          ))}
        </div>
      </div>

      {/* Liquidación */}
      <div className={`card p-5 border-2 ${data.saldo === 0 ? 'border-green-200' : data.saldo > 0 ? 'border-green-200' : 'border-orange-200'}`}>
        <h3 className="font-semibold text-slate-800 mb-3">Liquidación entre socios</h3>
        {data.saldo === 0 ? (
          <p className="text-green-700 font-semibold">✓ Están al día, no hay saldo pendiente.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Mi neto teórico</p>
                <p className="font-bold text-blue-700">{formatARS(data.miNeto)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500 text-xs mb-1">Mi posición real</p>
                <p className={`font-bold ${data.miPosicionReal >= 0 ? 'text-slate-700' : 'text-red-700'}`}>
                  {formatARS(data.miPosicionReal)}
                </p>
              </div>
            </div>
            {data.saldo > 0 ? (
              <div className="bg-green-50 rounded-xl px-4 py-3">
                <p className="text-sm text-slate-600 mb-1">
                  Mi posición real es menor a mi neto teórico.
                </p>
                <p className="text-lg font-bold text-green-700">
                  El socio me debe: {formatARS(data.saldo)}
                </p>
              </div>
            ) : (
              <div className="bg-orange-50 rounded-xl px-4 py-3">
                <p className="text-sm text-slate-600 mb-1">
                  Mi posición real es mayor a mi neto teórico.
                </p>
                <p className="text-lg font-bold text-orange-700">
                  Yo le debo al socio: {formatARS(Math.abs(data.saldo))}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gastos por categoría */}
      {Object.keys(gastosPorCategoria).length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Gastos por categoría</h3>
          <div className="space-y-3">
            {Object.entries(gastosPorCategoria)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, total]) => {
                const pct = data.gastosTotales > 0 ? (total / data.gastosTotales) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700">{cat}</span>
                      <span className="font-semibold text-slate-800">{formatARS(total)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Pagué yo</span>
              <span className="font-semibold text-slate-700">{formatARS(data.yoPague)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Pagó el socio</span>
              <span className="font-semibold text-slate-700">{formatARS(data.socioPago)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
              <span className="text-sm font-semibold text-slate-600">Total gastos</span>
              <span className="font-bold text-red-700">{formatARS(data.gastosTotales)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Detalle ingresos */}
      {data.entradasIngreso.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Ingresos del período ({data.entradasIngreso.length})</h3>
          <div className="space-y-3">
            {data.entradasIngreso.map((e, i) => {
              const r = e.reserva;
              const total = e.yo + e.socio;
              return (
                <div key={`${r.id}-${e.tipo}-${i}`} className="py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-start justify-between text-sm gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${e.tipo === 'anticipo' ? 'bg-violet-100 text-violet-700' : 'bg-green-100 text-green-700'}`}>
                          {e.tipo === 'anticipo' ? 'Seña' : 'Saldo'}
                        </span>
                        <p className="font-medium text-slate-800">{r.huesped}</p>
                      </div>
                      <p className="text-xs text-slate-400">
                        Cobrado el {formatDate(e.fecha)} · estadía {formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)} · {r.plataforma === 'airbnb' ? 'Airbnb' : 'Particular'}
                      </p>
                    </div>
                    <p className="font-bold text-slate-800 shrink-0">{formatARS(total)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-xs bg-green-50 rounded px-2 py-1">
                      <span className="text-green-600">Cobré yo: </span>
                      <span className="font-semibold text-green-800">{formatARS(e.yo)}</span>
                    </div>
                    <div className="text-xs bg-blue-50 rounded px-2 py-1">
                      <span className="text-blue-600">Cobró socio: </span>
                      <span className="font-semibold text-blue-800">{formatARS(e.socio)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {(() => {
            const totalYo = data.entradasIngreso.reduce((s, e) => s + e.yo, 0);
            const totalSocio = data.entradasIngreso.reduce((s, e) => s + e.socio, 0);
            return (
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Cobré yo</span>
                  <span className="font-semibold text-slate-700">{formatARS(totalYo)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Cobró el socio</span>
                  <span className="font-semibold text-slate-700">{formatARS(totalSocio)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-600">Total ingresos</span>
                  <span className="font-bold text-green-700">{formatARS(data.ingresos)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-semibold'} ${color}`}>
        {value >= 0 ? '+' : ''}{formatARS(value)}
      </span>
    </div>
  );
}
