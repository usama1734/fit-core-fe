import { useCallback, useEffect, useState } from 'react';
import * as membersApi from '../api/members.api.js';
import * as paymentsApi from '../api/payments.api.js';
import * as plansApi from '../api/plans.api.js';
import DataTable from '../components/ui/DataTable.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate, fullName } from '../utils/format.js';
import { ROLES } from '../utils/roles.js';

const statusColors = {
  COMPLETED: 'text-teal-400',
  PENDING: 'text-amber-400',
  FAILED: 'text-red-400',
  REFUNDED: 'text-slate-400',
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user.role === ROLES.ADMIN;
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutPlanId, setCheckoutPlanId] = useState('');
  const [checkoutMemberId, setCheckoutMemberId] = useState('');
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, pl, m] = await Promise.all([
        paymentsApi.listPayments(),
        plansApi.listPlans(),
        isAdmin ? membersApi.listMembers() : Promise.resolve([]),
      ]);
      setPayments(p);
      setPlans(pl.filter((x) => x.isActive));
      setMembers(m);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCheckout = async () => {
    if (!checkoutPlanId) return;
    if (isAdmin && !checkoutMemberId) {
      setError('Select a member to charge.');
      return;
    }
    setCheckoutLoading(true);
    setError('');
    try {
      const session = await paymentsApi.createCheckout(
        checkoutPlanId,
        isAdmin ? checkoutMemberId : undefined,
      );
      if (session.url) {
        window.location.href = session.url;
      } else {
        setError('No checkout URL returned. Configure Stripe on the server.');
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const columns = [
    {
      key: 'member',
      label: 'Member',
      render: (r) => fullName(r.member?.user),
    },
    { key: 'plan', label: 'Plan', render: (r) => r.membershipPlan?.name ?? '—' },
    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={statusColors[r.status] ?? 'text-slate-400'}>{r.status}</span>
      ),
    },
    { key: 'paidAt', label: 'Paid', render: (r) => formatDate(r.paidAt) },
    { key: 'created', label: 'Created', render: (r) => formatDate(r.createdAt) },
  ];

  const canCheckout = user.role === ROLES.MEMBER || user.role === ROLES.ADMIN;

  return (
    <div>
      <PageHeader title="Payments" description="Payment history and Stripe checkout" />

      {canCheckout && plans.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Stripe Checkout</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {isAdmin && (
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-400">Member</label>
                <select
                  value={checkoutMemberId}
                  onChange={(e) => setCheckoutMemberId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                >
                  <option value="">Choose a member…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {fullName(m.user)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex-1">
              <label className="mb-1 block text-xs text-slate-400">Select plan</label>
              <select
                value={checkoutPlanId}
                onChange={(e) => setCheckoutPlanId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              >
                <option value="">Choose a plan…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.price)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={
                !checkoutPlanId ||
                checkoutLoading ||
                (isAdmin && !checkoutMemberId)
              }
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
            >
              {checkoutLoading ? 'Redirecting…' : 'Pay with Stripe'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mb-4 text-red-400">{error}</p>}

      <h2 className="mb-4 text-lg font-semibold text-white">Payment History</h2>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable columns={columns} data={payments} emptyMessage="No payments" />
      )}
    </div>
  );
}
