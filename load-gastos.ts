import { createGasto } from './src/lib/db';

const gastos = [
  { fecha: '2024-06-01', categoria: 'Servicios', subcategoria: 'EPE', descripcion: 'EPE', monto: 50728.11, pagado_por: 'socio', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Servicios', subcategoria: 'Agua', descripcion: 'AGUA', monto: 5708.88, pagado_por: 'socio', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Impuestos', subcategoria: 'TGI', descripcion: 'TGI', monto: 2040.10, pagado_por: 'socio', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Servicios', subcategoria: 'Alarma', descripcion: 'ALARMA', monto: 16500.00, pagado_por: 'socio', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Servicios', subcategoria: 'Seguro', descripcion: 'SEGUROS', monto: 20038.00, pagado_por: 'socio', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Limpieza', subcategoria: null, descripcion: 'LIMPIEZA Mary', monto: 23000.00, pagado_por: 'socio', tipo: 'ordinario' },
  { fecha: '2024-06-15', categoria: 'Limpieza', subcategoria: null, descripcion: 'LIMPIEZA Mary', monto: 23000.00, pagado_por: 'socio', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Impuestos', subcategoria: 'VEP', descripcion: 'VEP', monto: 5496.63, pagado_por: 'socio', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Mantenimiento', subcategoria: null, descripcion: 'FACU ARREGLO LUZ', monto: 15000.00, pagado_por: 'yo', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Limpieza', subcategoria: null, descripcion: 'PRODUCTOS LIMPIEZA', monto: 8300.00, pagado_por: 'yo', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Mantenimiento', subcategoria: null, descripcion: 'PRODUCTOS PILETA hipoclorito para hacer 40l de lavanda', monto: 8300.00, pagado_por: 'yo', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Mantenimiento', subcategoria: null, descripcion: 'COMBUSTIBLE', monto: 10800.00, pagado_por: 'yo', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Mantenimiento', subcategoria: null, descripcion: 'PARCHES RUEDA TRACTOR + POXILINA 5000 + 5600', monto: 10600.00, pagado_por: 'yo', tipo: 'ordinario' },
  { fecha: '2024-06-01', categoria: 'Otros', subcategoria: null, descripcion: 'ALQUILER', monto: 100000.00, pagado_por: 'socio', tipo: 'ordinario' }
];

for (const g of gastos) {
  createGasto(g as any);
}
console.log('Gastos de Junio 2024 cargados exitosamente!');
