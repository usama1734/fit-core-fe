import { useAuth } from '@contexts/AuthContext.jsx';
import { fullName } from '@utils/format.js';

export default function Navbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {title && (
          <h1 className="truncate text-base font-semibold text-white sm:text-lg">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-3">
        <p className="hidden truncate text-sm font-medium text-white sm:block">{fullName(user)}</p>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-red-500/50 hover:text-red-400"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
