'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

export default function ComprobanteInput({ label, value, onChange, disabled = false }: {
  label: string; value: File | null; onChange: (file: File | null) => void; disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const select = (files: FileList | null) => {
    if (disabled || !files?.length) return;
    if (files.length !== 1) { setError('Adjuntá un comprobante por vez en cada espacio.'); return; }
    const file = files[0];
    if (!file.size || file.size > 3 * 1024 * 1024) { setError('El archivo debe pesar entre 1 byte y 3 MB.'); return; }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'].includes(file.type)
      && !(file.type === '' && /\.(pdf|jpe?g|png|gif|webp)$/i.test(file.name))) {
      setError('Usá una imagen JPG, PNG, GIF, WebP o un PDF.'); return;
    }
    setError('');
    onChange(file);
  };
  return (
    <div className="space-y-2">
      <p className="label">{label}</p>
      <div onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = disabled ? 'none' : 'copy'; if (!disabled) setDragging(true); }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); setDragging(false); select(e.dataTransfer.files); }}>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" className="hidden"
          disabled={disabled} onChange={e => { select(e.target.files); e.target.value = ''; }} />
        <button type="button" disabled={disabled} onClick={() => input.current?.click()}
          className={`w-full min-h-24 rounded-xl border-2 border-dashed p-4 text-sm flex flex-col items-center justify-center gap-2 disabled:opacity-50 ${dragging ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-blue-400'}`}>
          <Upload size={20} />
          {dragging ? 'Soltá el comprobante aquí' : 'Arrastrá una imagen o PDF aquí, o hacé clic para elegirlo'}
        </button>
      </div>
      <p className="text-xs text-slate-500">Hasta 3 MB. Se adjunta al guardar, sin modificar los importes.</p>
      {value && <div className="flex items-center gap-2 text-sm"><span className="break-all">{value.name}</span><button type="button" disabled={disabled} onClick={() => { onChange(null); setError(''); }} className="text-red-600">Quitar</button></div>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
