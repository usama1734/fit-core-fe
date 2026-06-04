import { Link, useSearchParams } from 'react-router-dom';
import QrDisplay from '../components/qr/QrDisplay.jsx';
import { buildMemberDeskQrValue } from '../utils/qrScan.js';

/** Public helper route; encoded in member desk QR URLs for consistent scanning. */
export default function MemberDeskQrPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t')?.trim() ?? '';

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <p className="text-slate-400">Invalid desk QR link.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6">
      <QrDisplay value={buildMemberDeskQrValue(token)} size={280} />
      <p className="mt-6 max-w-sm text-center text-sm text-slate-400">
        Show this code to staff at the check-in desk.
      </p>
      <Link to="/login" className="mt-6 text-sm text-teal-400 hover:underline">
        Sign in to FitCore
      </Link>
    </div>
  );
}
