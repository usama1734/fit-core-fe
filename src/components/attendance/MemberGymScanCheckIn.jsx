import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as attendanceApi from '../../api/attendance.api.js';
import { getApiError, getApiErrorCode } from '../../api/client.js';
import { formatDate } from '../../utils/format.js';
import { parseVenueQrScan } from '../../utils/qrScan.js';
import QrScanner from '../qr/QrScanner.jsx';

export default function MemberGymScanCheckIn({ onCheckedIn }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastCheckInAt, setLastCheckInAt] = useState(null);
  const scanLockRef = useRef(false);
  const lastTokenRef = useRef('');

  const runCheckIn = useCallback(
    async (venueToken) => {
      setProcessing(true);
      setError('');
      setSuccess('');
      try {
        const record = await attendanceApi.checkIn({ venueToken, method: 'QR' });
        setSuccess('You are checked in!');
        setLastCheckInAt(record.checkInAt);
        onCheckedIn?.(record);
        return true;
      } catch (err) {
        const code = getApiErrorCode(err);
        const msg = getApiError(err);
        if (code === 'ALREADY_CHECKED_IN') {
          setError("You're already checked in. Check out below when you leave.");
        } else if (code === 'PAYMENT_REQUIRED') {
          setError(msg);
        } else if (code === 'MEMBERSHIP_EXPIRED') {
          setError(msg);
        } else if (code === 'INVALID_VENUE_QR') {
          setError('Not a valid gym check-in code. Scan the poster at the entrance.');
        } else {
          setError(msg);
        }
        return false;
      } finally {
        setProcessing(false);
      }
    },
    [onCheckedIn],
  );

  const onScan = useCallback(
    async (decoded) => {
      if (scanLockRef.current || processing || !decoded?.trim()) return;

      const venueToken = parseVenueQrScan(decoded);
      if (!venueToken) {
        setError('Scan the gym check-in poster (not a personal QR code).');
        return;
      }

      if (venueToken === lastTokenRef.current) return;

      scanLockRef.current = true;
      lastTokenRef.current = venueToken;

      await runCheckIn(venueToken);

      window.setTimeout(() => {
        scanLockRef.current = false;
        lastTokenRef.current = '';
      }, 1500);
    },
    [processing, runCheckIn],
  );

  const errorCode = error.toLowerCase();
  const showPayCta = errorCode.includes('payment');
  const showPlansCta = errorCode.includes('expired');

  return (
    <section className="mb-6 space-y-4">
      <div className="relative mx-auto w-full max-w-xl">
        <QrScanner active={!processing} onScan={onScan} onError={(msg) => setError(msg)} />
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
            <p className="text-sm font-medium text-white">Checking you in…</p>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-slate-400">
        Point your camera at the gym&apos;s check-in QR poster at the entrance.
      </p>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          {showPayCta && (
            <Link
              to="/payments"
              className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-500"
            >
              Go to payments
            </Link>
          )}
          {showPlansCta && (
            <Link
              to="/plans"
              className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-500"
            >
              View plans
            </Link>
          )}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 text-center">
          <p className="text-lg font-semibold text-teal-300">{success}</p>
          {lastCheckInAt && (
            <p className="mt-1 text-sm text-slate-400">{formatDate(lastCheckInAt)}</p>
          )}
        </div>
      )}
    </section>
  );
}
