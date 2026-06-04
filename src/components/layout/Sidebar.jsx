import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROLES } from '../../utils/roles.js';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: [ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER] },
  { to: '/profile', label: 'My Profile', icon: '👤', roles: [ROLES.MEMBER, ROLES.TRAINER] },
  { to: '/members', label: 'Members', icon: '👥', roles: [ROLES.ADMIN, ROLES.TRAINER] },
  { to: '/trainers', label: 'Trainers', icon: '🏋️', roles: [ROLES.ADMIN] },
  { to: '/plans', label: 'Plans', icon: '📋', roles: [ROLES.ADMIN, ROLES.MEMBER] },
  { to: '/attendance', label: 'Attendance', icon: '✅', roles: [ROLES.ADMIN, ROLES.TRAINER, ROLES.MEMBER] },
  {
    to: '/payments',
    label: 'Payments',
    icon: '💳',
    roles: [ROLES.ADMIN, ROLES.MEMBER],
    adminLabel: 'Payment history',
  },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
            FC
          </span>
          <div>
            <p className="font-bold text-white">FitCore</p>
            <p className="text-xs text-slate-500">Gym Management</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-teal-600/20 text-teal-400'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              {user?.role === ROLES.ADMIN && item.adminLabel ? item.adminLabel : item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
      </aside>
    </>
  );
}
