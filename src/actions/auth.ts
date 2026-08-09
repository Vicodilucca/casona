'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signSession, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/session';
import { verifyPassword, hashPassword } from '@/lib/password';
import {
  contarIntentosFallidosRecientes,
  registrarIntentoLogin,
  getUsuarioPorEmail,
  registrarLoginExitoso,
  resetearPasswordUsuarioDb,
} from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { logAudit } from '@/lib/audit';

const MAX_INTENTOS = 8;
const VENTANA_MINUTOS = 15;

function getClientIp(): string {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const ip = getClientIp();

  const intentosFallidos = await contarIntentosFallidosRecientes(ip, VENTANA_MINUTOS).catch(() => 0);
  if (intentosFallidos >= MAX_INTENTOS) {
    redirect('/login?error=Demasiados+intentos.+Esper%C3%A1+unos+minutos+y+volv%C3%A9+a+intentar.');
  }

  const usuario = email ? await getUsuarioPorEmail(email) : null;
  const ok =
    !!usuario &&
    usuario.activo &&
    !!password &&
    (await verifyPassword(password, usuario.password_hash));

  await registrarIntentoLogin(ip, ok).catch(() => {});

  if (!ok || !usuario) {
    await logAudit(null, 'login_fallido', 'usuario', usuario?.id ?? null, { email });
    redirect('/login?error=Email+o+contraseña+incorrectos');
  }

  const token = await signSession(usuario.id, process.env.SESSION_SECRET!);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  await registrarLoginExitoso(usuario.id).catch(() => {});
  await logAudit({ id: usuario.id, email: usuario.email }, 'login', 'usuario', usuario.id, null);

  redirect('/');
}

export async function logoutAction() {
  cookies().delete(COOKIE_NAME);
  redirect('/login');
}

export async function cambiarMiPassword(passwordActual: string, passwordNueva: string) {
  const usuario = await requireAuth();

  const conHash = await getUsuarioPorEmail(usuario.email);
  if (!conHash || !(await verifyPassword(passwordActual, conHash.password_hash))) {
    throw new Error('La contraseña actual es incorrecta.');
  }
  if (passwordNueva.length < 8) {
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
  }

  const hash = await hashPassword(passwordNueva);
  await resetearPasswordUsuarioDb(usuario.id, hash);
  await logAudit(usuario, 'cambiar_password_propia', 'usuario', usuario.id, null);
}
