import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { Pool } = require('pg');

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, '..', 'quinta-data-backup.json');
const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el entorno (cargá .env.local antes de correr este script).');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let reservasCount = 0;
    for (const r of data.reservas ?? []) {
      await client.query(
        `INSERT INTO reservas (id, huesped, dni, direccion, adultos, ninos, mascotas,
           fecha_inicio, hora_inicio, fecha_fin, hora_fin, fecha_reserva, plataforma,
           monto_usd, cotizacion, monto, monto_yo, monto_socio, saldo_pendiente,
           saldo_yo, saldo_socio, monto_luz, cotizacion_saldo, saldo_pagado,
           fecha_pago_saldo, estado, notas, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
         ON CONFLICT (id) DO NOTHING`,
        [
          r.id, r.huesped, r.dni ?? '', r.direccion ?? '',
          r.adultos, r.ninos, r.mascotas,
          r.fecha_inicio, r.hora_inicio, r.fecha_fin, r.hora_fin,
          r.fecha_reserva, r.plataforma,
          r.monto_usd ?? null, r.cotizacion ?? null,
          r.monto ?? 0, r.monto_yo ?? 0, r.monto_socio ?? 0,
          r.saldo_pendiente ?? 0, r.saldo_yo ?? 0, r.saldo_socio ?? 0,
          r.monto_luz ?? null, r.cotizacion_saldo ?? null,
          r.saldo_pagado ?? false, r.fecha_pago_saldo ?? null,
          r.estado ?? 'pendiente', r.notas ?? null, r.created_at,
        ],
      );
      reservasCount++;
    }

    let gastosCount = 0;
    for (const g of data.gastos ?? []) {
      await client.query(
        `INSERT INTO gastos (id, fecha, categoria, subcategoria, descripcion, monto, pagado_por, tipo, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [g.id, g.fecha, g.categoria, g.subcategoria ?? null, g.descripcion, g.monto, g.pagado_por, g.tipo, g.created_at],
      );
      gastosCount++;
    }

    let consultasCount = 0;
    for (const c of data.consultas ?? []) {
      await client.query(
        `INSERT INTO consultas (id, nombre, adultos, ninos, fecha_inicio, fecha_fin, llegada_tarde, notas, estado, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.nombre, c.adultos, c.ninos, c.fecha_inicio, c.fecha_fin, c.llegada_tarde ?? false, c.notas ?? null, c.estado, c.created_at],
      );
      consultasCount++;
    }

    await client.query(`SELECT setval('reservas_id_seq', COALESCE((SELECT MAX(id) FROM reservas), 0) + 1, false)`);
    await client.query(`SELECT setval('gastos_id_seq', COALESCE((SELECT MAX(id) FROM gastos), 0) + 1, false)`);
    await client.query(`SELECT setval('consultas_id_seq', COALESCE((SELECT MAX(id) FROM consultas), 0) + 1, false)`);

    await client.query('COMMIT');
    console.log('✓ Migración a Supabase completada:');
    console.log(`  Reservas:  ${reservasCount}`);
    console.log(`  Gastos:    ${gastosCount}`);
    console.log(`  Consultas: ${consultasCount}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
