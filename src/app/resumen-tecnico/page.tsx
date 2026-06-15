import Image from 'next/image';
import PrintButton from './PrintButton';

const hoy = new Date();
const fechaGeneracion = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

type Prioridad = 'alta' | 'media' | 'baja';

const PRIORIDAD_LABEL: Record<Prioridad, string> = {
  alta:  'ALTA',
  media: 'MEDIA',
  baja:  'BAJA',
};

const PRIORIDAD_COLOR: Record<Prioridad, string> = {
  alta:  'bg-red-100 text-red-700 border-red-200',
  media: 'bg-amber-100 text-amber-700 border-amber-200',
  baja:  'bg-slate-100 text-slate-600 border-slate-200',
};

const PRIORIDAD_DOT: Record<Prioridad, string> = {
  alta:  'bg-red-500',
  media: 'bg-amber-400',
  baja:  'bg-slate-400',
};

interface Hallazgo {
  num: number;
  titulo: string;
  prioridad: Prioridad;
  detalle: string;
  solucion: string;
  esfuerzo: 'Bajo' | 'Medio' | 'Trivial';
}

const hallazgos: Hallazgo[] = [
  {
    num: 1,
    titulo: 'Base de datos: JSON sin protección ante escrituras concurrentes',
    prioridad: 'alta',
    detalle: 'db.ts usa el patrón readDb → modificar → writeDb. Si dos operaciones ocurren en paralelo (ej: cargar dos páginas que escriben al mismo tiempo), el segundo write sobreescribe el primero y se pierden datos.',
    solucion: 'Migrar a SQLite con better-sqlite3 (que ya estaba en el proyecto originalmente) o agregar un lock a los writes.',
    esfuerzo: 'Medio',
  },
  {
    num: 2,
    titulo: 'Credenciales débiles en .env.local',
    prioridad: 'alta',
    detalle: 'El archivo contiene APP_PASSWORD=quinta2024 y SESSION_SECRET con un valor placeholder. Si la app se despliega en un servidor con estos valores, el acceso está comprometido.',
    solucion: 'Verificar que en producción esas variables estén cambiadas por valores fuertes y únicos.',
    esfuerzo: 'Bajo',
  },
  {
    num: 3,
    titulo: 'Server Actions sin validación de datos',
    prioridad: 'alta',
    detalle: 'agregarReserva(), agregarGasto(), editarReserva() aceptan el objeto del cliente directamente, sin validar tipos, rangos ni campos requeridos. Un error en el form o un request manipulado puede escribir datos malformados.',
    solucion: 'Agregar validación con zod en cada action antes de llamar a las funciones de la base de datos.',
    esfuerzo: 'Medio',
  },
  {
    num: 4,
    titulo: 'Sin backup automático de quinta-data.json',
    prioridad: 'alta',
    detalle: 'Toda la información vive en un único archivo JSON. Un accidente (rm accidental, corrupción de disco, error de write) y no hay forma de recuperar nada.',
    solucion: 'Solución mínima: copiar el archivo con timestamp antes de cada write. Ideal: exportar periódicamente a Google Drive o Dropbox.',
    esfuerzo: 'Bajo',
  },
  {
    num: 5,
    titulo: 'Múltiples lecturas del JSON por carga de página',
    prioridad: 'media',
    detalle: 'El dashboard hace 5+ llamadas independientes a readDb(), cada una abre y parsea el archivo completo. La página de Resumen Ejecutivo llama a getSumIngresos y getSumGastos 12 veces (una por mes): 24 lecturas de JSON por carga.',
    solucion: 'Exponer una función readDbOnce() y pasarla como parámetro a las funciones de cálculo, para leer el archivo una sola vez por request.',
    esfuerzo: 'Bajo',
  },
  {
    num: 6,
    titulo: 'revalidatePath hardcodeado y desactualizado en las actions',
    prioridad: 'media',
    detalle: 'Cada action lista manualmente los paths a invalidar. Si se agrega una nueva página, hay que recordar actualizar los 3 archivos de actions. Ya ocurrió con /resumen-ejecutivo, que no está incluido.',
    solucion: 'Centralizar con revalidatePath("/", "layout") para invalidar todo el árbol, o usar revalidateTag con tags semánticos.',
    esfuerzo: 'Bajo',
  },
  {
    num: 7,
    titulo: 'Feriados hardcodeados en feriados.ts',
    prioridad: 'baja',
    detalle: 'El archivo debe actualizarse manualmente cada año cuando se publican los feriados en el Boletín Oficial. Actualmente tiene datos hasta 2025.',
    solucion: 'Consumir la API de argentinadatos.com/v1/feriados/{año} en runtime, la misma fuente que ya se usa para la cotización del dólar.',
    esfuerzo: 'Bajo',
  },
  {
    num: 8,
    titulo: 'Arrays MESES duplicados en múltiples archivos',
    prioridad: 'baja',
    detalle: 'Los arrays MESES y MESES_CORTO están definidos en CalendarioClient.tsx y en resumen-ejecutivo/page.tsx. Si se necesita cambiarlos, hay que hacerlo en dos lugares.',
    solucion: 'Moverlos a lib/utils.ts y exportarlos desde ahí.',
    esfuerzo: 'Trivial',
  },
  {
    num: 9,
    titulo: 'Sin ESLint configurado',
    prioridad: 'baja',
    detalle: 'No hay archivo de configuración de ESLint en el proyecto. Next.js lo incluye por defecto pero no fue inicializado. Ayudaría a detectar imports sin usar, hooks mal escritos y problemas de accesibilidad.',
    solucion: 'Ejecutar next lint para inicializarlo con la configuración recomendada de Next.js.',
    esfuerzo: 'Trivial',
  },
];

