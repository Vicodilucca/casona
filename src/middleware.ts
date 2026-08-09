import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas: página de consulta de huéspedes
  const isPublicConsulta = pathname.startsWith('/consulta') && !pathname.startsWith('/consultas');

  if (isPublicConsulta) {
    return NextResponse.next();
  }

  // Si ya está autenticado y va al login, redirigir al home
  if (pathname === '/login') {
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    if (cookie) {
      const session = await verifySession(cookie, process.env.SESSION_SECRET!);
      if (session) return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Verificar sesión para todas las demás rutas.
  // Esto solo confirma que hay una sesión firmada y no vencida — el rol y el
  // estado activo/inactivo del usuario se revalidan contra la base de datos
  // en cada Server Action vía requireAuth(), que es la autorización real.
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const session = await verifySession(cookie, process.env.SESSION_SECRET!);
  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cotizacion).*)'],
};