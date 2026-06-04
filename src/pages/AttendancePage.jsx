import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import * as attendanceApi from '../api/attendance.api.js';
import * as membersApi from '../api/members.api.js';
import QrScanner from '../components/qr/QrScanner.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getApiError } from '../api/client.js';
import { formatDate, fullName } from '../utils/format.js';
import { ROLES } from '../utils/roles.js';

export default function AttendancePage() {
  const { user } = useAuth();
  const canScan = [ROLES.ADMIN, ROLES.TRAINER].includes(user.role);
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState(canScan ? 'scanner' : 'history');
  const [manualMemberId, setManualMemberId] = useState('');
  const [scanning, setScanning] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await attendanceApi.listAttendance();
      setRecords(data);
      if (canScan) {
        const m = await membersApi.listMembers();
        setMembers(m);
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [canScan]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCheckIn = async (payload) => {
    setError('');
    setSuccess('');
    try {
      await attendanceApi.checkIn(payload);
      setSuccess('Check-in recorded');
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const onQrScan = async (decoded) => {
    setScanning(false);
    await handleCheckIn({ qrToken: decoded, method: 'QR' });
    setTimeout(() => setScanning(true), 2000);
  };

  const onManualCheckIn = async () => {
    if (!manualMemberId) return;
    await handleCheckIn({ memberId: manualMemberId, method: 'MANUAL' });
    setManualMemberId('');
  };

  const onSelfCheckIn = async () => {
    await handleCheckIn({ method: 'MANUAL' });
  };

  const handleCheckOut = async (id) => {
    try {
      await attendanceApi.checkOut(id);
      setSuccess('Checked out');
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const columns = [
    {
      key: 'member',
      label: 'Member',
      render: (r) => fullName(r.member?.user),
    },
    { key: 'method', label: 'Method' },
    { key: 'checkInAt', label: 'Check in', render: (r) => formatDate(r.checkInAt) },
    {
      key: 'checkOutAt',
      label: 'Check out',
      render: (r) => formatDate(r.checkOutAt),
    },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        !r.checkOutAt ? (
          <button
            type="button"
            onClick={() => handleCheckOut(r.id)}
            className="text-xs text-teal-400 hover:underline"
          >
            Check out
          </button>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="QR check-in and attendance history"
      />

      {canScan && (
        <div className="mb-6 flex gap-2 border-b border-slate-800">
          {['scanner', 'history'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize ${
                tab === t
                  ? 'border-b-2 border-teal-500 text-teal-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      {success && (
        <p className="mb-4 rounded-lg bg-teal-500/10 p-3 text-sm text-teal-400">{success}</p>
      )}

      {user.role === ROLES.MEMBER && (
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-white">Member check-in</h2>
          <p className="mt-2 text-sm text-slate-400">
            Show your QR code from your profile for staff to scan, or check in directly from the app.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/profile"
              className="rounded-lg border border-teal-500/40 px-4 py-2 text-sm text-teal-400 hover:bg-teal-500/10"
            >
              View my QR code
            </Link>
            <button
              type="button"
              onClick={onSelfCheckIn}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
            >
              Check in now
            </button>
          </div>
        </div>
      )}

      {canScan && tab === 'scanner' && (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-300">QR Scanner</h2>
            {scanning ? (
              <QrScanner
                active={scanning}
                onScan={onQrScan}
                onError={(msg) => setError(msg)}
              />
            ) : (
              <p className="text-sm text-slate-400">Processing scan…</p>
            )}
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-300">Manual check-in</h2>
            <select
              value={manualMemberId}
              onChange={(e) => setManualMemberId(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            >
              <option value="">Select member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {fullName(m.user)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onManualCheckIn}
              disabled={!manualMemberId}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-50"
            >
              Manual check-in
            </button>
          </div>
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-white">History</h2>
      {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={records} />}
    </div>
  );
}
