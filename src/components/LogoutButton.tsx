'use client';

import { logoutAction } from '@/actions/auth';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        title="Cerrar sesión"
      >
        <LogOut size={15} />
        <span className="hidden lg:inline">Salir</span>
      </button>
    </form>
  );
}
