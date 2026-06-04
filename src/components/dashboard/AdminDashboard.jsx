import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as dashboardApi from '../../api/dashboard.api.js';
import { getApiError } from '../../api/client.js';
import { formatCurrency } from '../../utils/format.js';
import KpiStat from './KpiStat.jsx';
import RecentPaymentsPanel from './RecentPaymentsPanel.jsx';
import { IconActivity, IconAlert, IconCheck, IconCurrency, IconUsers } from './icons.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

const RANGE_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
];

export default function AdminDashboard() {
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dash = await dashboardApi.getAdminDashboard({ days });
      setData(dash);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <LoadingSpinner />;
  if (error && !data) {
    return <p className="rounded-lg bg-red-500/10 p-4 text-red-400">{error}</p>;
  }

  const kpis = data?.kpis ?? {};

  return (
    <div className="space-y-6 pb-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gym overview — members, attendance, and revenue
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-800 bg-slate-900/80 p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setDays(opt.days)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                days === opt.days
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {kpis.expiringMemberships > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-100">
              <strong className="text-amber-300">{kpis.expiringMemberships}</strong> membership
              {kpis.expiringMemberships === 1 ? '' : 's'} expiring within 7 days — follow up to
              retain members.
            </p>
          </div>
          <Link
            to="/members"
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-amber-600/25 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-600/35"
          >
            Review members
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat
          label="Active members"
          value={kpis.activeMembers ?? 0}
          hint={`${kpis.totalMembers ?? 0} total registered`}
          accent="teal"
          to="/members"
          icon={IconUsers}
        />
        <KpiStat
          label="In gym today"
          value={kpis.checkInsToday ?? 0}
          hint="Check-ins since midnight"
          accent="amber"
          to="/attendance"
          icon={IconCheck}
        />
        <KpiStat
          label="Revenue"
          value={formatCurrency(kpis.revenueInRange ?? 0)}
          hint={`Last ${days} days`}
          accent="violet"
          to="/payments"
          icon={IconCurrency}
        />
        <KpiStat
          label="Needs attention"
          value={(kpis.unpaidMembers ?? 0) + (kpis.expiringMemberships ?? 0)}
          hint={`${kpis.unpaidMembers ?? 0} unpaid · ${kpis.expiringMemberships ?? 0} expiring`}
          accent="rose"
          to="/members"
          icon={IconActivity}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentPaymentsPanel payments={data?.recentPayments} />
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
          <h2 className="text-base font-semibold text-white">Operations snapshot</h2>
          <p className="mt-0.5 text-sm text-slate-500">Staff & catalog</p>
          <dl className="mt-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <dt className="text-sm text-slate-400">Active trainers</dt>
              <dd className="text-lg font-semibold text-white">{kpis.activeTrainers ?? 0}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <dt className="text-sm text-slate-400">Expired memberships</dt>
              <dd className="text-lg font-semibold text-slate-300">{kpis.expiredMembers ?? 0}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-slate-400">Unpaid members</dt>
              <dd className="text-lg font-semibold text-rose-400">{kpis.unpaidMembers ?? 0}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/trainers"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-teal-500/40 hover:text-teal-400"
            >
              Trainers
            </Link>
            <Link
              to="/plans"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-teal-500/40 hover:text-teal-400"
            >
              Plans
            </Link>
            <Link
              to="/attendance"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-teal-500/40 hover:text-teal-400"
            >
              Attendance
            </Link>
            <Link
              to="/members"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-teal-500/40 hover:text-teal-400"
            >
              Members
            </Link>
            <Link
              to="/payments"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-teal-500/40 hover:text-teal-400"
            >
              Payments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