const positivos = [
  { titulo: 'Autenticación con HMAC-SHA256', detalle: 'Cookie httpOnly firmada con SHA-256 — correcto para una app single-user.' },
  { titulo: 'Server Actions + revalidatePath bien integrados', detalle: 'El flujo de mutación y revalidación de cache sigue la convención correcta del App Router.' },
  { titulo: 'API de cotización con cache', detalle: 'next: { revalidate: 3600 } en la ruta de cotización — buen uso del cache nativo de Next.js.' },
  { titulo: 'extract-receipt protegido por middleware', detalle: 'El endpoint que usa Claude API no es accesible públicamente; el middleware de sesión lo cubre correctamente.' },
  { titulo: 'TypeScript en todo el proyecto', detalle: 'Tipos bien definidos en lib/types.ts, usados de forma consistente en actions, db y componentes.' },
];

const tabla = [
  { num: 1, titulo: 'JSON sin lock en writes', impacto: 'Alto (pérdida de datos)', esfuerzo: 'Medio' },
  { num: 2, titulo: 'Credenciales débiles en .env', impacto: 'Alto (acceso no autorizado)', esfuerzo: 'Bajo' },
  { num: 3, titulo: 'Server Actions sin validación', impacto: 'Medio (datos corruptos)', esfuerzo: 'Medio' },
  { num: 4, titulo: 'Sin backup de quinta-data.json', impacto: 'Alto (irrecuperable)', esfuerzo: 'Bajo' },
  { num: 5, titulo: '24 lecturas JSON por carga', impacto: 'Medio (lentitud)', esfuerzo: 'Bajo' },
  { num: 6, titulo: 'revalidatePath manual desactualizado', impacto: 'Bajo (stale cache)', esfuerzo: 'Bajo' },
  { num: 7, titulo: 'Feriados hardcodeados', impacto: 'Bajo (mantenimiento)', esfuerzo: 'Bajo' },
  { num: 8, titulo: 'Arrays de meses duplicados', impacto: 'Bajo (mantenimiento)', esfuerzo: 'Trivial' },
  { num: 9, titulo: 'Sin ESLint', impacto: 'Bajo (calidad de código)', esfuerzo: 'Trivial' },
];

