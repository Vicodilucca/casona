export const dynamic = 'force-dynamic';
import {
  getReservas,
  getGastos,
  getSumIngresos,
  getSumGastos,
  getSumGastosPorPagador,
  getSumIngresosPorSocio,
} from '@/lib/db';
import type { Reserva } from '@/lib/types';
import ReportesClient from './ReportesClient';
import { getCurrentMonth } from '@/lib/utils';

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string };
}) {
  const { desde: defDesde, hasta: defHasta } = getCurrentMonth();
  const desde = searchParams.desde ?? defDesde;
  const hasta = searchParams.hasta ?? defHasta;

  const [ingresos, gastosTotales, gastosPorPagador, ingresosPorSocio, todasReservas, gastos] =
    await Promise.all([
      getSumIngresos(desde, hasta),
      getSumGastos(desde, hasta),
      getSumGastosPorPagador(desde, hasta),
      getSumIngresosPorSocio(desde, hasta),
      getReservas(),
      getGastos(desde, hasta),
    ]);

  const neto = ingresos - gastosTotales;
  const reservasConfirmadas = todasReservas.filter((r) => r.estado === 'confirmada');

  const entradasIngreso: { reserva: Reserva; tipo: 'anticipo' | 'saldo'; fecha: string; yo: number; socio: number }[] = [];
  for (const r of reservasConfirmadas) {
    if (r.fecha_reserva >= desde && r.fecha_reserva <= hasta && ((r.monto_yo ?? 0) + (r.monto_socio ?? 0) > 0)) {
      entradasIngreso.push({ reserva: r, tipo: 'anticipo', fecha: r.fecha_reserva, yo: r.monto_yo ?? 0, socio: r.monto_socio ?? 0 });
    }
    if (r.saldo_pagado && r.fecha_pago_saldo && r.fecha_pago_saldo >= desde && r.fecha_pago_saldo <= hasta && ((r.saldo_yo ?? 0) + (r.saldo_socio ?? 0) > 0)) {
      entradasIngreso.push({ reserva: r, tipo: 'saldo', fecha: r.fecha_pago_saldo!, yo: r.saldo_yo ?? 0, socio: r.saldo_socio ?? 0 });
    }
  }
  entradasIngreso.sort((a, b) => a.fecha.localeCompare(b.fecha));
  const reservasUnicas = new Set(entradasIngreso.map((e) => e.reserva.id)).size;

  const miParteIngresos = ingresos * 0.65;
  const socioParteIngresos = ingresos * 0.35;
  const miParteGastos = gastosTotales * 0.65;
  const socioParteGastos = gastosTotales * 0.35;
  const miNeto = miParteIngresos - miParteGastos;
  const socioNeto = socioParteIngresos - socioParteGastos;

  const yoCobre = ingresosPorSocio.yo;
  const socioCobro = ingresosPorSocio.socio;
  const yoPague = gastosPorPagador.yo;
  const socioPago = gastosPorPagador.socio;

  const miPosicionReal = yoCobre - yoPague;
  const socioPosicionReal = socioCobro - socioPago;
  const saldo = miNeto - miPosicionReal;

  const data = {
    desde,
    hasta,
    ingresos,
    gastosTotales,
    neto,
    miParteIngresos,
    socioParteIngresos,
    miParteGastos,
    socioParteGastos,
    miNeto,
    socioNeto,
    yoCobre,
    socioCobro,
    yoPague,
    socioPago,
    miPosicionReal,
    socioPosicionReal,
    saldo,
    entradasIngreso,
    reservasUnicas,
    gastos,
  };

  return <ReportesClient data={data} />;
}
