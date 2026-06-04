import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import * as attendanceApi from '../api/attendance.api.js';
import * as membersApi from '../api/members.api.js';
import * as trainersApi from '../api/trainers.api.js';
import AttendanceCheckIn from '../components/attendance/AttendanceCheckIn.jsx';
import GymQrPanel from '../components/attendance/GymQrPanel.jsx';
import MemberGymScanCheckIn from '../components/attendance/MemberGymScanCheckIn.jsx';
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
  const isAdmin = user.role === ROLES.ADMIN;
  const isTrainer = user.role === ROLES.TRAINER;
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isMember = user.role === ROLES.MEMBER;
  const [tab, setTab] = useState(canScan ? 'checkin' : 'checkin');

  const fetchRecords = useCallback((params) => attendanceApi.listAttendance(params), []);

  const {
    items: records,
    meta,
    page,
    pageSize,
    setPage,
    setPageSize,
    loading,
    reload: reloadRecords,
  } = usePaginatedList(fetchRecords);

  const loadMembers = useCallback(async () => {
    if (!canScan) return;
    setMembersLoading(true);
    try {
      const result = isTrainer
        ? await trainersApi.getMyAssignedMembers({ page: 1, pageSize: 100 })
        : await membersApi.listMembers({ page: 1, pageSize: 100 });
      setMembers(result.items);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setMembersLoading(false);
    }
  }, [canScan, isTrainer]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const openRecords = useMemo(() => records.filter((r) => !r.checkOutAt), [records]);

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
        await reloadRecords();
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
    [reloadRecords],
  );

  const handleCheckOut = useCallback(
    async (id) => {
      setError('');
      setSuccess('');
      try {
        const updated = await attendanceApi.checkOut(id);
        await reloadRecords();
        setSuccess(`${fullName(updated.member?.user)} checked out`);
        return { ok: true };
      } catch (err) {
        setError(getApiError(err));
        return { ok: false };
      }
    },
    [reloadRecords],
  );

  const memberColumns = [
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

  const staffColumns = [
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

  const columns = isMember ? memberColumns : staffColumns;

  if (loading && records.length === 0 && membersLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeader
        title="Attendance"
        description={
          canScan
            ? 'Fast check-in: scan QR or tap a member name'
            : 'Scan the gym check-in QR poster from this page'
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

          <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            {[
              { id: 'checkin', label: 'Check in' },
              ...(isAdmin ? [{ id: 'gymqr', label: 'Gym QR' }] : []),
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

      {isAdmin && tab === 'gymqr' && <GymQrPanel />}

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

      {isMember && <MemberGymScanCheckIn onCheckedIn={() => reloadRecords()} />}

      {(canScan && tab === 'history') || isMember ? (
        <>
          <h2 className="mb-4 text-lg font-semibold text-white">
            {canScan ? 'Attendance history' : 'Your visits'}
          </h2>
          {isMember && openRecords.length > 0 && (
            <p className="mb-4 text-sm text-amber-400/90">
              You are checked in. Use Check out below when you leave.
            </p>
          )}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <DataTable
              columns={columns}
              data={records}
              emptyMessage="No attendance yet"
              pagination={{
                page,
                pageSize,
                total: meta.total,
                totalPages: meta.totalPages,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
