import type { ArchivoPago, ComprobanteReserva } from './db';

export async function leerArchivoPago(form?: FormData): Promise<ArchivoPago | undefined> {
  const file = form?.get('file');
  if (!file) return undefined;
  if (typeof file === 'string' || !file.size || file.size > 3 * 1024 * 1024) {
    throw new Error('El comprobante debe pesar entre 1 byte y 3 MB.');
  }
  const contenido = Buffer.from(await file.arrayBuffer());
  const hex = contenido.subarray(0, 12).toString('hex');
  const tipo = contenido.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf'
    : hex.startsWith('ffd8ff') ? 'image/jpeg'
    : hex.startsWith('89504e470d0a1a0a') ? 'image/png'
    : /^GIF8[79]a/.test(contenido.subarray(0, 6).toString()) ? 'image/gif'
    : contenido.subarray(0, 4).toString() === 'RIFF' && contenido.subarray(8, 12).toString() === 'WEBP' ? 'image/webp'
    : null;
  if (!tipo) throw new Error('Usá un PDF o una imagen JPG, PNG, GIF o WebP.');
  const nombre = file.name.split(/[\\/]/).pop()!.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 180) || 'comprobante';
  return { nombre, tipo, contenido };
}

export async function leerComprobantesReserva(form?: FormData): Promise<ComprobanteReserva[]> {
  const archivos: ComprobanteReserva[] = [];
  for (const concepto of ['reserva', 'saldo'] as const) {
    for (const file of form?.getAll(concepto) ?? []) {
      const adjunto = new FormData();
      adjunto.set('file', file);
      const archivo = await leerArchivoPago(adjunto);
      if (archivo) archivos.push({ ...archivo, concepto });
    }
  }
  if (archivos.reduce((total, archivo) => total + archivo.contenido.length, 0) > 3 * 1024 * 1024) {
    throw new Error('Los comprobantes juntos deben pesar como máximo 3 MB.');
  }
  return archivos;
}
