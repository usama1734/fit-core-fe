export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent = 'teal',
  className = '',
  onClick,
}) {
  const accents = {
    teal: 'from-teal-500/20 to-transparent border-teal-500/20',
    amber: 'from-amber-500/20 to-transparent border-amber-500/20',
    violet: 'from-violet-500/20 to-transparent border-violet-500/20',
    rose: 'from-rose-500/20 to-transparent border-rose-500/20',
  };

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group w-full rounded-2xl border bg-gradient-to-br p-5 text-left shadow-lg transition hover:border-teal-500/30 hover:shadow-teal-900/20 ${
        accents[accent] ?? accents.teal
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {value}
          </p>
          {subtitle && <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>}
          {trend && <p className="mt-2 text-xs font-medium text-teal-400">{trend}</p>}
        </div>
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-xl ring-1 ring-slate-700/80 transition group-hover:bg-teal-500/10">
            {icon}
          </div>
        )}
      </div>
    </Tag>
  );
}
