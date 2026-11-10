const fs = require('fs');
const { Pool } = require('pg');

function toYMD(d) {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  const dateObj = new Date(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDMY(d) {
  const ymd = toYMD(d);
  if (!ymd) return '';
  const [y, m, day] = ymd.split('-');
  return `${day}/${m}/${y}`;
}

async function main() {
  const envPath = '/Users/mariavictoriadilucca/Desktop/PROYECTO QUINTA/.env.local';
  if (!fs.existsSync(envPath)) {
    console.error('Archivo .env.local no encontrado.');
    process.exit(1);
  }

  const envText = fs.readFileSync(envPath, 'utf-8');
  let dbUrl = '';
  for (const line of envText.split('\n')) {
    if (line.startsWith('DATABASE_URL=')) {
      dbUrl = line.split('=')[1].trim();
    }
  }

  if (!dbUrl) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM reservas
       WHERE estado = 'confirmada'
         AND fecha_inicio::date >= CURRENT_DATE
         AND fecha_inicio::date <= (CURRENT_DATE + INTERVAL '2 days')::date
       ORDER BY fecha_inicio ASC, hora_inicio ASC`
    );

    const hoy = new Date().toISOString().split('T')[0];

    console.log('====================================================');
    console.log(' 🔔 RECORDATORIO DE INGRESO DE HUÉSPEDES (48hs / 2 DÍAS)');
    console.log(` Fecha actual: ${toDMY(hoy)} (${hoy})`);
    console.log('====================================================\n');

    if (rows.length === 0) {
      console.log('✅ No hay huéspedes ingresando en los próximos 2 días.');

      const proximaRes = await pool.query(
        `SELECT * FROM reservas
         WHERE estado = 'confirmada' AND fecha_inicio::date > CURRENT_DATE
         ORDER BY fecha_inicio ASC LIMIT 1`
      );
      if (proximaRes.rows.length > 0) {
        const p = proximaRes.rows[0];
        console.log(`\n📌 Próxima reserva agendada:`);
        console.log(`   - Huésped: ${p.huesped}`);
        console.log(`   - Fecha de ingreso: ${toDMY(p.fecha_inicio)} (${toYMD(p.fecha_inicio)}) a las ${p.hora_inicio || '14:00'}hs`);
        console.log(`   - Plataforma: ${p.plataforma.toUpperCase()}`);
      }
    } else {
      console.log(`⚠️ Se encontraron ${rows.length} ingreso(s) próximo(s):\n`);
      rows.forEach((r) => {
        const fechaStr = toYMD(r.fecha_inicio);
        const diffMs = new Date(fechaStr + 'T00:00:00').getTime() - new Date(hoy + 'T00:00:00').getTime();
        const diasFaltantes = Math.round(diffMs / (1000 * 60 * 60 * 24));
        const aviso = diasFaltantes === 0 ? '¡INGRESO HOY!' : diasFaltantes === 1 ? '¡INGRESO MAÑANA!' : '¡INGRESO EN 2 DÍAS!';

        console.log(`----------------------------------------------------`);
        console.log(` 📌 RESERVA #${r.id} - ${aviso}`);
        console.log(`----------------------------------------------------`);
        console.log(`👤 Huésped:          ${r.huesped}`);
        console.log(`🪪 DNI:              ${r.dni || 'No registrado'}`);
        console.log(`🏠 Dirección:        ${r.direccion || 'No registrada'}`);
        console.log(`🔑 Check-in:         ${toDMY(r.fecha_inicio)} (${fechaStr}) a las ${r.hora_inicio ? String(r.hora_inicio).slice(0, 5) : '14:00'}hs`);
        console.log(`🚪 Check-out:        ${toDMY(r.fecha_fin)} (${toYMD(r.fecha_fin)}) a las ${r.hora_fin ? String(r.hora_fin).slice(0, 5) : '10:00'}hs`);
        console.log(`👥 Ocupantes:        ${r.adultos} adulto(s), ${r.ninos} niño(s), ${r.mascotas} mascota(s)`);
        console.log(`🌐 Plataforma:       ${r.plataforma.toUpperCase()}`);
        console.log(`💰 Monto total:      $${Number(r.monto).toLocaleString('es-AR')} ARS`);
        console.log(`💳 Saldo pendiente:  $${Number(r.saldo_pendiente).toLocaleString('es-AR')} ARS (${r.saldo_pagado ? 'PAGADO' : 'PENDIENTE DE COBRO'})`);
        if (r.notas) console.log(`📝 Notas:            ${r.notas}`);
        console.log('');
      });
    }

    await pool.end();
  } catch (err) {
    console.error('Error al consultar recordatorios:', err.message);
    await pool.end();
    process.exit(1);
  }
}

main();
