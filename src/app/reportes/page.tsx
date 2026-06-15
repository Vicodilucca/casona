import {
  getReservas,
  getGastos,
  getSumIngresos,
  getSumGastos,
  getSumGastosPorPagador,
  getSumIngresosPorSocio,
} from '@/lib/db';
import ReportesClient from './ReportesClient';
import { getCurrentMonth } from '@/lib/utils';

export default function ReportesPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string };
}) {
  const { desde: defDesde, hasta: defHasta } = getCurrentMonth();
  const desde = searchParams.desde ?? defDesde;
  const hasta = searchParams.hasta ?? defHasta;

  const ingresos = getSumIngresos(desde, hasta);
  const gastosTotales = getSumGastos(desde, hasta);
  const gastosPorPagador = getSumGastosPorPagador(desde, hasta);
  const ingresosPorSocio = getSumIngresosPorSocio(desde, hasta);
  const neto = ingresos - gastosTotales;

  const todasReservas = getReservas().filter((r) => r.estado === 'confirmada');
  const gastos = getGastos(desde, hasta);

  // Entradas de ingreso: una por evento de cobro (anticipo o saldo), igual que getSumIngresos
  const entradasIngreso: { reserva: ReturnType<typeof getReservas>[0]; tipo: 'anticipo' | 'saldo'; fecha: string; yo: number; socio: number }[] = [];
  for (const r of todasReservas) {
    if (r.fecha_reserva >= desde && r.fecha_reserva <= hasta && ((r.monto_yo ?? 0) + (r.monto_socio ?? 0) > 0)) {
      entradasIngreso.push({ reserva: r, tipo: 'anticipo', fecha: r.fecha_reserva, yo: r.monto_yo ?? 0, socio: r.monto_socio ?? 0 });
    }
    if (r.saldo_pagado && r.fecha_pago_saldo && r.fecha_pago_saldo >= desde && r.fecha_pago_saldo <= hasta && ((r.saldo_yo ?? 0) + (r.saldo_socio ?? 0) > 0)) {
      entradasIngreso.push({ reserva: r, tipo: 'saldo', fecha: r.fecha_pago_saldo!, yo: r.saldo_yo ?? 0, socio: r.saldo_socio ?? 0 });
    }
  }
  entradasIngreso.sort((a, b) => a.fecha.localeCompare(b.fecha));
  const reservasUnicas = new Set(entradasIngreso.map((e) => e.reserva.id)).size;

  // Partes teóricas
  const miParteIngresos = ingresos * 0.65;
  const socioParteIngresos = ingresos * 0.35;
  const miParteGastos = gastosTotales * 0.65;
  const socioParteGastos = gastosTotales * 0.35;
  const miNeto = miParteIngresos - miParteGastos;
  const socioNeto = socioParteIngresos - socioParteGastos;

  // Lo que realmente cobró cada uno y lo que pagó en gastos
  const yoCobre = ingresosPorSocio.yo;
  const socioCobro = ingresosPorSocio.socio;
  const yoPague = gastosPorPagador.yo;
  const socioPago = gastosPorPagador.socio;

  // Posición real de cada socio (lo cobrado - lo pagado en gastos)
  const miPosicionReal = yoCobre - yoPague;
  const socioPosicionReal = socioCobro - socioPago;

  // Lo que cada uno debería haber terminado con (neto teórico)
  // Saldo: positivo = el socio me debe; negativo = yo le debo al socio
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
