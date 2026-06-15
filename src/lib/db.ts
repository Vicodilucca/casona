import { Pool } from 'pg';
import pg from 'pg';
import type { Reserva, Gasto, Consulta } from './types';

pg.types.setTypeParser(1082, (val) => val);            // DATE → 'YYYY-MM-DD'
pg.types.setTypeParser(1083, (val) => val.slice(0, 5)); // TIME → 'HH:MM'
pg.types.setTypeParser(1114, (val) => val);            // TIMESTAMP → string
pg.types.setTypeParser(1184, (val) => val);            // TIMESTAMPTZ → string
pg.types.setTypeParser(1700, parseFloat);              // NUMERIC → number

const isLocal = process.env.DATABASE_URL?.includes('localhost');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

// ── Reservas ──────────────────────────────────────────────────────────────────

export async function getReservaById(id: number): Promise<Reserva | null> {
  const { rows } = await pool.query<Reserva>('SELECT * FROM reservas WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function getReservas(desde?: string, hasta?: string): Promise<Reserva[]> {
  if (desde && hasta) {
    const { rows } = await pool.query<Reserva>(
      'SELECT * FROM reservas WHERE fecha_inicio <= $2 AND fecha_fin >= $1 ORDER BY fecha_inicio DESC',
      [desde, hasta],
    );
    return rows;
  }
  const { rows } = await pool.query<Reserva>('SELECT * FROM reservas ORDER BY fecha_inicio DESC');
  return rows;
}

export async function createReserva(data: Omit<Reserva, 'id' | 'created_at'>): Promise<Reserva> {
  const { rows } = await pool.query<Reserva>(
    `INSERT INTO reservas (huesped, dni, direccion, adultos, ninos, mascotas,
       fecha_inicio, hora_inicio, fecha_fin, hora_fin, fecha_reserva, plataforma,
       monto_usd, cotizacion, monto, monto_yo, monto_socio, saldo_pendiente,
       saldo_yo, saldo_socio, monto_luz, cotizacion_saldo, saldo_pagado,
       fecha_pago_saldo, estado, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
     RETURNING *`,
    [
      data.huesped, data.dni, data.direccion, data.adultos, data.ninos, data.mascotas,
      data.fecha_inicio, data.hora_inicio, data.fecha_fin, data.hora_fin,
      data.fecha_reserva, data.plataforma, data.monto_usd, data.cotizacion,
      data.monto, data.monto_yo, data.monto_socio, data.saldo_pendiente,
      data.saldo_yo, data.saldo_socio, data.monto_luz, data.cotizacion_saldo,
      data.saldo_pagado, data.fecha_pago_saldo ?? null, data.estado, data.notas,
    ],
  );
  return rows[0];
}

export async function updateReserva(id: number, data: Omit<Reserva, 'id' | 'created_at'>): Promise<void> {
  await pool.query(
    `UPDATE reservas SET huesped=$1, dni=$2, direccion=$3, adultos=$4, ninos=$5, mascotas=$6,
       fecha_inicio=$7, hora_inicio=$8, fecha_fin=$9, hora_fin=$10, fecha_reserva=$11,
       plataforma=$12, monto_usd=$13, cotizacion=$14, monto=$15, monto_yo=$16,
       monto_socio=$17, saldo_pendiente=$18, saldo_yo=$19, saldo_socio=$20,
       monto_luz=$21, cotizacion_saldo=$22, saldo_pagado=$23, fecha_pago_saldo=$24,
       estado=$25, notas=$26
     WHERE id=$27`,
    [
      data.huesped, data.dni, data.direccion, data.adultos, data.ninos, data.mascotas,
      data.fecha_inicio, data.hora_inicio, data.fecha_fin, data.hora_fin,
      data.fecha_reserva, data.plataforma, data.monto_usd, data.cotizacion,
      data.monto, data.monto_yo, data.monto_socio, data.saldo_pendiente,
      data.saldo_yo, data.saldo_socio, data.monto_luz, data.cotizacion_saldo,
      data.saldo_pagado, data.fecha_pago_saldo ?? null, data.estado, data.notas, id,
    ],
  );
}

export async function deleteReserva(id: number): Promise<void> {
  await pool.query('DELETE FROM reservas WHERE id = $1', [id]);
}

// ── Gastos ────────────────────────────────────────────────────────────────────

export async function getGastos(desde?: string, hasta?: string): Promise<Gasto[]> {
  if (desde && hasta) {
    const { rows } = await pool.query<Gasto>(
      'SELECT * FROM gastos WHERE fecha >= $1 AND fecha <= $2 ORDER BY fecha DESC',
      [desde, hasta],
    );
    return rows;
  }
  const { rows } = await pool.query<Gasto>('SELECT * FROM gastos ORDER BY fecha DESC');
  return rows;
}

export async function createGasto(data: Omit<Gasto, 'id' | 'created_at'>): Promise<Gasto> {
  const { rows } = await pool.query<Gasto>(
    `INSERT INTO gastos (fecha, categoria, subcategoria, descripcion, monto, pagado_por, tipo)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.fecha, data.categoria, data.subcategoria, data.descripcion, data.monto, data.pagado_por, data.tipo],
  );
  return rows[0];
}

export async function updateGasto(id: number, data: Omit<Gasto, 'id' | 'created_at'>): Promise<void> {
  await pool.query(
    `UPDATE gastos SET fecha=$1, categoria=$2, subcategoria=$3, descripcion=$4,
       monto=$5, pagado_por=$6, tipo=$7
     WHERE id=$8`,
    [data.fecha, data.categoria, data.subcategoria, data.descripcion, data.monto, data.pagado_por, data.tipo, id],
  );
}

export async function deleteGasto(id: number): Promise<void> {
  await pool.query('DELETE FROM gastos WHERE id = $1', [id]);
}

// ── Stats helpers ─────────────────────────────────────────────────────────────

export async function getSumIngresos(desde: string, hasta: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN fecha_reserva >= $1 AND fecha_reserva <= $2 THEN monto_yo + monto_socio ELSE 0 END), 0) +
       COALESCE(SUM(CASE WHEN saldo_pagado = true AND fecha_pago_saldo >= $1 AND fecha_pago_saldo <= $2 THEN saldo_yo + saldo_socio ELSE 0 END), 0)
       AS total
     FROM reservas WHERE estado = 'confirmada'`,
    [desde, hasta],
  );
  return parseFloat(rows[0].total) || 0;
}

export async function getSumIngresosPorSocio(
  desde: string,
  hasta: string,
): Promise<{ yo: number; socio: number }> {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN fecha_reserva >= $1 AND fecha_reserva <= $2 THEN monto_yo ELSE 0 END), 0) +
       COALESCE(SUM(CASE WHEN saldo_pagado = true AND fecha_pago_saldo >= $1 AND fecha_pago_saldo <= $2 THEN saldo_yo ELSE 0 END), 0)
       AS yo,
       COALESCE(SUM(CASE WHEN fecha_reserva >= $1 AND fecha_reserva <= $2 THEN monto_socio ELSE 0 END), 0) +
       COALESCE(SUM(CASE WHEN saldo_pagado = true AND fecha_pago_saldo >= $1 AND fecha_pago_saldo <= $2 THEN saldo_socio ELSE 0 END), 0)
       AS socio
     FROM reservas WHERE estado = 'confirmada'`,
    [desde, hasta],
  );
  return {
    yo: parseFloat(rows[0].yo) || 0,
    socio: parseFloat(rows[0].socio) || 0,
  };
}

export async function getSumGastos(desde: string, hasta: string): Promise<number> {
  const { rows } = await pool.query(
    'SELECT COALESCE(SUM(monto), 0) AS total FROM gastos WHERE fecha >= $1 AND fecha <= $2',
    [desde, hasta],
  );
  return parseFloat(rows[0].total) || 0;
}

export async function getSumGastosPorPagador(
  desde: string,
  hasta: string,
): Promise<{ yo: number; socio: number }> {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN pagado_por = 'yo' THEN monto ELSE 0 END), 0) AS yo,
       COALESCE(SUM(CASE WHEN pagado_por = 'socio' THEN monto ELSE 0 END), 0) AS socio
     FROM gastos WHERE fecha >= $1 AND fecha <= $2`,
    [desde, hasta],
  );
  return {
    yo: parseFloat(rows[0].yo) || 0,
    socio: parseFloat(rows[0].socio) || 0,
  };
}

