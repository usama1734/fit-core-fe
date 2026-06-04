import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import * as attendanceApi from '../api/attendance.api.js';
import { getApiError, getApiErrorCode } from '../api/client.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatDate } from '../utils/format.js';
import { ROLES } from '../utils/roles.js';

const STATUS = {
  idle: 'idle',
  loading: 'loading',
  success: 'success',
  alreadyIn: 'alreadyIn',
  payment: 'payment',
  expired: 'expired',
  invalidLink: 'invalidLink',
  forbidden: 'forbidden',
  error: 'error',
};

export default function MemberCheckInPage() {
  const [searchParams] = useSearchParams();
  const venueToken = searchParams.get('k')?.trim() ?? '';
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState(STATUS.idle);
  const [message, setMessage] = useState('');
  const [record, setRecord] = useState(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (!venueToken) {
      setStatus(STATUS.invalidLink);
      return;
    }
    if (authLoading) return;
    if (!user) return;
    if (user.role !== ROLES.MEMBER) {
      setStatus(STATUS.forbidden);
      return;
    }
    if (attempted.current) return;
    attempted.current = true;

    const run = async () => {
      setStatus(STATUS.loading);
      setMessage('');
      try {
        const result = await attendanceApi.checkIn({
          venueToken,
          method: 'QR',
        });
        setRecord(result);
        setStatus(STATUS.success);
      } catch (err) {
        const code = getApiErrorCode(err);
        const msg = getApiError(err);
        if (code === 'ALREADY_CHECKED_IN') {
          setStatus(STATUS.alreadyIn);
          setMessage(msg);
          return;
        }
        if (code === 'PAYMENT_REQUIRED') {
          setStatus(STATUS.payment);
          setMessage(msg);
          return;
        }
        if (code === 'MEMBERSHIP_EXPIRED') {
          setStatus(STATUS.expired);
          setMessage(msg);
          return;
        }
        if (code === 'INVALID_VENUE_QR') {
          setStatus(STATUS.invalidLink);
          setMessage(msg);
          return;
        }
        setStatus(STATUS.error);
        setMessage(msg);
      }
    };

    run();
  }, [venueToken, user, authLoading]);

  if (!venueToken) {
    return (
      <CheckInShell>
        <ResultCard title="Invalid check-in link" tone="error">
          <p className="text-slate-300">
            This QR code is missing required information. Ask staff for a new poster.
          </p>
        </ResultCard>
      </CheckInShell>
    );
  }

  if (authLoading) {
    return (
      <CheckInShell>
        <LoadingSpinner />
      </CheckInShell>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(`/check-in?k=${encodeURIComponent(venueToken)}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (user.role !== ROLES.MEMBER) {
    return (
      <CheckInShell>
        <ResultCard title="Staff account" tone="neutral">
          <p className="text-slate-300">
            Gym entrance QR is for members. Use the attendance desk to scan member codes.
          </p>
          <Link
            to="/attendance"
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-teal-600 font-medium text-white hover:bg-teal-500"
          >
            Open attendance desk
          </Link>
        </ResultCard>
      </CheckInShell>
    );
  }

  if (status === STATUS.loading || status === STATUS.idle) {
    return (
      <CheckInShell>
        <p className="text-center text-lg text-white">Checking you in…</p>
        <LoadingSpinner />
      </CheckInShell>
    );
  }

  if (status === STATUS.success && record) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return (
      <CheckInShell>
        <ResultCard title="You're checked in!" tone="success">
          <p className="text-2xl font-semibold text-white">{name}</p>
          <p className="mt-2 text-slate-300">{formatDate(record.checkInAt)}</p>
          <Link
            to="/attendance"
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-teal-600 font-medium text-white hover:bg-teal-500"
          >
            View visit history
          </Link>
        </ResultCard>
      </CheckInShell>
    );
  }

  if (status === STATUS.alreadyIn) {
    return (
      <CheckInShell>
        <ResultCard title="Already checked in" tone="neutral">
          <p className="text-slate-300">
            {message ||
              "You're already checked in for today. Check out from the app or ask staff when you leave."}
          </p>
          <Link
            to="/attendance"
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-teal-500/40 text-teal-400 hover:bg-teal-500/10"
          >
            View visits
          </Link>
        </ResultCard>
      </CheckInShell>
    );
  }

  if (status === STATUS.payment) {
    return (
      <CheckInShell>
        <ResultCard title="Payment required" tone="warning">
          <p className="text-slate-300">{message}</p>
          <Link
            to="/payments"
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-teal-600 font-medium text-white hover:bg-teal-500"
          >
            Go to payments
          </Link>
        </ResultCard>
      </CheckInShell>
    );
  }

  if (status === STATUS.expired) {
    return (
      <CheckInShell>
        <ResultCard title="Membership expired" tone="warning">
          <p className="text-slate-300">{message}</p>
          <Link
            to="/plans"
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-teal-600 font-medium text-white hover:bg-teal-500"
          >
            Renew membership
          </Link>
        </ResultCard>
      </CheckInShell>
    );
  }

  if (status === STATUS.invalidLink) {
    return (
      <CheckInShell>
        <ResultCard title="Invalid check-in link" tone="error">
          <p className="text-slate-300">
            {message ||
              'This QR code is no longer valid. Ask staff for an updated entrance poster.'}
          </p>
        </ResultCard>
      </CheckInShell>
    );
  }

  return (
    <CheckInShell>
      <ResultCard title="Check-in failed" tone="error">
        <p className="text-slate-300">
          {message || 'Something went wrong. Try again or ask staff.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 min-h-[48px] w-full rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800"
        >
          Try again
        </button>
      </ResultCard>
    </CheckInShell>
  );
}

function CheckInShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-600 text-xl font-bold text-white">
        FC
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function ResultCard({ title, tone, children }) {
  const border =
    tone === 'success'
      ? 'border-teal-500/40'
      : tone === 'warning'
        ? 'border-amber-500/40'
        : tone === 'error'
          ? 'border-red-500/40'
          : 'border-slate-700';
  return (
    <div className={`rounded-2xl border ${border} bg-slate-900/90 p-8 text-center shadow-2xl`}>
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <div className="mt-4">{children}</div>
    </div>
  );
}
