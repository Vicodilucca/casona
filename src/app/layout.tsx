export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import './globals.css';
import AdminShell from '@/components/AdminShell';
import { getReservasSaldoPendiente, getConsultasPendienteCount } from '@/lib/db';

export const metadata: Metadata = {
  title: 'La Casona de Río Grande — Gestión de alquiler',
  description: 'Plataforma de gestión de alquiler temporario',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [saldosPendientes, consultasPendienteCount] = await Promise.all([
    getReservasSaldoPendiente(),
    getConsultasPendienteCount(),
  ]);
  const saldoPendienteCount = saldosPendientes.length;
  return (
    <html lang="es">
      <body>
        <AdminShell
          saldoPendienteCount={saldoPendienteCount}
          consultasPendienteCount={consultasPendienteCount}
        >
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
