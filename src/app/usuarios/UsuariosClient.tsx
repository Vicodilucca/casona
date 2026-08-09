'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, KeyRound, Trash2, Power, X } from 'lucide-react';
import {
  crearUsuario, editarUsuario, setUsuarioActivo, resetearPasswordUsuario, eliminarUsuario,
} from '@/actions/usuarios';
import type { Usuario, Rol } from '@/lib/types';

function formatDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TempPasswordBanner({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start justify-between gap-3">
      <div className="text-sm text-amber-900">
        <p className="font-semibold">Contraseña temporal para {email}</p>
        <p className="mt-1">
          <code className="bg-white border border-amber-200 rounded px-2 py-1 font-mono text-sm select-all">{password}</code>
        </p>
        <p className="text-xs text-amber-700 mt-1.5">
          Comunicásela por un canal seguro. No se vuelve a mostrar — si se pierde, hay que resetearla de nuevo.
        </p>
      </div>
      <button onClick={onClose} className="text-amber-500 hover:text-amber-700 flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

function UsuarioForm({
  inicial, onCancel, onSaved,
}: {
  inicial?: Usuario;
  onCancel: () => void;
  onSaved: (tempPassword?: { email: string; password: string }) => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [email, setEmail] = useState(inicial?.email ?? '');
  const [rol, setRol] = useState<Rol>(inicial?.rol ?? 'admin');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (inicial) {
        await editarUsuario(inicial.id, nombre, email, rol);
        onSaved();
      } else {
        const { tempPassword } = await crearUsuario(nombre, email, rol);
        onSaved({ email, password: tempPassword });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <h2 className="font-semibold text-slate-800 text-sm">{inicial ? 'Editar usuario' : 'Nuevo usuario'}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
          <input
            required value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Rol</label>
          <select
            value={rol} onChange={(e) => setRol(e.target.value as Rol)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="admin">Administrador</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit" disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          {submitting ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel} className="text-slate-600 hover:bg-slate-100 rounded-lg px-4 py-2 text-sm font-medium">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function UsuariosClient({
  usuarios, usuarioActualId,
}: {
  usuarios: Usuario[];
  usuarioActualId: number;
}) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function refrescar() {
    setMostrarForm(false);
    setEditando(null);
    router.refresh();
  }

  async function handleToggleActivo(u: Usuario) {
    setError(null);
    setBusyId(u.id);
    try {
      await setUsuarioActivo(u.id, !u.activo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleResetPassword(u: Usuario) {
    setError(null);
    setBusyId(u.id);
    try {
      const { tempPassword: pw } = await resetearPasswordUsuario(u.id);
      setTempPassword({ email: u.email, password: pw });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleEliminar(u: Usuario) {
    if (!confirm(`¿Eliminar la cuenta de ${u.nombre} (${u.email})? Esta acción no se puede deshacer.`)) return;
    setError(null);
    setBusyId(u.id);
    try {
      await eliminarUsuario(u.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Usuarios</h1>
        {!mostrarForm && !editando && (
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nuevo usuario
          </button>
        )}
      </div>

      {tempPassword && (
        <TempPasswordBanner email={tempPassword.email} password={tempPassword.password} onClose={() => setTempPassword(null)} />
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {mostrarForm && (
        <UsuarioForm
          onCancel={() => setMostrarForm(false)}
          onSaved={(tp) => { if (tp) setTempPassword(tp); refrescar(); }}
        />
      )}
      {editando && (
        <UsuarioForm inicial={editando} onCancel={() => setEditando(null)} onSaved={() => refrescar()} />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5">Nombre</th>
                <th className="text-left px-4 py-2.5">Email</th>
                <th className="text-left px-4 py-2.5">Rol</th>
                <th className="text-left px-4 py-2.5">Estado</th>
                <th className="text-left px-4 py-2.5">Último login</th>
                <th className="text-right px-4 py-2.5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className={u.activo ? '' : 'opacity-50'}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {u.nombre} {u.id === usuarioActualId && <span className="text-xs text-slate-400">(vos)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.rol === 'superadmin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.rol === 'superadmin' ? 'Superadmin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{formatDate(u.last_login_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditando(u)}
                        disabled={busyId === u.id}
                        className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg p-1.5"
                        title="Editar"
                      >
                        <span className="text-xs font-medium px-1">Editar</span>
                      </button>
                      <button
                        onClick={() => handleResetPassword(u)}
                        disabled={busyId === u.id}
                        className="text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg p-1.5"
                        title="Resetear contraseña"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleActivo(u)}
                        disabled={busyId === u.id || u.id === usuarioActualId}
                        className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg p-1.5 disabled:opacity-30"
                        title={u.activo ? 'Desactivar' : 'Activar'}
                      >
                        <Power size={15} />
                      </button>
                      <button
                        onClick={() => handleEliminar(u)}
                        disabled={busyId === u.id || u.id === usuarioActualId}
                        className="text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg p-1.5 disabled:opacity-30"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
