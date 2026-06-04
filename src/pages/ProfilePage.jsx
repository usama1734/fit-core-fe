import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as membersApi from '../api/members.api.js';
import QrDisplay from '../components/qr/QrDisplay.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getApiError } from '../api/client.js';
import { formatDateShort, fullName } from '../utils/format.js';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await membersApi.getMyProfile();
      setProfile(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRegenerateQr = async () => {
    if (!profile?.id) return;
    setRegenerating(true);
    setError('');
    try {
      const updated = await membersApi.regenerateQr(profile.id);
      setProfile(updated);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !profile) {
    return <p className="rounded-lg bg-red-500/10 p-4 text-red-400">{error}</p>;
  }

  const trainer = profile?.trainer;

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Membership details, trainer, and attendance QR code"
      />

      {error && <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Account</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-white">{fullName(user)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-200">{user.email}</dd>
            </div>
            {profile?.phone && (
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-slate-200">{profile.phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate-500">Current plan</dt>
              <dd className="text-slate-200">{profile?.membershipPlan?.name ?? 'None'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Membership ends</dt>
              <dd className="text-slate-200">{formatDateShort(profile?.membershipEnd)}</dd>
            </div>
          </dl>
          <Link
            to="/plans"
            className="mt-6 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
          >
            Browse plans & pay
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Your trainer</h2>
          {trainer?.user ? (
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-600/20 text-2xl">
                🏋️
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{fullName(trainer.user)}</p>
                <p className="text-sm text-slate-400">{trainer.user.email}</p>
                {trainer.specialty && (
                  <p className="mt-2 inline-block rounded-full bg-slate-800 px-3 py-1 text-xs text-teal-400">
                    {trainer.specialty}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No trainer assigned yet. Contact the gym admin to get matched with a trainer.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-2">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Attendance QR code</h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Show this code at the front desk or to your trainer. They will scan it to record
                your gym check-in.
              </p>
              <button
                type="button"
                onClick={handleRegenerateQr}
                disabled={regenerating}
                className="mt-4 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                {regenerating ? 'Regenerating…' : 'Regenerate QR code'}
              </button>
            </div>
            <div className="flex flex-col items-center">
              {profile?.qrToken ? (
                <QrDisplay value={profile.qrToken} size={240} />
              ) : (
                <p className="text-sm text-slate-400">No QR token yet.</p>
              )}
              <p className="mt-3 max-w-xs break-all text-center text-xs text-slate-500">
                {profile?.qrToken}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
