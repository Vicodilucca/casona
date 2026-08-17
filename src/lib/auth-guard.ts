import { cookies } from 'next/headers';
import { COOKIE_NAME, verifySession } from './session';
import { getUsuarioPorId } from './db';
import { permiso } from './types';
import type { Usuario, Rol, Seccion, Accion } from './types';

// Un superadmin tiene acceso a todo siempre; un admin solo a la
// sección+acción que tenga habilitada en usuario.permisos.
export function tienePermiso(usuario: Usuario, seccion: Seccion, accion: Accion = 'ver'): boolean {
  return usuario.rol === 'superadmin' || usuario.permisos.includes(permiso(seccion, accion));
}

// Next.js Server Actions son endpoints públicos por sí mismos — la protección
// de middleware.ts sólo cubre páginas. Toda action que mute datos o toda
// página sensible debe llamar a esto explícitamente. El rol, los permisos y
// el estado activo se resuelven siempre contra la DB (nunca desde el cookie)
// para que desactivar/degradar una cuenta tenga efecto inmediato.
export async function requireAuth(rolMinimo?: Rol, seccion?: Seccion, accion: Accion = 'ver'): Promise<Usuario> {
  const cookie = cookies().get(COOKIE_NAME)?.value;
  const session = cookie ? await verifySession(cookie, process.env.SESSION_SECRET!) : null;
  if (!session) throw new Error('No autorizado: sesión inválida.');

  const usuario = await getUsuarioPorId(session.uid);
  if (!usuario || !usuario.activo) throw new Error('No autorizado: cuenta inexistente o inactiva.');

  if (rolMinimo === 'superadmin' && usuario.rol !== 'superadmin') {
    throw new Error('No autorizado: se requiere rol superadmin.');
  }

  if (seccion && !tienePermiso(usuario, seccion, accion)) {
    throw new Error(`No autorizado: falta el permiso "${seccion}:${accion}".`);
  }

  return usuario;
}

// Para uso en Server Components (páginas): no lanza, devuelve null si no hay sesión válida.
export async function getCurrentUser(): Promise<Usuario | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}
