'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Receipt, BarChart3, CircleDollarSign, Menu, X, Calendar, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import LogoutButton from './LogoutButton';

const links = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/reservas', label: 'Reservas', icon: CalendarDays },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
  { href: '/saldo', label: 'Saldo', icon: CircleDollarSign, badge: 'saldo' as const },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/consultas', label: 'Consultas', icon: MessageSquare, badge: 'consultas' as const },
];

export default function Navbar({
  saldoPendienteCount,
  consultasPendienteCount,
}: {
  saldoPendienteCount: number;
  consultasPendienteCount: number;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  function getBadgeCount(badge?: 'saldo' | 'consultas') {
    if (badge === 'saldo') return saldoPendienteCount;
    if (badge === 'consultas') return consultasPendienteCount;
    return 0;
  }

  function badgeClass(badge?: 'saldo' | 'consultas') {
    if (badge === 'consultas') return 'bg-amber-500';
    return 'bg-red-500';
  }

  return (
    <>
      {/* Desktop top nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-bold text-blue-700 text-base tracking-tight">
            🏡 La Casona de Río Grande
          </span>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon, badge }) => {
              const count = getBadgeCount(badge);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    path === href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {badge && count > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${badgeClass(badge)} text-white text-[10px] font-bold px-1`}>
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop logout */}
          <div className="hidden md:flex items-center ml-2 pl-2 border-l border-slate-200">
            <LogoutButton />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <nav className="md:hidden border-t border-slate-100 bg-white px-4 pb-3 pt-2 flex flex-col gap-1">
            {links.map(({ href, label, icon: Icon, badge }) => {
              const count = getBadgeCount(badge);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`relative flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    path === href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                  {badge && count > 0 && (
                    <span className={`ml-auto min-w-[20px] h-[20px] flex items-center justify-center rounded-full ${badgeClass(badge)} text-white text-xs font-bold px-1`}>
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <LogoutButton />
            </div>
          </nav>
        )}
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex">
        {links.map(({ href, label, icon: Icon, badge }) => {
          const count = getBadgeCount(badge);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                path === href ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={path === href ? 2.5 : 1.8} />
                {badge && count > 0 && (
                  <span className={`absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full ${badgeClass(badge)} text-white text-[9px] font-bold px-0.5`}>
                    {count}
                  </span>
                )}
              </span>
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
