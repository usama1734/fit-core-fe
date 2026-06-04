import { useCallback, useEffect, useState } from 'react';
import * as attendanceApi from '../../api/attendance.api.js';
import { getApiError } from '../../api/client.js';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

export default function GymQrPanel() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await attendanceApi.getGymCheckInQr();
      setPayload(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

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
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!payload?.url) return;
    try {
      await navigator.clipboard.writeText(payload.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy URL');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-white">Gym entrance QR</h2>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Print this code and post it at the entrance. Members scan it with their phone camera, sign
        in if needed, and check in automatically.
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {payload?.qrCodeDataUrl && (
        <div className="mt-6 flex flex-col items-center gap-4 md:flex-row md:items-start">
          <img
            src={payload.qrCodeDataUrl}
            alt="Gym check-in QR code"
            width={320}
            height={320}
            className="rounded-xl bg-white p-3 shadow-lg"
          />
          <div className="w-full max-w-md flex-1 space-y-3">
            <label className="block text-xs text-slate-500">Check-in URL</label>
            <p className="break-all rounded-lg border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-300">
              {payload.url}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="min-h-[44px] rounded-lg border border-slate-600 px-4 text-sm text-slate-200 hover:bg-slate-800"
              >
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="min-h-[44px] rounded-lg border border-amber-500/40 px-4 text-sm text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
              >
                {regenerating ? 'Regenerating…' : 'Regenerate QR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
