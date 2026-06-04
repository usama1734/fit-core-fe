import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader.jsx';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  return (
    <div className="mx-auto max-w-lg text-center">
      <PageHeader title="Payment successful" description="Your membership payment was received." />
      <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-8">
        <p className="text-4xl" aria-hidden>
          ✓
        </p>
        <p className="mt-4 text-white">
          Thank you! Your plan will be activated once Stripe confirms the payment.
        </p>
        {sessionId && (
          <p className="mt-2 text-xs text-slate-500">Session: {sessionId}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/profile"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
          >
            View profile
          </Link>
          <Link
            to="/payments"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Payment history
          </Link>
        </div>
      </div>
    </div>
  );
}
