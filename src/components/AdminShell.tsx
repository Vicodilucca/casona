'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import type { Rol, Seccion } from '@/lib/types';

export default function AdminShell({
  children,
  saldoPendienteCount,
  consultasPendienteCount,
  usuarioNombre,
  usuarioRol,
  usuarioPermisos,
}: {
  children: React.ReactNode;
  saldoPendienteCount: number;
  consultasPendienteCount: number;
  usuarioNombre: string | null;
  usuarioRol: Rol | null;
  usuarioPermisos: Seccion[];
}) {
  const path = usePathname();
  const isPublic =
    path === '/login' ||
    (path.startsWith('/consulta') && !path.startsWith('/consultas'));

  if (isPublic || !usuarioNombre || !usuarioRol) return <>{children}</>;

  return (
    <>
      <div className="print:hidden">
        <Navbar
          saldoPendienteCount={saldoPendienteCount}
          consultasPendienteCount={consultasPendienteCount}
          usuarioNombre={usuarioNombre}
          usuarioRol={usuarioRol}
          usuarioPermisos={usuarioPermisos}
        />
      </div>
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8 print:p-0 print:max-w-none">
        {children}
      </main>
    </>
  );
}
