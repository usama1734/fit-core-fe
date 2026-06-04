import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as attendanceApi from '../api/attendance.api.js';
import * as membersApi from '../api/members.api.js';
import * as trainersApi from '../api/trainers.api.js';
import AttendanceCheckIn from '../components/attendance/AttendanceCheckIn.jsx';
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
  const isTrainer = user.role === ROLES.TRAINER;
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState(canScan ? 'checkin' : 'history');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, memberList] = await Promise.all([
        attendanceApi.listAttendance(),
        canScan
          ? isTrainer
            ? trainersApi.getMyAssignedMembers()
            : membersApi.listMembers()
          : Promise.resolve([]),
      ]);
      setRecords(data);
      if (canScan) setMembers(memberList);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [canScan, isTrainer]);

  useEffect(() => {
    load();
  }, [load]);

  const openRecords = useMemo(
    () => records.filter((r) => !r.checkOutAt),
    [records],
  );

  const todayCount = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return records.filter((r) => new Date(r.checkInAt) >= start).length;
  }, [records]);

  const handleCheckIn = useCallback(
    async (payload) => {
      setError('');
      setSuccess('');
      try {
        const record = await attendanceApi.checkIn(payload);
        const name = fullName(record.member?.user);
        setRecords((prev) => [record, ...prev]);
        setSuccess(`${name} checked in`);
        return { ok: true, name, record };
      } catch (err) {
        const msg = getApiError(err);
        if (msg.toLowerCase().includes('already checked in')) {
          setError(`${msg} — use "Check out" above if they are leaving.`);
        } else {
          setError(msg);
        }
        return { ok: false };
      }
    },
    [],
  );

  const handleCheckOut = useCallback(async (id) => {
    setError('');
    setSuccess('');
    try {
      const updated = await attendanceApi.checkOut(id);
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated, checkOutAt: updated.checkOutAt } : r)),
      );
      setSuccess(`${fullName(updated.member?.user)} checked out`);
      return { ok: true };
    } catch (err) {
      setError(getApiError(err));
      return { ok: false };
    }
  }, []);

  const onSelfCheckIn = async () => {
    await handleCheckIn({ method: 'MANUAL' });
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
            className="min-h-[44px] text-sm font-medium text-teal-400 hover:underline"
          >
            Check out
          </button>
        ) : (
          <span className="text-slate-500">Done</span>
        ),
    },
  ];

  if (loading && records.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeader
        title="Attendance"
        description={
          canScan
            ? 'Fast check-in: scan QR or tap a member name'
            : 'Your gym visit history'
        }
      />

      {canScan && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs text-slate-500">In gym now</p>
              <p className="text-2xl font-bold text-amber-400">{openRecords.length}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs text-slate-500">Check-ins today</p>
              <p className="text-2xl font-bold text-teal-400">{todayCount}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:col-span-1">
              <p className="text-xs text-slate-500">Members</p>
              <p className="text-2xl font-bold text-white">{members.length}</p>
            </div>
          </div>

          <div className="mb-6 flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            {[
              { id: 'checkin', label: 'Check in' },
              { id: 'history', label: 'History' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`min-h-[44px] flex-1 rounded-lg px-4 text-sm font-medium sm:flex-none sm:px-6 ${
                  tab === t.id
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {canScan && tab === 'checkin' && (
        <AttendanceCheckIn
          members={members}
          openRecords={openRecords}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          error={error}
          success={success}
          onClearMessages={() => {
            setError('');
            setSuccess('');
          }}
          onResumeScanner={() => setError('')}
          onScanError={(msg) => setError(msg)}
        />
      )}

      {user.role === ROLES.MEMBER && (
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="font-semibold text-white">Quick check-in</h2>
          <p className="mt-2 text-sm text-slate-400">
            Show your QR to staff, or tap below if you have an active paid membership.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/profile"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-lg border border-teal-500/40 text-sm text-teal-400 hover:bg-teal-500/10"
            >
              My QR code
            </Link>
            <button
              type="button"
              onClick={onSelfCheckIn}
              className="min-h-[48px] flex-1 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-500"
            >
              Check in now
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          {success && <p className="mt-3 text-sm text-teal-400">{success}</p>}
        </div>
      )}

      {(!canScan || tab === 'history') && (
        <>
          <h2 className="mb-4 text-lg font-semibold text-white">
            {canScan ? 'Attendance history' : 'Your visits'}
          </h2>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <DataTable columns={columns} data={records} emptyMessage="No attendance yet" />
          )}
        </>
      )}
    </div>
  );
}
