import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as paymentsApi from '../api/payments.api.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getApiError } from '../api/client.js';
import { formatDateShort } from '../utils/format.js';
import { formatMemberPaymentStatus } from '../utils/paymentStatus.js';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(!!sessionId);
  const [error, setError] = useState('');
  const [planName, setPlanName] = useState('');
  const [membershipEnd, setMembershipEnd] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setError('Missing payment session. Return from Stripe checkout or contact support.');
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function confirm() {
      setLoading(true);
      setError('');
      try {
        const result = await paymentsApi.confirmCheckout(sessionId);
        if (cancelled) return;
        const member = result.member ?? result.payment?.member;
        const plan = member?.membershipPlan;
        setPlanName(plan?.name ?? 'Your plan');
        setMembershipEnd(member?.membershipEnd ?? null);
        setPaymentStatus(member?.paymentStatus ?? '');
        await refreshUser();
      } catch (err) {
        if (!cancelled) setError(getApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    confirm();
    return () => {
      cancelled = true;
    };
  }, [sessionId, refreshUser, retryKey]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <PageHeader title="Payment successful" description="Your membership payment was received." />

      {loading && <LoadingSpinner />}

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && (
        <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-8">
          <p className="text-4xl" aria-hidden>
            ✓
          </p>
          <p className="mt-4 text-white">
            {planName
              ? `${planName} is now active on your account.`
              : 'Your membership has been activated.'}
          </p>
          {paymentStatus && (
            <p className="mt-2 text-sm text-teal-400">
              Status: {formatMemberPaymentStatus(paymentStatus)}
            </p>
          )}
          {membershipEnd && (
            <p className="mt-2 text-sm text-slate-400">
              Valid until {formatDateShort(membershipEnd)}
            </p>
          )}
        </div>
      )}

      {!loading && error && (
        <div className="mb-4 space-y-3">
          <p className="text-sm text-slate-400">
            Stripe charged your card, but the app could not activate your plan yet. Restart the
            API server if you are on localhost, then retry below.
          </p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
          >
            Retry activation
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/profile"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
        >
          View profile
        </Link>
        <Link
          to="/plans"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Membership plans
        </Link>
        <Link
          to="/payments"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Payment history
        </Link>
      </div>
    </div>
  );
}
