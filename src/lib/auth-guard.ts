import { cookies } from 'next/headers';
import { COOKIE_NAME, verifySession } from './session';
import { getUsuarioPorId } from './db';
import type { Usuario, Rol, Seccion } from './types';

// Un superadmin tiene acceso a todo siempre; un admin solo a las secciones
// que tenga habilitadas en usuario.permisos.
export function tienePermiso(usuario: Usuario, seccion: Seccion): boolean {
  return usuario.rol === 'superadmin' || usuario.permisos.includes(seccion);
}

// Next.js Server Actions son endpoints públicos por sí mismos — la protección
// de middleware.ts sólo cubre páginas. Toda action que mute datos o toda
// página sensible debe llamar a esto explícitamente. El rol, los permisos y
// el estado activo se resuelven siempre contra la DB (nunca desde el cookie)
// para que desactivar/degradar una cuenta tenga efecto inmediato.
export async function requireAuth(rolMinimo?: Rol, seccion?: Seccion): Promise<Usuario> {
  const cookie = cookies().get(COOKIE_NAME)?.value;
  const session = cookie ? await verifySession(cookie, process.env.SESSION_SECRET!) : null;
  if (!session) throw new Error('No autorizado: sesión inválida.');

  const usuario = await getUsuarioPorId(session.uid);
  if (!usuario || !usuario.activo) throw new Error('No autorizado: cuenta inexistente o inactiva.');

  if (rolMinimo === 'superadmin' && usuario.rol !== 'superadmin') {
    throw new Error('No autorizado: se requiere rol superadmin.');
  }

  if (seccion && !tienePermiso(usuario, seccion)) {
    throw new Error(`No autorizado: falta el permiso "${seccion}".`);
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
