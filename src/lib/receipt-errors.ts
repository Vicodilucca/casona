// Mensajes controlados: no devolver respuestas internas ni credenciales del proveedor.
export function errorLecturaComprobante(error: unknown): { status: number; code: string; message: string } {
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  if (status === 401 || status === 403) return {
    status: 503, code: 'lectura_no_configurada',
    message: 'La lectura automática no está disponible: hay que revisar la configuración de acceso del servicio.',
  };
  if (status === 429 || status === 529) return {
    status: 503, code: 'lectura_ocupada',
    message: 'El servicio de lectura automática está ocupado. Intentá de nuevo más tarde.',
  };
  if (status === 400 || status === 413 || status === 422) return {
    status: 422, code: 'lectura_rechazada',
    message: 'El servicio no pudo leer este archivo. Podés adjuntarlo y completar los datos manualmente.',
  };
  return {
    status: 503, code: 'lectura_no_disponible',
    message: 'La lectura automática falló o no respondió a tiempo.',
  };
}
