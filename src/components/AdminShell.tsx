'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function AdminShell({
  children,
  saldoPendienteCount,
  consultasPendienteCount,
}: {
  children: React.ReactNode;
  saldoPendienteCount: number;
  consultasPendienteCount: number;
}) {
  const path = usePathname();
  const isPublic =
    path === '/login' ||
    (path.startsWith('/consulta') && !path.startsWith('/consultas'));

  if (isPublic) return <>{children}</>;

  return (
    <>
      <div className="print:hidden">
        <Navbar
          saldoPendienteCount={saldoPendienteCount}
          consultasPendienteCount={consultasPendienteCount}
        />
      </div>
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8 print:p-0 print:max-w-none">
        {children}
      </main>
    </>
  );
}
