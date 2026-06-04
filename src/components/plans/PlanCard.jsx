import { formatCurrency } from '../../utils/format.js';

export default function PlanCard({
  plan,
  isCurrent = false,
  onSubscribe,
  onEdit,
  onDeactivate,
  showAdminActions = false,
  checkoutLoading = false,
}) {
  return (
    <article
      className={`flex flex-col rounded-2xl border bg-slate-900/60 p-6 transition hover:border-teal-500/40 ${
        isCurrent ? 'border-teal-500 ring-1 ring-teal-500/30' : 'border-slate-800'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          {plan.description && (
            <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
          )}
        </div>
        {isCurrent && (
          <span className="shrink-0 rounded-full bg-teal-500/20 px-2.5 py-1 text-xs font-medium text-teal-400">
            Current
          </span>
        )}
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold text-white">{formatCurrency(plan.price)}</p>
        <p className="text-sm text-slate-500">{plan.durationDays} days</p>
      </div>

      {plan.features?.length > 0 && (
        <ul className="mb-6 flex-1 space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="mt-0.5 text-teal-400" aria-hidden>
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        {onSubscribe && plan.isActive && (
          <button
            type="button"
            onClick={() => onSubscribe(plan)}
            disabled={checkoutLoading || isCurrent}
            className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkoutLoading ? 'Redirecting…' : isCurrent ? 'Current plan' : 'Subscribe with Stripe'}
          </button>
        )}

        {showAdminActions && (
          <>
            <button
              type="button"
              onClick={() => onEdit?.(plan)}
              className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Edit
            </button>
            {plan.isActive && (
              <button
                type="button"
                onClick={() => onDeactivate?.(plan)}
                className="rounded-lg border border-red-500/40 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
              >
                Deactivate
              </button>
            )}
          </>
        )}
      </div>

      {!plan.isActive && (
        <p className="mt-3 text-xs text-slate-500">This plan is no longer available.</p>
      )}
    </article>
  );
}
