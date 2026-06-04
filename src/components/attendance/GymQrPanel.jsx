import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import * as attendanceApi from '../../api/attendance.api.js';
import { getApiError } from '../../api/client.js';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

export default function GymQrPanel() {
  const [payload, setPayload] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  const renderQrImage = useCallback(async (token, serverDataUrl) => {
    if (serverDataUrl?.startsWith('data:image')) {
      setQrImage(serverDataUrl);
      return;
    }
    if (!token) {
      setQrImage('');
      return;
    }
    const dataUrl = await QRCode.toDataURL(token, {
      width: 320,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    setQrImage(dataUrl);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setQrImage('');
    try {
      const data = await attendanceApi.getGymCheckInQr();
      setPayload(data);
      await renderQrImage(data?.token, data?.qrCodeDataUrl);
    } catch (err) {
      setError(getApiError(err));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [renderQrImage]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRegenerate = async () => {
    if (
      !window.confirm(
        'Regenerate the gym QR? Old entrance posters will stop working until you print the new code.',
      )
    ) {
      return;
    }
    setRegenerating(true);
    setError('');
    try {
      const data = await attendanceApi.regenerateGymCheckInQr();
      setPayload(data);
      await renderQrImage(data?.token, data?.qrCodeDataUrl);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-white">Gym entrance QR</h2>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Print this poster and place it at the gym entrance. Members open the FitCore app, go to
        Attendance, and scan this code to check in.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 min-h-[44px] rounded-lg border border-slate-600 px-4 text-sm text-slate-200 hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      )}

      {!error && qrImage && (
        <div className="mt-6 flex flex-col items-center gap-6">
          <img
            src={qrImage}
            alt="Gym check-in QR code"
            width={320}
            height={320}
            className="rounded-xl bg-white p-3 shadow-lg"
          />
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="min-h-[44px] rounded-lg border border-amber-500/40 px-4 text-sm text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
          >
            {regenerating ? 'Regenerating…' : 'Regenerate QR'}
          </button>
        </div>
      )}

      {!error && !qrImage && payload?.token && (
        <p className="mt-4 text-sm text-amber-400">Could not render QR image. Try Regenerate QR.</p>
      )}
    </div>
  );
}
