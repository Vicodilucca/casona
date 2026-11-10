import React from 'react';
import Link from 'next/link';
import { Bell, Calendar, User, Clock, Users, DollarSign, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Reserva } from '@/lib/types';
import { formatDate, formatARS } from '@/lib/utils';

interface RecordatorioIngresoCardProps {
  reservasEn2Dias: Reserva[];
  proximaReserva?: Reserva | null;
}

export default function RecordatorioIngresoCard({ reservasEn2Dias, proximaReserva }: RecordatorioIngresoCardProps) {
  const hoyStr = new Date().toISOString().split('T')[0];

  const getDiasFaltantes = (fechaInicioStr: string) => {
    const cleanFecha = String(fechaInicioStr).slice(0, 10);
    const diffMs = new Date(cleanFecha + 'T00:00:00').getTime() - new Date(hoyStr + 'T00:00:00').getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="card p-5 border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 shadow-sm rounded-xl mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500 text-white shadow-sm animate-pulse">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              Recordatorio de Check-in (48hs / 2 días)
            </h2>
            <p className="text-xs text-slate-500">
              Notificación con detalles clave para la recepción de huéspedes
            </p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
          reservasEn2Dias.length > 0
            ? 'bg-amber-100 text-amber-800 border border-amber-300'
            : 'bg-slate-100 text-slate-600'
        }`}>
          {reservasEn2Dias.length > 0 ? `⚠️ ${reservasEn2Dias.length} ingreso(s) próximo(s)` : 'Al día'}
        </span>
      </div>

      {reservasEn2Dias.length === 0 ? (
        <div className="bg-white/80 rounded-lg p-4 text-slate-600 border border-slate-200/60 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-slate-800">No hay ingresos previstos para los próximos 2 días.</p>
              {proximaReserva && (
                <p className="text-xs text-slate-500 mt-1">
                  El próximo ingreso registrado es <strong className="text-slate-700">{proximaReserva.huesped}</strong> el{' '}
                  <strong className="text-slate-700">{formatDate(String(proximaReserva.fecha_inicio).slice(0, 10))}</strong> a las{' '}
                  <strong className="text-slate-700">{proximaReserva.hora_inicio || '14:00'}hs</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reservasEn2Dias.map((r) => {
            const diasFaltan = getDiasFaltantes(r.fecha_inicio);
            const badgeText =
              diasFaltan === 0
                ? '¡INGRESO HOY!'
                : diasFaltan === 1
                ? '¡INGRESO MAÑANA!'
                : `INGRESO EN 2 DÍAS (${formatDate(String(r.fecha_inicio).slice(0, 10))})`;

            const badgeBg =
              diasFaltan === 0
                ? 'bg-red-600 text-white'
                : diasFaltan === 1
                ? 'bg-amber-600 text-white'
                : 'bg-blue-600 text-white';

            return (
              <div
                key={r.id}
                className="bg-white rounded-lg p-4 border border-amber-200 shadow-xs hover:border-amber-400 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeBg}`}>
                      {badgeText}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      r.plataforma === 'airbnb' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {r.plataforma.toUpperCase()}
                    </span>
                  </div>

                  {r.saldo_pendiente > 0 ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold border border-red-200 flex items-center gap-1">
                      <AlertTriangle size={12} /> Saldo pendiente: {formatARS(r.saldo_pendiente)}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold border border-green-200">
                      ✓ Saldo Cancelado
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {/* Huésped & Contacto */}
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <User size={12} /> Datos del Huésped
                    </div>
                    <p className="font-bold text-slate-900">{r.huesped}</p>
                    <p className="text-xs text-slate-600">DNI: {r.dni || 'No especificado'}</p>
                    <p className="text-xs text-slate-600 truncate" title={r.direccion}>
                      Dirección: {r.direccion || 'No especificada'}
                    </p>
                  </div>

                  {/* Horarios & Ocupación */}
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} /> Horarios y Ocupación
                    </div>
                    <p className="text-xs text-slate-800">
                      <strong className="text-green-700">Check-in:</strong> {formatDate(String(r.fecha_inicio).slice(0, 10))} a las {r.hora_inicio || '14:00'}hs
                    </p>
                    <p className="text-xs text-slate-800">
                      <strong className="text-red-700">Check-out:</strong> {formatDate(String(r.fecha_fin).slice(0, 10))} a las {r.hora_fin || '10:00'}hs
                    </p>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                      <Users size={12} /> {r.adultos} adulto(s){r.ninos > 0 ? `, ${r.ninos} niño(s)` : ''}{r.mascotas > 0 ? `, ${r.mascotas} mascota(s)` : ''}
                    </p>
                  </div>

                  {/* Pago & Acciones */}
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign size={12} /> Alquiler y Pagos
                    </div>
                    <p className="text-xs text-slate-800">
                      Total: <strong className="text-slate-900">{formatARS(r.monto)}</strong>
                    </p>
                    <p className="text-xs text-slate-700">
                      Saldo a cobrar: <strong className={r.saldo_pendiente > 0 ? 'text-red-600' : 'text-green-600'}>{formatARS(r.saldo_pendiente)}</strong>
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <Link
                        href={`/reservas/${r.id}/resumen`}
                        target="_blank"
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 underline"
                      >
                        <FileText size={12} /> Ver Contrato PDF
                      </Link>
                    </div>
                  </div>
                </div>

                {r.notas && (
                  <div className="mt-2.5 p-2 bg-amber-50/80 rounded text-xs text-amber-900 border border-amber-200/60 flex items-start gap-1.5">
                    <span className="font-bold shrink-0">Notas:</span>
                    <span>{r.notas}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
