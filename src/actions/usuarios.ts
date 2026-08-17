'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth-guard';
import { logAudit } from '@/lib/audit';
import { hashPassword, generateTempPassword } from '@/lib/password';
import {
  crearUsuarioDb,
  editarUsuarioDb,
  setUsuarioActivoDb,
  resetearPasswordUsuarioDb,
  eliminarUsuarioDb,
  contarSuperadminsActivos,
  getUsuarioPorEmail,
  getUsuarioPorId,
} from '@/lib/db';
import type { Rol, Seccion } from '@/lib/types';
import { SECCIONES } from '@/lib/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SECCIONES_VALIDAS = new Set(SECCIONES.map((s) => s.key));

function validarNombreEmail(nombre: string, email: string) {
  const n = nombre.trim();
  const e = email.trim().toLowerCase();
  if (!n) throw new Error('Falta el nombre.');
  if (!EMAIL_RE.test(e)) throw new Error('Email inválido.');
  return { nombre: n, email: e };
}

function validarPermisos(permisos: Seccion[]): Seccion[] {
  const limpios = Array.from(new Set(permisos)).filter((p) => SECCIONES_VALIDAS.has(p));
  if (limpios.length !== permisos.length) throw new Error('Hay un permiso inválido en la lista.');
  return limpios;
}

export async function crearUsuario(nombre: string, email: string, rol: Rol, permisos: Seccion[] = []) {
  const actor = await requireAuth('superadmin');
  const { nombre: n, email: e } = validarNombreEmail(nombre, email);
  const p = validarPermisos(permisos);

  const existente = await getUsuarioPorEmail(e);
  if (existente) throw new Error('Ya existe un usuario con ese email.');

  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  const creado = await crearUsuarioDb({ nombre: n, email: e, passwordHash: hash, rol, permisos: p });

  await logAudit(actor, 'crear', 'usuario', creado.id, { email: e, rol, permisos: p });
  revalidatePath('/usuarios');

  return { id: creado.id, tempPassword };
}

export async function editarUsuario(id: number, nombre: string, email: string, rol: Rol, permisos: Seccion[] = []) {
  const actor = await requireAuth('superadmin');
  const { nombre: n, email: e } = validarNombreEmail(nombre, email);
  const p = validarPermisos(permisos);

  if (actor.id === id && rol !== 'superadmin') {
    const otros = await contarSuperadminsActivos(id);
    if (otros === 0) throw new Error('No podés quitarte el rol de superadmin: sos el único activo.');
  }

  await editarUsuarioDb(id, { nombre: n, email: e, rol, permisos: p });
  await logAudit(actor, 'editar', 'usuario', id, { email: e, rol, permisos: p });
  revalidatePath('/usuarios');
}

export async function setUsuarioActivo(id: number, activo: boolean) {
  const actor = await requireAuth('superadmin');

  if (actor.id === id && !activo) {
    throw new Error('No podés desactivar tu propia cuenta.');
  }
  if (!activo) {
    const otros = await contarSuperadminsActivos(id);
    // Sólo bloquea si el usuario a desactivar era superadmin y no queda ningún otro.
    // contarSuperadminsActivos ya excluye a `id`, así que si da 0 y el usuario en
    // cuestión es superadmin, sería el último activo.
    const objetivo = await getUsuarioPorId(id);
    if (objetivo?.rol === 'superadmin' && otros === 0) {
      throw new Error('No podés desactivar al único superadmin activo.');
    }
  }

  await setUsuarioActivoDb(id, activo);
  await logAudit(actor, activo ? 'activar' : 'desactivar', 'usuario', id, null);
  revalidatePath('/usuarios');
}

export async function resetearPasswordUsuario(id: number) {
  const actor = await requireAuth('superadmin');
  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  await resetearPasswordUsuarioDb(id, hash);
  await logAudit(actor, 'resetear_password', 'usuario', id, null);
  revalidatePath('/usuarios');
  return { tempPassword };
}

export async function eliminarUsuario(id: number) {
  const actor = await requireAuth('superadmin');

  if (actor.id === id) throw new Error('No podés eliminar tu propia cuenta.');

  const objetivo = await getUsuarioPorId(id);
  if (objetivo?.rol === 'superadmin') {
    const otros = await contarSuperadminsActivos(id);
    if (otros === 0) throw new Error('No podés eliminar al único superadmin activo.');
  }

  await eliminarUsuarioDb(id);
  await logAudit(actor, 'eliminar', 'usuario', id, { email: objetivo?.email ?? null });
  revalidatePath('/usuarios');
}
