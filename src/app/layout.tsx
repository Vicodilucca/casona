import type { Metadata } from 'next';
import './globals.css';
import AdminShell from '@/components/AdminShell';
import { getReservasSaldoPendiente, getConsultasPendienteCount } from '@/lib/db';

export const metadata: Metadata = {
  title: 'La Casona de Río Grande — Gestión de alquiler',
  description: 'Plataforma de gestión de alquiler temporario',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const saldoPendienteCount = getReservasSaldoPendiente().length;
  const consultasPendienteCount = getConsultasPendienteCount();
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
