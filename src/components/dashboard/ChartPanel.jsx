export default function ChartPanel({ title, subtitle, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5 ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
