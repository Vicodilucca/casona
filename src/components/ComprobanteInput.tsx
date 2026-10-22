'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

export default function ComprobanteInput({ label, value, onChange, disabled = false }: {
  label: string; value: File[]; onChange: (files: File[]) => void; disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const select = (files: FileList | null) => {
    if (disabled || !files?.length) return;
    const nuevos = Array.from(files);
    for (const file of nuevos) {
      if (!file.size || file.size > 3 * 1024 * 1024) { setError('Cada archivo debe pesar entre 1 byte y 3 MB.'); return; }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'].includes(file.type)
        && !(file.type === '' && /\.(pdf|jpe?g|png|gif|webp)$/i.test(file.name))) {
        setError('Usá imágenes JPG, PNG, GIF, WebP o archivos PDF.'); return;
      }
    }
    const seleccion = [...value];
    for (const file of nuevos) {
      if (!seleccion.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) seleccion.push(file);
    }
    if (seleccion.reduce((total, file) => total + file.size, 0) > 3 * 1024 * 1024) {
      setError('Los comprobantes juntos deben pesar como máximo 3 MB. Los que ya elegiste se conservan.'); return;
    }
    setError('');
    onChange(seleccion);
  };
  return (
    <div className="space-y-2">
      <p className="label">{label}</p>
      <div onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = disabled ? 'none' : 'copy'; if (!disabled) setDragging(true); }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); setDragging(false); select(e.dataTransfer.files); }}>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" className="hidden"
          disabled={disabled} onChange={e => { select(e.target.files); e.target.value = ''; }} />
        <button type="button" disabled={disabled} onClick={() => input.current?.click()}
          className={`w-full min-h-24 rounded-xl border-2 border-dashed p-4 text-sm flex flex-col items-center justify-center gap-2 disabled:opacity-50 ${dragging ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-blue-400'}`}>
          <Upload size={20} />
          {dragging ? 'Soltá los comprobantes aquí' : value.length ? 'Agregar más comprobantes: arrastrá o hacé clic' : 'Arrastrá uno o varios tickets aquí, o hacé clic para elegirlos'}
        </button>
      </div>
      <p className="text-xs text-slate-500">Podés adjuntar varios tickets. Máximo 3 MB en total por guardado. Se guardan sin modificar los importes.</p>
      {value.length > 0 && <p role="status" className="text-xs text-slate-600">{value.length} comprobante{value.length === 1 ? '' : 's'} seleccionado{value.length === 1 ? '' : 's'}</p>}
      {value.map((file, index) => <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-2 text-sm"><span className="break-all">{file.name}</span><button type="button" disabled={disabled} aria-label={`Quitar ${file.name}`} onClick={() => { onChange(value.filter((_, i) => i !== index)); setError(''); }} className="text-red-600">Quitar</button></div>)}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
