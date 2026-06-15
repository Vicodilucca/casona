import fs from 'fs';
import path from 'path';
import type { Reserva, Gasto, Consulta } from './types';

const DB_PATH = path.join(process.cwd(), 'quinta-data.json');

interface DbData {
  reservas: Reserva[];
  gastos: Gasto[];
  consultas: Consulta[];
}

function readDb(): DbData {
  if (!fs.existsSync(DB_PATH)) {
    const initial: DbData = { reservas: [], gastos: [], consultas: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  return { consultas: [], ...raw };
}

function writeDb(data: DbData): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(items: { id: number }[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

function now(): string {
  return new Date().toISOString();
}

// ── Reservas ──────────────────────────────────────────────────────────────────

export function getReservaById(id: number): Reserva | null {
  const { reservas } = readDb();
  return reservas.find((r) => r.id === id) ?? null;
}

export function getReservas(desde?: string, hasta?: string): Reserva[] {
  const { reservas } = readDb();
  let result = reservas;
  if (desde && hasta) {
    result = reservas.filter(
      (r) => r.fecha_inicio <= hasta && r.fecha_fin >= desde
    );
  }
  return result.sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
}

export function createReserva(data: Omit<Reserva, 'id' | 'created_at'>): Reserva {
  const db = readDb();
  const reserva: Reserva = { id: nextId(db.reservas), created_at: now(), ...data };
  db.reservas.push(reserva);
  writeDb(db);
  return reserva;
}

export function updateReserva(id: number, data: Omit<Reserva, 'id' | 'created_at'>): void {
  const db = readDb();
  const idx = db.reservas.findIndex((r) => r.id === id);
  if (idx !== -1) db.reservas[idx] = { ...db.reservas[idx], ...data };
  writeDb(db);
}

export function deleteReserva(id: number): void {
  const db = readDb();
  db.reservas = db.reservas.filter((r) => r.id !== id);
  writeDb(db);
}

// ── Gastos ────────────────────────────────────────────────────────────────────

export function getGastos(desde?: string, hasta?: string): Gasto[] {
  const { gastos } = readDb();
  let result = gastos;
  if (desde && hasta) {
    result = gastos.filter((g) => g.fecha >= desde && g.fecha <= hasta);
  }
  return result.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function createGasto(data: Omit<Gasto, 'id' | 'created_at'>): Gasto {
  const db = readDb();
  const gasto: Gasto = { id: nextId(db.gastos), created_at: now(), ...data };
  db.gastos.push(gasto);
  writeDb(db);
  return gasto;
}

export function updateGasto(id: number, data: Omit<Gasto, 'id' | 'created_at'>): void {
  const db = readDb();
  const idx = db.gastos.findIndex((g) => g.id === id);
  if (idx !== -1) db.gastos[idx] = { ...db.gastos[idx], ...data };
  writeDb(db);
}

export function deleteGasto(id: number): void {
  const db = readDb();
  db.gastos = db.gastos.filter((g) => g.id !== id);
  writeDb(db);
}

// ── Stats helpers ─────────────────────────────────────────────────────────────

export function getSumIngresos(desde: string, hasta: string): number {
  const { reservas } = readDb();
  const confirmadas = reservas.filter((r) => r.estado === 'confirmada');
  let total = 0;
  for (const r of confirmadas) {
    if (r.fecha_reserva >= desde && r.fecha_reserva <= hasta) {
      total += (r.monto_yo ?? 0) + (r.monto_socio ?? 0);
    }
    if (r.saldo_pagado && r.fecha_pago_saldo && r.fecha_pago_saldo >= desde && r.fecha_pago_saldo <= hasta) {
      total += (r.saldo_yo ?? 0) + (r.saldo_socio ?? 0);
    }
  }
  return total;
}

export function getSumIngresosPorSocio(
  desde: string,
  hasta: string
): { yo: number; socio: number } {
  const { reservas } = readDb();
  const confirmadas = reservas.filter((r) => r.estado === 'confirmada');
  let yo = 0;
  let socio = 0;
  for (const r of confirmadas) {
    if (r.fecha_reserva >= desde && r.fecha_reserva <= hasta) {
      yo += r.monto_yo ?? 0;
      socio += r.monto_socio ?? 0;
    }
    if (r.saldo_pagado && r.fecha_pago_saldo && r.fecha_pago_saldo >= desde && r.fecha_pago_saldo <= hasta) {
      yo += r.saldo_yo ?? 0;
      socio += r.saldo_socio ?? 0;
    }
  }
  return { yo, socio };
}

export function getSumGastos(desde: string, hasta: string): number {
  return getGastos(desde, hasta).reduce((sum, g) => sum + g.monto, 0);
}

export function getSumGastosPorPagador(
  desde: string,
  hasta: string
): { yo: number; socio: number } {
  const gastos = getGastos(desde, hasta);
  return {
    yo: gastos.filter((g) => g.pagado_por === 'yo').reduce((s, g) => s + g.monto, 0),
    socio: gastos.filter((g) => g.pagado_por === 'socio').reduce((s, g) => s + g.monto, 0),
  };
}

export function getReservasSaldoPendiente(): Reserva[] {
  const { reservas } = readDb();
  return reservas
    .filter((r) => r.estado === 'confirmada' && !r.saldo_pagado && (r.saldo_pendiente ?? 0) > 0)
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
}

export function marcarSaldoPagado(
  id: number,
  fecha: string,
  saldoYo: number,
  saldoSocio: number,
  cotizacionSaldo: number | null,
  montoLuz: number | null,
): void {
  const db = readDb();
  const idx = db.reservas.findIndex((r) => r.id === id);
  if (idx !== -1) {
    const r = db.reservas[idx];
    r.saldo_pagado = true;
    r.fecha_pago_saldo = fecha;
    r.saldo_yo = saldoYo;
    r.saldo_socio = saldoSocio;
    r.monto_luz = montoLuz;
    r.saldo_pendiente = saldoYo + saldoSocio;
    r.cotizacion_saldo = cotizacionSaldo;
    r.monto = (r.monto_yo ?? 0) + (r.monto_socio ?? 0) + saldoYo + saldoSocio;
  }
  writeDb(db);
}

// ── Consultas ─────────────────────────────────────────────────────────────────

export function getConsultas(): Consulta[] {
  const { consultas } = readDb();
  return consultas.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createConsulta(data: Omit<Consulta, 'id' | 'created_at'>): Consulta {
  const db = readDb();
  const consulta: Consulta = { id: nextId(db.consultas), created_at: now(), ...data };
  db.consultas.push(consulta);
  writeDb(db);
  return consulta;
}

export function updateConsultaEstado(id: number, estado: Consulta['estado']): void {
  const db = readDb();
  const idx = db.consultas.findIndex((c) => c.id === id);
  if (idx !== -1) db.consultas[idx].estado = estado;
  writeDb(db);
}

export function getConsultasPendienteCount(): number {
  const { consultas } = readDb();
  return consultas.filter((c) => c.estado === 'pendiente').length;
}
