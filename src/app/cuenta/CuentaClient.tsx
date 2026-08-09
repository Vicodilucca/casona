'use client';

import { useState } from 'react';
import { cambiarMiPassword } from '@/actions/auth';
import type { Rol } from '@/lib/types';

export default function CuentaClient({
  nombre,
  email,
  rol,
}: {
  nombre: string;
  email: string;
  rol: Rol;
}) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nueva !== confirmacion) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      await cambiarMiPassword(actual, nueva);
      setOk(true);
      setActual('');
      setNueva('');
      setConfirmacion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Mi cuenta</h1>
        <p className="text-sm text-slate-500 mt-1">{nombre} · {email}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Rol: {rol === 'superadmin' ? 'Superadmin' : 'Administrador'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-800 text-sm">Cambiar contraseña</h2>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Contraseña actual</label>
          <input
            type="password"
            required
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            autoComplete="current-password"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Contraseña nueva</label>
          <input
            type="password"
            required
            minLength={8}
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            autoComplete="new-password"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Confirmar contraseña nueva</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            autoComplete="new-password"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        {ok && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Contraseña actualizada correctamente.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          {submitting ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  );
}
