import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as membersApi from '@api/members.api.js';
import * as paymentsApi from '@api/payments.api.js';
import * as plansApi from '@api/plans.api.js';
import DataTable from '@components/ui/DataTable.jsx';
import LoadingSpinner from '@components/ui/LoadingSpinner.jsx';
import ModalForm from '@components/ui/ModalForm.jsx';
import PageHeader from '@components/ui/PageHeader.jsx';
import { useAuth } from '@contexts/AuthContext.jsx';
import { getApiError } from '@api/client.js';
import { usePaginatedList } from '@hooks/usePaginatedList.js';
import { exportToCsv } from '@utils/csvExport.js';
import { formatCurrency, formatDate, fullName } from '@utils/format.js';
import { formatMemberPaymentStatus, memberPaymentStatusClass } from '@utils/paymentStatus.js';
import { ROLES } from '@utils/roles.js';

const statusColors = {
  COMPLETED: 'text-teal-400',
  PENDING: 'text-amber-400',
  FAILED: 'text-red-400',
  REFUNDED: 'text-slate-400',
};

const statusHints = {
  PENDING: 'Checkout started — finish payment on Stripe or sync below',
  COMPLETED: 'Paid and membership activated',
  FAILED: 'Checkout cancelled or expired — not charged',
  REFUNDED: 'Refunded',
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user.role === ROLES.ADMIN;
  const isMember = user.role === ROLES.MEMBER;
  const [syncing, setSyncing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    async function loadAux() {
      try {
        const [m, p] = await Promise.all([
          membersApi.listMembers({ page: 1, pageSize: 100 }),
          plansApi.listPlans({ page: 1, pageSize: 100 }),
        ]);
        if (!cancelled) {
          setMembers(m.items);
          setPlans(p.items);
        }
      } catch {
        /* modal will show API error on submit */
      }
    }
    loadAux();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const fetchPayments = useCallback((params) => paymentsApi.listPayments(params), []);

  const {
    items: payments,
    meta,
    page,
    pageSize,
    setPage,
    setPageSize,
    loading,
    error,
    setError,
    reload,
  } = usePaginatedList(fetchPayments);

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${fullName(m.user)} (${m.user?.email})`,
  }));

  const planOptions = [
    { value: '', label: 'No plan (amount only)' },
    ...plans.map((p) => ({
      value: p.id,
      label: `${p.name} ($${p.price})`,
    })),
  ];

  const handleManualPayment = async (values) => {
    setSaving(true);
    try {
      await paymentsApi.createManualPayment({
        memberId: values.memberId,
        planId: values.planId || undefined,
        amount: Number(values.amount),
        status: values.status || 'COMPLETED',
      });
      await reload();
    } catch (err) {
      throw new Error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      await paymentsApi.syncPayments({ page, pageSize });
      await reload();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSyncing(false);
    }
  };

  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;

  const handleExportCsv = async () => {
    setError('');
    try {
      const result = await paymentsApi.listPayments({ page: 1, pageSize: 100 });
      exportToCsv('payments-export', result.items, [
        {
          label: 'Member',
          value: (r) => fullName(r.member?.user),
        },
        { label: 'Plan', value: (r) => r.membershipPlan?.name ?? '' },
        { label: 'Amount', value: (r) => r.amount },
        { label: 'Status', value: (r) => r.status },
        { label: 'Paid at', value: (r) => r.paidAt ?? '' },
        { label: 'Created', value: (r) => r.createdAt },
      ]);
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const columns = [
    ...(isAdmin
      ? [
          {
            key: 'member',
            label: 'Member',
            render: (r) => fullName(r.member?.user),
          },
          {
            key: 'memberPayment',
            label: 'Member status',
            render: (r) => (
              <span className={memberPaymentStatusClass(r.member?.paymentStatus)}>
                {formatMemberPaymentStatus(r.member?.paymentStatus)}
              </span>
            ),
          },
        ]
      : []),
    { key: 'plan', label: 'Plan', render: (r) => r.membershipPlan?.name ?? '—' },
    { key: 'amount', label: 'Amount', render: (r) => formatCurrency(r.amount) },
    {
      key: 'status',
      label: 'Payment',
      render: (r) => (
        <div>
          <span className={statusColors[r.status] ?? 'text-slate-400'}>{r.status}</span>
          {isMember && statusHints[r.status] && (
            <p className="mt-0.5 text-xs text-slate-500">{statusHints[r.status]}</p>
          )}
        </div>
      ),
    },
    { key: 'paidAt', label: 'Paid', render: (r) => formatDate(r.paidAt) },
    { key: 'created', label: 'Created', render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div className="w-full max-w-full">
      <PageHeader
        title={isAdmin ? 'Payment history' : 'My payments'}
        description={
          isAdmin
            ? 'View all member payments and record cash or offline payments'
            : 'Your payment history and membership purchases'
        }
        actions={
          isAdmin ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={handleExportCsv}
                className="min-h-[44px] rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => setManualOpen(true)}
                className="min-h-[44px] rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
              >
                Record payment
              </button>
            </div>
          ) : (
            isMember && (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                {pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="min-h-[44px] rounded-lg border border-amber-500/50 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
                  >
                    {syncing ? 'Syncing…' : 'Sync with Stripe'}
                  </button>
                )}
                <Link
                  to="/plans"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-500"
                >
                  Buy or upgrade plan
                </Link>
              </div>
            )
          )
        }
      />

      <ModalForm
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Record manual payment"
        loading={saving}
        submitLabel="Record"
        fields={[
          {
            name: 'memberId',
            label: 'Member',
            type: 'select',
            required: true,
            options: memberOptions,
          },
          {
            name: 'planId',
            label: 'Plan (optional)',
            type: 'select',
            options: planOptions,
          },
          {
            name: 'amount',
            label: 'Amount (USD)',
            type: 'number',
            required: true,
            min: 0.01,
            step: 0.01,
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'REFUNDED', label: 'Refunded' },
            ],
          },
        ]}
        initialValues={{ status: 'COMPLETED' }}
        onSubmit={handleManualPayment}
      />

      {isMember && pendingCount > 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200/90">
          <p className="font-medium text-amber-300">
            {pendingCount} pending checkout{pendingCount > 1 ? 's' : ''}
          </p>
          <p className="mt-1 text-slate-300">
            <strong>PENDING</strong> means you clicked Subscribe and we created a Stripe checkout,
            but payment was not confirmed in FitCore yet. Common causes: closing the tab before
            paying, cancelling checkout, or the success page failing to activate your plan. If you
            already paid, click <strong>Sync with Stripe</strong> — paid sessions will move to{' '}
            <strong>COMPLETED</strong> and your plan will update.
          </p>
        </div>
      )}

      {error && <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

      {loading && payments.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={payments}
          emptyMessage="No payments yet"
          pagination={{
            page,
            pageSize,
            total: meta.total,
            totalPages: meta.totalPages,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      )}
    </div>
  );
}
