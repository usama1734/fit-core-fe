export default function DashboardCard({ title, value, subtitle, icon, trend, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold text-white sm:text-3xl">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          {trend && <p className="mt-2 text-xs text-teal-400">{trend}</p>}
        </div>
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
