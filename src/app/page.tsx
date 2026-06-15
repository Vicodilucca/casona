import { getReservas, getGastos, getSumIngresos, getSumGastos, getReservasSaldoPendiente } from '@/lib/db';
import { formatARS, formatDate, getCurrentMonth, getNights } from '@/lib/utils';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Wallet, CircleDollarSign, ArrowRight } from 'lucide-react';

export default async function Dashboard() {
  const { desde, hasta } = getCurrentMonth();

  const [ingresosMes, gastosMes, gastos, saldosPendientes] = await Promise.all([
    getSumIngresos(desde, hasta),
    getSumGastos(desde, hasta),
    getGastos(),
    getReservasSaldoPendiente(),
  ]);

  const balanceMes = ingresosMes - gastosMes;
  const ultGastos = gastos.slice(0, 5);

  const hoy = new Date().toISOString().split('T')[0];
  const proximas = (await getReservas(hoy, '2099-12-31'))
    .filter((r) => r.estado === 'confirmada' && r.fecha_inicio >= hoy)
    .slice(0, 4);

  const totalSaldoPendiente = saldosPendientes.reduce(
    (sum, r) => sum + (r.saldo_pendiente ?? 0), 0
  );

  const stats = [
    {
      label: 'Ingresos del mes',
      value: formatARS(ingresosMes),
      icon: TrendingUp,
      color: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-100',
      href: null,
    },
    {
      label: 'Gastos del mes',
      value: formatARS(gastosMes),
      icon: TrendingDown,
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-100',
      href: null,
    },
    {
      label: 'Balance del mes',
      value: formatARS(balanceMes),
      icon: Wallet,
      color: balanceMes >= 0 ? 'text-blue-700' : 'text-red-700',
      bg: balanceMes >= 0 ? 'bg-blue-50' : 'bg-red-50',
      border: balanceMes >= 0 ? 'border-blue-100' : 'border-red-100',
      href: null,
    },
    {
      label: 'Saldos a cobrar',
      value: formatARS(totalSaldoPendiente),
      sub: `${saldosPendientes.length} reserva${saldosPendientes.length !== 1 ? 's' : ''}`,
      icon: CircleDollarSign,
      color: saldosPendientes.length > 0 ? 'text-amber-700' : 'text-slate-500',
      bg: saldosPendientes.length > 0 ? 'bg-amber-50' : 'bg-slate-50',
      border: saldosPendientes.length > 0 ? 'border-amber-200' : 'border-slate-100',
      href: '/saldo',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Resumen del mes actual</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub, icon: Icon, color, bg, border, href }) => {
          const inner = (
            <>
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-xs text-slate-500 mb-0.5">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </>
          );
          return href ? (
            <Link key={label} href={href} className={`card p-4 border ${border} hover:shadow-md transition-shadow`}>
              {inner}
            </Link>
          ) : (
            <div key={label} className={`card p-4 border ${border}`}>
              {inner}
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Próximas reservas */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Próximas reservas</h2>
            <Link href="/reservas" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          {proximas.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No hay reservas próximas</p>
          ) : (
            <div className="space-y-2">
              {proximas.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.huesped}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)} · {getNights(r.fecha_inicio, r.fecha_fin)} días
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-700">{formatARS(r.monto)}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      r.plataforma === 'airbnb' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {r.plataforma === 'airbnb' ? 'Airbnb' : 'Particular'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos gastos */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Últimos gastos</h2>
            <Link href="/gastos" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {ultGastos.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No hay gastos registrados</p>
          ) : (
            <div className="space-y-2">
              {ultGastos.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{g.descripcion}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(g.fecha)} · {g.categoria}
                      {g.subcategoria ? ` / ${g.subcategoria}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-700">{formatARS(g.monto)}</p>
                    <p className="text-xs text-slate-400">{g.pagado_por === 'yo' ? 'Yo' : 'Socio'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
