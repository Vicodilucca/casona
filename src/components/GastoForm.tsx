'use client';

import { useRef, useState, useTransition } from 'react';
import { Loader2, ScanLine, CheckCircle2 } from 'lucide-react';
import { agregarGasto, editarGasto } from '@/actions/gastos';
import MontoInput from '@/components/MontoInput';
import { CATEGORIAS } from '@/lib/types';
import type { Gasto } from '@/lib/types';

interface Props {
  initial?: Gasto;
  onClose: () => void;
}

const empty = {
  fecha: new Date().toISOString().split('T')[0],
  categoria: 'Limpieza',
  subcategoria: '',
  descripcion: '',
  monto: '',
  pagado_por: 'yo' as const,
  tipo: 'ordinario' as const,
};

export default function GastoForm({ initial, onClose }: Props) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, monto: String(initial.monto), subcategoria: initial.subcategoria ?? '' }
      : empty
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [aviso, setAviso] = useState('');
  const [scanned, setScanned] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const subcats = CATEGORIAS[form.categoria] ?? [];

  const handleFile = async (file?: File) => {
    if (!file || scanning || pending) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
      && !(file.type === '' && /\.(pdf|jpe?g|png|gif|webp)$/i.test(file.name))) {
      setError('Usá un PDF o una imagen JPG, PNG, GIF o WebP.');
      return;
    }
    if (!file.size || file.size > 3 * 1024 * 1024) {
      setError('El comprobante debe pesar entre 1 byte y 3 MB.');
      return;
    }
    setArchivo(file);
    setAviso('');
    setScanned(false);
    setError('');
    // Adjuntar a un gasto existente conserva su categoría y todos sus datos.
    if (initial) {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/extract-receipt', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido');
      setForm((f) => ({
        ...f,
        fecha:       data.fecha      ?? f.fecha,
        descripcion: data.descripcion ?? f.descripcion,
        monto:       data.monto      != null ? String(data.monto) : f.monto,
        categoria:   data.categoria  && CATEGORIAS[data.categoria] !== undefined ? data.categoria : f.categoria,
        tipo:        data.tipo       ?? f.tipo,
        subcategoria: '',
      }));
      setScanned(true);
    } catch (err: unknown) {
      const motivo = err instanceof Error ? err.message : 'No se pudieron completar los datos automáticamente.';
      setAviso(`${motivo} Completá los datos manualmente; el archivo sigue adjunto y se guardará con el gasto.`);
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.fecha || !form.categoria || !form.monto) {
      setError('Completá todos los campos obligatorios.');
      return;
    }
    const data = {
      fecha:        form.fecha,
      categoria:    form.categoria,
      subcategoria: form.subcategoria || null,
      descripcion:  form.descripcion.trim(),
      monto:        parseFloat(form.monto),
      pagado_por:   form.pagado_por as Gasto['pagado_por'],
      tipo:         form.tipo as Gasto['tipo'],
    };
    startTransition(async () => {
      try {
        const adjunto = new FormData();
        if (archivo) adjunto.append('file', archivo);
        if (initial) await editarGasto(initial.id, data, adjunto);
        else await agregarGasto(data, adjunto);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar el gasto. Intentá de nuevo.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Adjuntar comprobantes en gastos nuevos y existentes */}
        <div>
          <p className="label">Ticket o comprobante de pago</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              void handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = scanning || pending ? 'none' : 'copy';
              if (!scanning && !pending) setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragging(false);
              if (scanning || pending) return;
              if (e.dataTransfer.files.length > 1) {
                setError('Arrastrá una sola boleta por vez.');
                return;
              }
              void handleFile(e.dataTransfer.files[0]);
            }}
            disabled={scanning || pending}
            className={`w-full min-h-28 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-sm font-medium transition-colors
              ${dragging
                ? 'border-blue-500 bg-blue-100 text-blue-700 ring-2 ring-blue-200'
                : scanning
                ? 'border-blue-300 bg-blue-50 text-blue-500 cursor-wait'
                : scanned
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-500 hover:text-blue-600'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
            {dragging ? (
              <><ScanLine size={16} /> Soltá la boleta aquí</>
            ) : scanning ? (
              <><Loader2 size={16} className="animate-spin" /> Leyendo comprobante...</>
            ) : initial && archivo ? (
              <><CheckCircle2 size={16} /> Ticket adjunto — guardar cambios para subirlo</>
            ) : scanned ? (
              <><CheckCircle2 size={16} /> Datos cargados — revisá y completá quién pagó</>
            ) : (
              <><ScanLine size={16} /> Adjuntar comprobante de pago</>
            )}
            </span>
            <span className="text-xs font-normal">Arrastrá y soltá aquí una boleta, ticket, factura o comprobante de transferencia, o hacé clic para elegir el archivo.</span>
          </button>
          <p className="text-xs text-slate-500 mt-2">PDF, JPG, PNG, GIF o WebP · Hasta 3 MB. Se guarda al guardar el gasto.</p>
          {initial && <p className="text-xs text-slate-500 mt-1">Podés añadir un ticket en cualquier categoría sin modificar los datos del gasto.</p>}
          {archivo && (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <span className="break-all">Adjunto: {archivo.name}</span>
              <button type="button" className="text-red-600" disabled={scanning || pending} onClick={() => { setArchivo(null); setScanned(false); setAviso(''); }}>Quitar</button>
            </div>
          )}
          {initial && <a className="text-sm text-blue-600" href={`/gastos/pagos?gasto=${initial.id}`} target="_blank" rel="noreferrer">Ver comprobantes guardados</a>}
          {aviso && <p role="status" className="text-sm text-amber-700 mt-2">{aviso}</p>}
        </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Categoría *</label>
          <select
            className="input"
            value={form.categoria}
            onChange={(e) => { set('categoria', e.target.value); set('subcategoria', ''); }}
          >
            {Object.keys(CATEGORIAS).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {subcats.length > 0 && (
          <div>
            <label className="label">Subcategoría</label>
            <select className="input" value={form.subcategoria} onChange={(e) => set('subcategoria', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {subcats.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="label">Fecha *</label>
        <input type="date" className="input" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} required />
      </div>

      <div>
        <label className="label">Descripción</label>
        <input type="text" className="input" placeholder="Detalle del gasto (opcional)" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
      </div>

      <div>
        <label className="label">Monto (ARS) *</label>
        <MontoInput value={form.monto} onChange={(v) => set('monto', v)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Pagado por *</label>
          <select className="input" value={form.pagado_por} onChange={(e) => set('pagado_por', e.target.value)}>
            <option value="yo">Yo (65%)</option>
            <option value="socio">Luis (35%)</option>
          </select>
        </div>
        <div>
          <label className="label">Tipo *</label>
          <select className="input" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
            <option value="ordinario">Ordinario</option>
            <option value="extraordinario">Extraordinario</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary flex-1" disabled={pending || scanning}>
          {pending ? 'Guardando...' : initial ? 'Guardar cambios' : 'Agregar gasto'}
        </button>
      </div>
    </form>
  );
}
