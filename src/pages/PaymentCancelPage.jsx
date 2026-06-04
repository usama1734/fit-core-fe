import { Link } from 'react-router-dom';
import PageHeader from '@components/ui/PageHeader.jsx';

export default function PaymentCancelPage() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <PageHeader title="Payment cancelled" description="No charge was made." />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
        <p className="text-slate-300">
          Your checkout was cancelled. You can choose a plan and try again anytime.
        </p>
        <Link
          to="/plans"
          className="mt-6 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
        >
          Back to plans
        </Link>
      </div>
    </div>
  );
}
