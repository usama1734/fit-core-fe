import { Link } from 'react-router-dom';
import { ROLES } from '../../utils/roles.js';

const actionsByRole = {
  [ROLES.ADMIN]: [
    { to: '/members', label: 'Add member', desc: 'Create or invite', icon: '👥', primary: true },
    {
      to: '/attendance',
      label: 'Check-in desk',
      desc: 'Scan or manual',
      icon: '✅',
      primary: true,
    },
    { to: '/plans', label: 'Plans', desc: 'Manage pricing', icon: '📋' },
    { to: '/payments', label: 'Payments', desc: 'View history', icon: '💳' },
    { to: '/trainers', label: 'Trainers', desc: 'Staff roster', icon: '🏋️' },
  ],
  [ROLES.TRAINER]: [
    { to: '/attendance', label: 'Check-in', desc: 'Scan member QR', icon: '✅', primary: true },
    { to: '/members', label: 'My members', desc: 'Roster & visits', icon: '👥', primary: true },
    { to: '/profile', label: 'Profile', desc: 'Your account', icon: '👤' },
  ],
  [ROLES.MEMBER]: [
    {
      to: '/attendance',
      label: 'Check in',
      desc: 'Scan gym QR in app',
      icon: '✅',
      primary: true,
    },
    { to: '/plans', label: 'Plans', desc: 'Subscribe', icon: '📋', primary: true },
    { to: '/payments', label: 'Payments', desc: 'Receipts', icon: '💳' },
    { to: '/profile', label: 'Profile', desc: 'Your account', icon: '👤' },
  ],
};

export default function QuickActions({ role }) {
  const actions = actionsByRole[role] ?? [];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Quick actions
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {actions.map((action) => (
          <Link
            key={action.to + action.label}
            to={action.to}
            className={`flex min-h-[72px] items-center gap-3 rounded-xl border p-3 transition ${
              action.primary
                ? 'border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20'
                : 'border-slate-700/80 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/80'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900/80 text-lg">
              {action.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{action.label}</p>
              <p className="text-xs text-slate-500">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
