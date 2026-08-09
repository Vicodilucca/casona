export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import './globals.css';
import AdminShell from '@/components/AdminShell';
import { getReservasSaldoPendiente, getConsultasPendienteCount } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'La Casona de Río Grande — Gestión de alquiler',
  description: 'Plataforma de gestión de alquiler temporario',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [saldosPendientes, consultasPendienteCount, usuario] = await Promise.all([
    getReservasSaldoPendiente().catch(() => []),
    getConsultasPendienteCount().catch(() => 0),
    getCurrentUser().catch(() => null),
  ]);
  const saldoPendienteCount = saldosPendientes.length;
  return (
    <html lang="es">
      <body>
        <AdminShell
          saldoPendienteCount={saldoPendienteCount}
          consultasPendienteCount={consultasPendienteCount}
          usuarioNombre={usuario?.nombre ?? null}
          usuarioRol={usuario?.rol ?? null}
        >
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
