'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signSession, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/session';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;

  if (!password || password !== process.env.APP_PASSWORD) {
    redirect('/login?error=Contraseña+incorrecta');
  }

  const token = await signSession(process.env.SESSION_SECRET!);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  redirect('/');
}

export async function logoutAction() {
  cookies().delete(COOKIE_NAME);
  redirect('/login');
}