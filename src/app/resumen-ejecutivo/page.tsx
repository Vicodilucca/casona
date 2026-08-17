export const dynamic = 'force-dynamic';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import {
  getGastos,
  getSumIngresos,
  getSumGastos,
  getSumGastosPorPagador,
  getSumIngresosPorSocio,
  getReservas,
} from '@/lib/db';
import { formatARS } from '@/lib/utils';
import PrintButton from './PrintButton';

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function Row({ label, value, color, bold }: { label: string; value: number; color?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm print:text-xs py-1 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-semibold'} ${color ?? 'text-slate-800'}`}>
        {value >= 0 ? '' : ''}{formatARS(value)}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 print:mb-4">
      <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">{title}</h2>
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-1">{children}</div>
    </div>
  );
}

export default async function ResumenEjecutivoPage({
  searchParams,
}: {
  searchParams: { anio?: string };
}) {
  try {
    await requireAuth(undefined, 'reportes');
  } catch {
    redirect('/');
  }

  const anio = parseInt(searchParams.anio ?? String(new Date().getFullYear()));
  const desde = `${anio}-01-01`;
  const hasta = `${anio}-12-31`;

  const [ingresos, gastosTotales, gastos, gastosPorPagador, ingresosPorSocio, reservasAnio] =
    await Promise.all([
      getSumIngresos(desde, hasta),
      getSumGastos(desde, hasta),
      getGastos(desde, hasta),
      getSumGastosPorPagador(desde, hasta),
      getSumIngresosPorSocio(desde, hasta),
      getReservas(desde, hasta),
    ]);

  const neto = ingresos - gastosTotales;
  const reservasConfirmadas = reservasAnio.filter((r) => r.estado === 'confirmada');

  const meses = await Promise.all(
    Array.from({ length: 12 }, async (_, i) => {
      const mes = String(i + 1).padStart(2, '0');
      const d = `${anio}-${mes}-01`;
      const h = `${anio}-${mes}-${String(new Date(anio, i + 1, 0).getDate()).padStart(2, '0')}`;
      const [ingreso, gasto] = await Promise.all([getSumIngresos(d, h), getSumGastos(d, h)]);
      return { nombre: MESES_CORTO[i], ingreso, gasto };
    }),
  );

  const gastosPorCategoria = gastos.reduce<Record<string, number>>((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto;
    return acc;
  }, {});

  const yoCobre = ingresosPorSocio.yo;
  const socioCobre = ingresosPorSocio.socio;
  const yoPague = gastosPorPagador.yo;
  const socioPague = gastosPorPagador.socio;
  const miParteIngresos = ingresos * 0.65;
  const miParteGastos = gastosTotales * 0.65;
  const miNeto = miParteIngresos - miParteGastos;
  const socioParteIngresos = ingresos * 0.35;
  const socioParteGastos = gastosTotales * 0.35;
  const socioNeto = socioParteIngresos - socioParteGastos;
  const miPosicionReal = yoCobre - yoPague;
  const socioPosicionReal = socioCobre - socioPague;
  const saldo = miNeto - miPosicionReal;

  const hoy = new Date().toISOString().split('T')[0];
  const [hy, hm, hd] = hoy.split('-');
  const fechaGeneracion = `${hd}/${hm}/${hy}`;

  const mesActual = new Date().getMonth();
  const anioActual = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 print:min-h-0 print:bg-white">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 1.1cm; }
        }
      `}</style>

      <div className="print:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <a href="/reportes" className="text-sm text-slate-500 hover:text-slate-800">← Reportes</a>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <a
              href={`/resumen-ejecutivo?anio=${anio - 1}`}
              className="px-2 py-1 text-sm rounded hover:bg-slate-100 text-slate-600"
            >‹</a>
            <span className="font-semibold text-slate-800 w-12 text-center">{anio}</span>
            {anio < anioActual && (
              <a
                href={`/resumen-ejecutivo?anio=${anio + 1}`}
                className="px-2 py-1 text-sm rounded hover:bg-slate-100 text-slate-600"
              >›</a>
            )}
          </div>
        </div>
        <PrintButton />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 print:py-0 print:max-w-none print:px-0">

        <div className="flex items-start justify-between mb-6 print:mb-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-casona.png"
              alt="La Casona de Río Grande"
              width={52}
              height={52}
              className="object-contain print:w-10 print:h-10"
            />
            <div>
              <p className="text-xl print:text-lg font-bold text-slate-900">La Casona de Río Grande</p>
              <p className="text-sm text-slate-500">Resumen ejecutivo {anio}</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Período: 01/01/{anio} — 31/12/{anio}</p>
            <p>Generado el {fechaGeneracion}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6 print:mb-4">
          {[
            { label: 'Ingresos totales', value: formatARS(ingresos), color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
            { label: 'Gastos totales', value: formatARS(gastosTotales), color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
            { label: 'Balance neto', value: formatARS(neto), color: neto >= 0 ? 'text-blue-700' : 'text-red-700', bg: neto >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100' },
            { label: 'Reservas', value: String(reservasConfirmadas.length), color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl border p-3 print:p-2 ${bg}`}>
              <p className="text-[10px] text-slate-500 mb-1">{label}</p>
              <p className={`text-base print:text-sm font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5 print:gap-4">

          <div>
            <Section title="Ingresos y gastos por mes">
              <table className="w-full text-xs print:text-[10px]">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left py-1.5 font-medium">Mes</th>
                    <th className="text-right py-1.5 font-medium">Ingresos</th>
                    <th className="text-right py-1.5 font-medium">Gastos</th>
                    <th className="text-right py-1.5 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {meses.map(({ nombre, ingreso, gasto }, i) => {
                    const bal = ingreso - gasto;
                    const esFuturo = anio === anioActual && i > mesActual;
                    return (
                      <tr key={nombre} className={`border-t border-slate-50 ${esFuturo ? 'opacity-30' : ''}`}>
                        <td className="py-1 text-slate-600">{nombre}</td>
                        <td className="py-1 text-right text-green-700 font-medium">{ingreso > 0 ? formatARS(ingreso) : '—'}</td>
                        <td className="py-1 text-right text-red-600 font-medium">{gasto > 0 ? formatARS(gasto) : '—'}</td>
                        <td className={`py-1 text-right font-semibold ${bal > 0 ? 'text-blue-700' : bal < 0 ? 'text-red-700' : 'text-slate-400'}`}>
                          {ingreso > 0 || gasto > 0 ? formatARS(bal) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200">
                  <tr className="font-bold">
                    <td className="py-2 text-slate-700">Total</td>
                    <td className="py-2 text-right text-green-700">{formatARS(ingresos)}</td>
                    <td className="py-2 text-right text-red-700">{formatARS(gastosTotales)}</td>
                    <td className={`py-2 text-right ${neto >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatARS(neto)}</td>
                  </tr>
                </tfoot>
              </table>
            </Section>
          </div>

          <div>
            {Object.keys(gastosPorCategoria).length > 0 && (
              <Section title="Gastos por categoría">
                {Object.entries(gastosPorCategoria)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, total]) => (
                    <div key={cat} className="flex justify-between text-sm print:text-xs py-1 border-b border-slate-100 last:border-0">
                      <span className="text-slate-600">{cat}</span>
                      <span className="font-semibold text-red-700">{formatARS(total)}</span>
                    </div>
                  ))}
                <div className="flex justify-between text-sm print:text-xs py-1.5 font-bold">
                  <span className="text-slate-700">Pagué yo</span>
                  <span className="text-slate-800">{formatARS(yoPague)}</span>
                </div>
                <div className="flex justify-between text-sm print:text-xs py-1 font-bold border-t border-slate-100">
                  <span className="text-slate-700">Pagó Luis</span>
                  <span className="text-slate-800">{formatARS(socioPague)}</span>
                </div>
              </Section>
            )}

            <Section title="Distribución entre socios">
              <div className="py-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">María Victoria (65%)</p>
                <Row label="Parte de ingresos" value={miParteIngresos} color="text-green-700" />
                <Row label="Parte de gastos" value={-miParteGastos} color="text-red-700" />
                <Row label="Neto teórico" value={miNeto} color={miNeto >= 0 ? 'text-blue-700' : 'text-red-700'} bold />
                <Row label="Cobrado real" value={yoCobre} color="text-green-700" />
                <Row label="Pagado en gastos" value={-yoPague} color="text-red-700" />
                <Row label="Posición real" value={miPosicionReal} color={miPosicionReal >= 0 ? 'text-slate-700' : 'text-red-700'} bold />
              </div>
              <div className="border-t border-slate-200 py-1 mt-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 mt-1">Luis (35%)</p>
                <Row label="Parte de ingresos" value={socioParteIngresos} color="text-green-700" />
                <Row label="Parte de gastos" value={-socioParteGastos} color="text-red-700" />
                <Row label="Neto teórico" value={socioNeto} color={socioNeto >= 0 ? 'text-blue-700' : 'text-red-700'} bold />
                <Row label="Cobrado real" value={socioCobre} color="text-green-700" />
                <Row label="Pagado en gastos" value={-socioPague} color="text-red-700" />
                <Row label="Posición real" value={socioPosicionReal} color={socioPosicionReal >= 0 ? 'text-slate-700' : 'text-red-700'} bold />
              </div>
            </Section>
          </div>
        </div>

        <div className={`rounded-xl border-2 p-4 print:p-3 mb-6 print:mb-4 ${
          saldo === 0 ? 'border-green-200 bg-green-50' :
          saldo > 0  ? 'border-green-200 bg-green-50' :
                       'border-orange-200 bg-orange-50'
        }`}>
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Liquidación entre socios</p>
          {saldo === 0 ? (
            <p className="font-semibold text-green-700">✓ Están al día — no hay saldo pendiente entre socios.</p>
          ) : saldo > 0 ? (
            <p className="font-bold text-green-800 text-base print:text-sm">
              Luis le debe a María Victoria: {formatARS(saldo)}
            </p>
          ) : (
            <p className="font-bold text-orange-800 text-base print:text-sm">
              María Victoria le debe a Luis: {formatARS(Math.abs(saldo))}
            </p>
          )}
        </div>

        <p className="text-center text-xs text-slate-300 print:mt-2">
          Documento generado el {fechaGeneracion} · La Casona de Río Grande
        </p>
      </div>
    </div>
  );
}