export default function ResumenTecnicoPage() {
  return (
    <div className="min-h-screen bg-slate-50 print:min-h-0 print:bg-white">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 1.1cm; font-size: 11px; }
        }
      `}</style>

      {/* Barra de acción */}
      <div className="print:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <a href="/" className="text-sm text-slate-500 hover:text-slate-800">← Dashboard</a>
        <PrintButton />
      </div>

      {/* Documento */}
      <div className="max-w-2xl mx-auto px-4 py-8 print:py-0 print:max-w-none print:px-0">

        {/* Encabezado */}
        <div className="flex items-start justify-between mb-6 print:mb-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-casona.png"
              alt="La Casona de Río Grande"
              width={50}
              height={50}
              className="object-contain print:w-10 print:h-10"
            />
            <div>
              <p className="text-xl print:text-base font-bold text-slate-900">La Casona de Río Grande</p>
              <p className="text-sm print:text-xs text-slate-500">Resumen ejecutivo técnico — App de gestión</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Versión analizada: junio 2026</p>
            <p>Generado el {fechaGeneracion}</p>
          </div>
        </div>

        {/* Descripción del stack */}
        <div className="bg-slate-800 text-slate-100 rounded-xl px-4 py-3 mb-5 print:mb-4 print:rounded-lg">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Stack tecnológico</p>
          <div className="flex flex-wrap gap-2">
            {['Next.js 14 App Router', 'TypeScript', 'Tailwind CSS', 'JSON (quinta-data.json)', 'Server Actions', 'Claude API (Haiku)', 'HMAC-SHA256 Auth'].map((t) => (
              <span key={t} className="text-xs print:text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>

        {/* Tabla resumen */}
        <div className="mb-5 print:mb-4">
          <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Tabla de hallazgos</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs print:text-[10px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold w-6">#</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Problema</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Impacto</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Esfuerzo</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((row, i) => {
                  const p = hallazgos[i].prioridad;
                  return (
                    <tr key={row.num} className="border-t border-slate-50">
                      <td className="px-3 py-1.5 text-slate-400 font-mono">{row.num}</td>
                      <td className="px-3 py-1.5 text-slate-700">{row.titulo}</td>
                      <td className="px-3 py-1.5">
                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${PRIORIDAD_COLOR[p]}`}>
                          {row.impacto}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-slate-600">{row.esfuerzo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hallazgos detallados */}
        <div className="mb-5 print:mb-4">
          <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Detalle por hallazgo</h2>
          <div className="space-y-3 print:space-y-2">
            {hallazgos.map((h) => (
              <div key={h.num} className="bg-white rounded-xl border border-slate-200 px-4 py-3 print:rounded-lg print:py-2">
                <div className="flex items-start gap-2 mb-1.5">
                  <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${PRIORIDAD_DOT[h.prioridad]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm print:text-xs text-slate-800">
                        {h.num}. {h.titulo}
                      </p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${PRIORIDAD_COLOR[h.prioridad]}`}>
                        {PRIORIDAD_LABEL[h.prioridad]}
                      </span>
                    </div>
                    <p className="text-xs print:text-[10px] text-slate-500 mt-1 leading-relaxed">{h.detalle}</p>
                    <p className="text-xs print:text-[10px] text-slate-700 mt-1.5">
                      <span className="font-semibold text-blue-700">Solución: </span>{h.solucion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lo que está bien */}
        <div className="mb-5 print:mb-4">
          <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Aspectos bien implementados</h2>
          <div className="bg-white rounded-xl border border-green-200 px-4 py-1">
            {positivos.map((p, i) => (
              <div key={i} className="flex gap-2 py-2 border-b border-slate-50 last:border-0">
                <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                <div>
                  <p className="text-sm print:text-xs font-semibold text-slate-800">{p.titulo}</p>
                  <p className="text-xs print:text-[10px] text-slate-500">{p.detalle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendación */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 print:rounded-lg mb-6 print:mb-4">
          <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-1.5">Recomendación prioritaria</p>
          <p className="text-sm print:text-xs text-blue-900 font-medium leading-relaxed">
            Antes de cualquier otra mejora, implementar un <strong>backup automático de quinta-data.json</strong> (#4).
            Es el problema de mayor impacto con el menor esfuerzo: un error de escritura o accidente puede
            hacer que se pierda todo el historial de reservas y gastos sin posibilidad de recuperación.
          </p>
        </div>

        <p className="text-center text-xs text-slate-300 print:mt-2">
          Documento generado el {fechaGeneracion} · La Casona de Río Grande
        </p>
      </div>
    </div>
  );
}
