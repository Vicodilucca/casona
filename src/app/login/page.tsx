import { loginAction } from '@/actions/auth';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏡</div>
          <h1 className="text-xl font-bold text-slate-800">La Casona de Río Grande</h1>
          <p className="text-sm text-slate-500 mt-1">Panel de gestión</p>
        </div>

        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {searchParams.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {decodeURIComponent(searchParams.error)}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
