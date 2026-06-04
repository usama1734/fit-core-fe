import { Link } from 'react-router-dom';

const accents = {
  teal: {
    ring: 'ring-teal-500/20',
    glow: 'from-teal-500/10',
    dot: 'bg-teal-400',
  },
  amber: {
    ring: 'ring-amber-500/20',
    glow: 'from-amber-500/10',
    dot: 'bg-amber-400',
  },
  violet: {
    ring: 'ring-violet-500/20',
    glow: 'from-violet-500/10',
    dot: 'bg-violet-400',
  },
  rose: {
    ring: 'ring-rose-500/20',
    glow: 'from-rose-500/10',
    dot: 'bg-rose-400',
  },
};

export default function KpiStat({ label, value, hint, accent = 'teal', to, icon: Icon }) {
  const style = accents[accent] ?? accents.teal;
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{value}</p>
          {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.glow} to-transparent ring-1 ${style.ring}`}
          >
            <Icon className={`h-5 w-5 ${style.dot.replace('bg-', 'text-')}`} />
          </div>
        )}
      </div>
      <div className={`mt-4 h-1 w-12 rounded-full ${style.dot}`} />
    </>
  );

  const className = `block rounded-2xl border border-slate-800/80 bg-gradient-to-br ${style.glow} to-slate-900/80 p-5 transition hover:border-slate-700`;

  if (to) {
    return (
      <Link to={to} className={`${className} hover:shadow-lg hover:shadow-teal-900/10`}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
