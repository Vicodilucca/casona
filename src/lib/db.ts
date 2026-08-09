import { Pool } from 'pg';
import pg from 'pg';
import dns from 'dns';
import type { Reserva, Gasto, Consulta, Usuario, AuditLogEntry } from './types';

// Force IPv4 to avoid ENETUNREACH on IPv6-only Supabase endpoints
dns.setDefaultResultOrder('ipv4first');

pg.types.setTypeParser(1082, (val) => val);            // DATE → 'YYYY-MM-DD'
pg.types.setTypeParser(1083, (val) => val.slice(0, 5)); // TIME → 'HH:MM'
pg.types.setTypeParser(1114, (val) => val);            // TIMESTAMP → string
pg.types.setTypeParser(1184, (val) => val);            // TIMESTAMPTZ → string
pg.types.setTypeParser(1700, parseFloat);              // NUMERIC → number
pg.types.setTypeParser(20, (val) => parseInt(val, 10)); // BIGINT/BIGSERIAL → number (ids de usuarios/audit_log)

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

// ── Login rate limiting ──────────────────────────────────────────────────────

export async function contarIntentosFallidosRecientes(ip: string, minutos: number): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM login_attempts
     WHERE ip = $1 AND exitoso = false AND attempted_at > now() - ($2 || ' minutes')::interval`,
    [ip, minutos],
  );
  return rows[0].count;
}

export async function registrarIntentoLogin(ip: string, exitoso: boolean): Promise<void> {
  await pool.query('INSERT INTO login_attempts (ip, exitoso) VALUES ($1, $2)', [ip, exitoso]);
}

// ── Usuarios ──────────────────────────────────────────────────────────────────

export async function getUsuarioPorEmail(email: string): Promise<(Usuario & { password_hash: string }) | null> {
  const { rows } = await pool.query(
    'SELECT * FROM usuarios WHERE email = $1',
    [email.trim().toLowerCase()],
  );
  return rows[0] ?? null;
}

export async function getUsuarioPorId(id: number): Promise<Usuario | null> {
  const { rows } = await pool.query<Usuario>(
    'SELECT id, nombre, email, rol, activo, last_login_at, created_at FROM usuarios WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}

export async function getUsuarios(): Promise<Usuario[]> {
  const { rows } = await pool.query<Usuario>(
    'SELECT id, nombre, email, rol, activo, last_login_at, created_at FROM usuarios ORDER BY created_at ASC',
  );
  return rows;
}

export async function crearUsuarioDb(data: {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: 'superadmin' | 'admin';
}): Promise<Usuario> {
  const { rows } = await pool.query<Usuario>(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, nombre, email, rol, activo, last_login_at, created_at`,
    [data.nombre.trim(), data.email.trim().toLowerCase(), data.passwordHash, data.rol],
  );
  return rows[0];
}

export async function editarUsuarioDb(
  id: number,
  data: { nombre: string; email: string; rol: 'superadmin' | 'admin' },
): Promise<void> {
  await pool.query(
    'UPDATE usuarios SET nombre = $1, email = $2, rol = $3 WHERE id = $4',
    [data.nombre.trim(), data.email.trim().toLowerCase(), data.rol, id],
  );
}

export async function setUsuarioActivoDb(id: number, activo: boolean): Promise<void> {
  await pool.query('UPDATE usuarios SET activo = $1 WHERE id = $2', [activo, id]);
}

export async function resetearPasswordUsuarioDb(id: number, passwordHash: string): Promise<void> {
  await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
}

export async function eliminarUsuarioDb(id: number): Promise<void> {
  await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
}

export async function registrarLoginExitoso(id: number): Promise<void> {
  await pool.query('UPDATE usuarios SET last_login_at = now() WHERE id = $1', [id]);
}

export async function contarSuperadminsActivos(excluirId?: number): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM usuarios
     WHERE rol = 'superadmin' AND activo = true AND id <> COALESCE($1, -1)`,
    [excluirId ?? null],
  );
  return rows[0].count;
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export async function insertAuditLog(entry: {
  usuarioId: number | null;
  usuarioEmail: string | null;
  accion: string;
  entidad: string;
  entidadId: number | null;
  detalle: Record<string, unknown> | null;
  ip: string | null;
}): Promise<void> {
  await pool.query(
    `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      entry.usuarioId,
      entry.usuarioEmail,
      entry.accion,
      entry.entidad,
      entry.entidadId,
      entry.detalle ? JSON.stringify(entry.detalle) : null,
      entry.ip,
    ],
  );
}

export async function getAuditLog(filtros: {
  usuarioId?: number;
  entidad?: string;
  limit?: number;
  offset?: number;
}): Promise<{ entries: AuditLogEntry[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filtros.usuarioId) {
    params.push(filtros.usuarioId);
    conditions.push(`usuario_id = $${params.length}`);
  }
  if (filtros.entidad) {
    params.push(filtros.entidad);
    conditions.push(`entidad = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows: countRows } = await pool.query(`SELECT COUNT(*)::int AS count FROM audit_log ${where}`, params);

  const limit = Math.min(filtros.limit ?? 50, 200);
  const offset = filtros.offset ?? 0;
  params.push(limit, offset);
  const { rows } = await pool.query<AuditLogEntry>(
    `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return { entries: rows, total: countRows[0].count };
}
