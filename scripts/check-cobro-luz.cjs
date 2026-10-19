// Pruebas aisladas, sin modificar reservas reales.
const ts = require('typescript'), fs = require('node:fs'), assert = require('node:assert/strict');
function load(file, req = require) {
  const out = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText)(req, out, out.exports);
  return out.exports;
}
(async () => {
  let cobros = [], calls = [], estado = 'confirmada';
  const query = async (sql, args = []) => {
    calls.push(sql);
    if (sql.startsWith('SELECT * FROM reservas')) return { rows: [{ id: 9, estado, fecha_fin: '2026-09-15', saldo_pagado: true, monto_luz: 5000 }] };
    if (sql.startsWith('INSERT INTO cobros_luz')) {
      assert(sql.includes('ON CONFLICT (reserva_id) DO UPDATE'));
      cobros = [{ reserva_id: args[0], monto: args[1], fecha: args[2], cobrado_por: args[3] }];
    }
    if (sql.startsWith('DELETE FROM cobros_luz')) cobros = [];
    if (sql.includes('SELECT l.*')) {
      assert(sql.includes("r.estado = 'confirmada'"));
      return { rows: cobros.filter(c => !args.length || c.fecha >= args[0] && c.fecha <= args[1]) };
    }
    if (sql.includes('AS total')) return { rows: [{ total: '100000' }] };
    if (sql.includes('AS yo')) return { rows: [{ yo: '60000', socio: '40000' }] };
    return { rows: [] };
  };
  const pg = { Pool: class { query(...a) { return query(...a); } async connect() { return { query, release() {} }; } }, types: { setTypeParser() {} } };
  const db = load('src/lib/db.ts', n => n === 'pg' ? pg : require(n));
  await db.guardarCobroLuz(9, 20000, '2026-10-19', 'socio');
  await db.guardarCobroLuz(9, 20000, '2026-10-19', 'socio');
  assert.equal(cobros.length, 1);
  assert.equal(await db.getSumIngresos('2026-10-01', '2026-10-31'), 120000);
  assert.equal(await db.getSumIngresos('2026-09-01', '2026-09-30'), 100000);
  assert.deepEqual(await db.getSumIngresosPorSocio('2026-10-01', '2026-10-31'), { yo: 60000, socio: 60000 });
  await db.guardarCobroLuz(9, 15000, '2026-10-19', 'yo');
  assert.deepEqual(await db.getSumIngresosPorSocio('2026-10-01', '2026-10-31'), { yo: 75000, socio: 40000 });
  assert(!calls.some(sql => sql.startsWith('UPDATE reservas')));
  await assert.rejects(() => db.guardarCobroLuz(9, 100, '2026-09-01', 'yo'), /finalizar/);
  assert.equal(calls.at(-1), 'ROLLBACK');
  estado = 'cancelada';
  await assert.rejects(() => db.guardarCobroLuz(9, 100, '2026-10-01', 'yo'), /confirmada/);
  estado = 'confirmada';
  await db.guardarCobroLuz(9, 0, '2026-10-19', 'yo');
  assert.equal(await db.getSumIngresos('2026-10-01', '2026-10-31'), 100000);
  let authorized = false;
  const actions = load('src/actions/reservas.ts', n => {
    if (n === '@/lib/auth-guard') return { requireAuth: async () => ({ id: 1 }), tienePermiso: () => authorized };
    if (n === '@/lib/db') return db;
    if (n === '@/lib/pagos') return {};
    if (n === '@/lib/audit') return { logAudit: async () => {} };
    if (n === 'next/cache') return { revalidatePath() {} };
    return require(n);
  });
  await assert.rejects(() => actions.registrarCobroLuz(9, 100, '2026-10-19', 'yo'), /autorizado/);
  authorized = true;
  for (const amount of [-1, NaN, Infinity]) await assert.rejects(() => actions.registrarCobroLuz(9, amount, '2026-10-19', 'yo'), /importe/);
  await assert.rejects(() => actions.registrarCobroLuz(9, 100, '2026-02-30', 'yo'), /fecha/);
  await assert.rejects(() => actions.registrarCobroLuz(9, 100, '2026-10-19', 'otro'), /Luis/);
  console.log('OK: fecha independiente, ingreso y reparto, edición sin duplicados, saldo intacto, permisos, importes y fechas inválidas.');
})().catch(error => { console.error(error); process.exitCode = 1; });
