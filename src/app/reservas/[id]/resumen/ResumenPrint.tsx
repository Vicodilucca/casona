import Image from 'next/image';
import type { Reserva } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import PrintButton from './PrintButton';

function fmtARS(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

function fmtUSD(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCotizacion(n: number) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

function getNights(inicio: string, fin: string) {
  return Math.round(
    (new Date(fin).getTime() - new Date(inicio).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function Row({ label, value, sub, bold }: { label: string; value: string; sub?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start py-1.5 print:py-1 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-slate-500 text-sm print:text-xs">{label}</span>
      <div className="text-right">
        <span className={`text-sm print:text-xs ${bold ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>{value}</span>
        {sub && <p className="text-xs print:text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 print:mb-3">
      <h2 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">{title}</h2>
      <div className="bg-white rounded-xl border border-slate-200 px-4 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

export default function ResumenPrint({ r }: { r: Reserva }) {
  const dias = getNights(r.fecha_inicio, r.fecha_fin);
  const cobradoParcialARS = (r.monto_yo ?? 0) + (r.monto_socio ?? 0);
  const cobradoParcialUSD = r.cotizacion && r.cotizacion > 0
    ? cobradoParcialARS / r.cotizacion
    : null;

  const saldoPendienteUSD = r.monto_usd != null
    ? r.monto_usd / 2
    : null;

  const saldoARS = (r.saldo_yo ?? 0) + (r.saldo_socio ?? 0);

  return (
    <div className="min-h-screen bg-slate-50 print:min-h-0 print:bg-white">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 1.2cm; }
        }
      `}</style>

      {/* Barra de acción — oculta al imprimir */}
      <PrintButton />

      {/* Documento */}
      <div className="max-w-xl mx-auto px-4 py-8 print:py-0 print:max-w-none print:px-0">

        {/* Encabezado */}
        <div className="mb-6 print:mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-casona.png" alt="La Casona de Río Grande" width={56} height={56} className="object-contain print:w-12 print:h-12" />
            <div>
              <p className="text-2xl print:text-xl font-bold text-slate-900">La Casona de Río Grande</p>
              <p className="text-sm text-slate-500 mt-0.5">Confirmación de reserva</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Reserva #{r.id}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Fecha de reserva: {formatDate(r.fecha_reserva)}
            </p>
            <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full
              ${r.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' :
                r.estado === 'pendiente'  ? 'bg-amber-100 text-amber-700'   :
                                            'bg-slate-100 text-slate-500'}`}>
              {r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}
            </span>
          </div>
        </div>

        {/* Grilla de secciones — en pantalla apiladas, en print 2 columnas */}
        <div className="print:grid print:grid-cols-2 print:gap-x-6">
          <div>
            {/* Datos del huésped */}
            <Section title="Datos del huésped">
              <Row label="Nombre" value={r.huesped} />
              {r.dni && <Row label="DNI" value={r.dni} />}
              {r.direccion && <Row label="Dirección" value={r.direccion} />}
            </Section>

            {/* Estadía */}
            <Section title="Estadía">
              <Row
                label="Check-in"
                value={formatDate(r.fecha_inicio)}
                sub={r.hora_inicio ? `${r.hora_inicio} hs` : undefined}
              />
              <Row
                label="Check-out"
                value={formatDate(r.fecha_fin)}
                sub={r.hora_fin ? `${r.hora_fin} hs` : undefined}
              />
              <Row label="Duración" value={`${dias} ${dias === 1 ? 'día' : 'días'}`} />
              <Row label="Plataforma" value={r.plataforma === 'airbnb' ? 'Airbnb' : 'Particular'} />
            </Section>

            {/* Ocupantes */}
            <Section title="Ocupantes">
              <Row label="Adultos" value={String(r.adultos)} />
              {(r.ninos ?? 0) > 0 && <Row label="Niños" value={String(r.ninos)} />}
              {(r.mascotas ?? 0) > 0 && <Row label="Mascotas" value={String(r.mascotas)} />}
            </Section>
          </div>

          <div>
            {/* Resumen financiero */}
            <Section title="Resumen financiero">
              {r.monto_usd != null && (
                <Row label="Monto total" value={fmtUSD(r.monto_usd)} bold />
              )}
              <Row
                label="Seña abonada"
                value={fmtARS(cobradoParcialARS)}
                sub={
                  cobradoParcialUSD != null && r.cotizacion
                    ? `≈ ${fmtUSD(cobradoParcialUSD)} · cotización $${fmtCotizacion(r.cotizacion)}/USD`
                    : undefined
                }
              />
              {!r.saldo_pagado && saldoPendienteUSD != null && saldoPendienteUSD > 0 && (
                <Row label="Saldo pendiente de pago" value={fmtUSD(saldoPendienteUSD)} bold />
              )}
              {!r.saldo_pagado && r.plataforma !== 'airbnb' && (
                <Row label="+ Consumo eléctrico" value="A confirmar al egreso" />
              )}
              {r.saldo_pagado && saldoARS > 0 && (
                <Row
                  label="Saldo abonado"
                  value={fmtARS(saldoARS)}
                  sub={
                    r.cotizacion_saldo
                      ? `≈ ${fmtUSD(saldoARS / r.cotizacion_saldo)} · cotización $${fmtCotizacion(r.cotizacion_saldo)}/USD`
                      : undefined
                  }
                />
              )}
              {r.saldo_pagado && (
                <Row
                  label="Total abonado en ARS"
                  value={fmtARS(cobradoParcialARS + saldoARS)}
                  bold
                />
              )}
              {r.saldo_pagado && (
                <Row label="Estado de pago" value="✓ Estadía abonada en su totalidad" bold />
              )}
              {r.monto_usd == null && (
                <Row label="Total abonado" value={fmtARS(r.monto)} bold />
              )}
            </Section>

            {/* Información importante */}
            <div className="mb-4 print:mb-3">
              <h2 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2">Información importante</h2>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 space-y-1.5 text-xs print:text-[11px] text-slate-700">
                <p>• <strong>Recordá traer juegos de sábanas y toallas (camas simples excepto 2 matrimoniales: 1,60 m y 1,80 m) y elementos de aseo personal.</strong></p>
                <p>• No se permiten fiestas ni pirotecnia.</p>
                <p>• No se permiten invitados no incluidos en la reserva.</p>
                <p>• Al ingreso se firma un contrato de alquiler temporario.</p>
                <p>• Es de suma importancia respetar el reglamento enviado.</p>
                <p className="pt-1 font-medium text-slate-800">¡Les deseamos una hermosa estadía! 🏡</p>
                <p className="text-slate-400">Instagram: <span className="font-medium">lacasonaderiogrande</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Pie */}
        <p className="text-center text-xs text-slate-300 mt-6 print:mt-2">
          Documento generado el {formatDate(new Date().toISOString().split('T')[0])}
        </p>
      </div>
    </div>
  );
}
