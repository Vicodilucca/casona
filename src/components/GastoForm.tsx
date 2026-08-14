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
  const [scanned, setScanned] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const subcats = CATEGORIAS[form.categoria] ?? [];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanned(false);
    setError('');
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
      setError(err instanceof Error ? err.message : 'No se pudo leer el comprobante.');
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
      if (initial) await editarGasto(initial.id, data);
      else         await agregarGasto(data);
      onClose();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Escanear comprobante — solo en modo nuevo */}
      {!initial && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,image/heic,.pdf"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium transition-colors
              ${scanning
                ? 'border-blue-300 bg-blue-50 text-blue-500 cursor-wait'
                : scanned
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-500 hover:text-blue-600'
              }`}
          >
            {scanning ? (
              <><Loader2 size={16} className="animate-spin" /> Leyendo comprobante...</>
            ) : scanned ? (
              <><CheckCircle2 size={16} /> Datos cargados — revisá y completá quién pagó</>
            ) : (
              <><ScanLine size={16} /> Subir ticket / boleta / factura</>
            )}
          </button>
        </div>
      )}

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
        <button type="submit" className="btn-primary flex-1" disabled={pending}>
          {pending ? 'Guardando...' : initial ? 'Guardar cambios' : 'Agregar gasto'}
        </button>
      </div>
    </form>
  );
}
