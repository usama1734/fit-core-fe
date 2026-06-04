import { Link } from 'react-router-dom';
import PageHeader from '@components/ui/PageHeader.jsx';

export default function PaymentCancelPage() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <PageHeader title="Payment cancelled" description="No charge was made." />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
        <p className="text-4xl" aria-hidden>
          ✕
        </p>
        <p className="mt-4 text-slate-300">
          Your checkout was cancelled. No charge was made to your card.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          You can return to plans and subscribe when you are ready.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/plans"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
          >
            Back to plans
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
