import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, fullName } from '@utils/format.js';
import ChartPanel from './ChartPanel.jsx';

export default function RecentPaymentsPanel({ payments = [] }) {
  return (
    <ChartPanel title="Recent payments" subtitle="Latest completed transactions" className="h-full">
      <div className="mb-3 flex justify-end">
        <Link to="/payments" className="text-sm font-medium text-teal-400 hover:text-teal-300">
          View all →
        </Link>
      </div>
      {payments.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No payments yet</p>
      ) : (
        <ul className="divide-y divide-slate-800/80">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {fullName(payment.member?.user) || 'Unknown'}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {payment.membershipPlan?.name ?? 'Plan'} · {formatDate(payment.paidAt)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-teal-400">
                {formatCurrency(payment.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartPanel>
  );
}