export async function getReservasSaldoPendiente(): Promise<Reserva[]> {
  const { rows } = await pool.query<Reserva>(
    `SELECT * FROM reservas
     WHERE estado = 'confirmada' AND saldo_pagado = false AND saldo_pendiente > 0
     ORDER BY fecha_inicio ASC`,
  );
  return rows;
}

export async function marcarSaldoPagado(
  id: number,
  fecha: string,
  saldoYo: number,
  saldoSocio: number,
  cotizacionSaldo: number | null,
  montoLuz: number | null,
): Promise<void> {
  await pool.query(
    `UPDATE reservas SET
       saldo_pagado = true,
       fecha_pago_saldo = $2,
       saldo_yo = $3,
       saldo_socio = $4,
       cotizacion_saldo = $5,
       monto_luz = $6,
       saldo_pendiente = $3 + $4,
       monto = monto_yo + monto_socio + $3 + $4
     WHERE id = $1`,
    [id, fecha, saldoYo, saldoSocio, cotizacionSaldo, montoLuz],
  );
}

// ── Consultas ─────────────────────────────────────────────────────────────────

export async function getConsultas(): Promise<Consulta[]> {
  const { rows } = await pool.query<Consulta>('SELECT * FROM consultas ORDER BY created_at DESC');
  return rows;
}

export async function createConsulta(data: Omit<Consulta, 'id' | 'created_at'>): Promise<Consulta> {
  const { rows } = await pool.query<Consulta>(
    `INSERT INTO consultas (nombre, adultos, ninos, fecha_inicio, fecha_fin, llegada_tarde, notas, estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.nombre, data.adultos, data.ninos, data.fecha_inicio, data.fecha_fin, data.llegada_tarde, data.notas, data.estado],
  );
  return rows[0];
}

export async function updateConsultaEstado(id: number, estado: Consulta['estado']): Promise<void> {
  await pool.query('UPDATE consultas SET estado = $1 WHERE id = $2', [estado, id]);
}

export async function getConsultasPendienteCount(): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM consultas WHERE estado = 'pendiente'`,
  );
  return rows[0].count;
}
