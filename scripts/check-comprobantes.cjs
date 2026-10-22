// Pruebas aisladas: no conectan a la base de datos real.
const ts = require('typescript');
const fs = require('node:fs');
const assert = require('node:assert/strict');
function load(file, customRequire = require) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  new Function('require', 'module', 'exports', code)(customRequire, module, module.exports);
  return module.exports;
}
(async () => {
  const { leerComprobantesReserva } = load('src/lib/pagos.ts');
  const form = new FormData();
  form.set('reserva', new Blob(['%PDF-1.4 seña']), 'sena.pdf');
  form.set('saldo', new Blob([Buffer.from('89504e470d0a1a0a', 'hex')]), 'saldo.png');
  const archivos = await leerComprobantesReserva(form);
  assert.deepEqual(archivos.map(a => a.concepto), ['reserva', 'saldo']);
  assert.equal(archivos[1].tipo, 'image/png');
  assert.deepEqual(await leerComprobantesReserva(), []);
  const dosTickets = new FormData();
  dosTickets.append('saldo', new Blob(['%PDF-1.4 transferencia 1']), 'transferencia1.pdf');
  dosTickets.append('saldo', new Blob(['%PDF-1.4 transferencia 2']), 'transferencia2.pdf');
  const tickets = await leerComprobantesReserva(dosTickets);
  assert.deepEqual(tickets.map(a => [a.nombre, a.concepto]), [['transferencia1.pdf', 'saldo'], ['transferencia2.pdf', 'saldo']]);
  dosTickets.append('saldo', new Blob(['archivo inválido']), 'invalido.pdf');
  await assert.rejects(() => leerComprobantesReserva(dosTickets));

  const invalid = new FormData(); invalid.set('saldo', new Blob(['<html>']), 'saldo.png');
  await assert.rejects(() => leerComprobantesReserva(invalid));
  const large = new FormData();
  for (const key of ['reserva', 'saldo']) large.set(key, new Blob(['%PDF-', 'x'.repeat(1600000)]), 'grande.pdf');
  await assert.rejects(() => leerComprobantesReserva(large), /juntos/);
  let calls = [], fail = false, missing = false;
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (fail && sql.startsWith('INSERT INTO comprobantes_reserva')) throw Error('storage failed');
      return { rows: [{ id: 42 }], rowCount: missing ? 0 : 1 };
    }, release() { calls.push({ sql: 'RELEASE' }); },
  };
  const pg = { Pool: class { async query() { return { rows: [] }; } async connect() { return client; } }, types: { setTypeParser() {} } };
  const db = load('src/lib/db.ts', name => name === 'pg' ? pg : require(name));
  for (const save of [
    () => db.createReserva({}, archivos),
    () => db.updateReserva(42, {}, archivos),
    () => db.marcarSaldoPagado(42, '2026-10-02', 10, 20, null, null, tickets),
    () => db.addComprobantesReserva(42, archivos),
  ]) {
    calls = []; fail = false; await save();
    assert(calls.some(c => c.sql === 'COMMIT'));
    assert.equal(calls.filter(c => c.sql.startsWith('INSERT INTO comprobantes_reserva')).length, 2);
    assert(calls.filter(c => c.sql.startsWith('INSERT INTO comprobantes_reserva')).every(c => c.values[0] === 42));
    calls = []; fail = true; await assert.rejects(save, /storage failed/);
    assert(calls.some(c => c.sql === 'ROLLBACK'));
    assert(!calls.some(c => c.sql === 'COMMIT'));
    assert.equal(calls.at(-1).sql, 'RELEASE');
  }
  fail = false; missing = true;
  await assert.rejects(() => db.updateReserva(999, {}, archivos), /ya no existe/);
  missing = false; calls = [];
  await db.addComprobantesReserva(42, archivos);
  assert(!calls.some(c => c.sql.startsWith('UPDATE reservas')));
  calls = []; await db.updateReserva(42, {});
  assert(!calls.some(c => c.sql.startsWith('INSERT INTO comprobantes_reserva')));
  console.log('OK: tipos, límite conjunto, asociación, creación, edición, saldo, rollback y adjuntar sin modificar importes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
