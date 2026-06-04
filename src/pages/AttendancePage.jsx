import { useCallback, useMemo, useState } from 'react';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import * as attendanceApi from '../api/attendance.api.js';
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
  const isAdmin = user.role === ROLES.ADMIN;
  const isTrainer = user.role === ROLES.TRAINER;
  const isStaff = isAdmin || isTrainer;
  const isMember = user.role === ROLES.MEMBER;
  const [tab, setTab] = useState(isAdmin ? 'gymqr' : 'history');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const openRecords = useMemo(() => records.filter((r) => !r.checkOutAt), [records]);

  const todayCount = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return records.filter((r) => new Date(r.checkInAt) >= start).length;
  }, [records]);

  const handleCheckOut = useCallback(
    async (id) => {
      setError('');
      setSuccess('');
      try {
        const updated = await attendanceApi.checkOut(id);
        await reloadRecords();
        setSuccess(`${fullName(updated.member?.user)} checked out`);
      } catch (err) {
        setError(getApiError(err));
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

  if (loading && records.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Attendance"
        description={
          isMember
            ? 'Scan the gym check-in QR poster from this page'
            : isAdmin
              ? 'Print the gym QR and view visit history'
              : 'View member visits and check out when they leave'
        }
      />

      {isStaff && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-500">In gym now</p>
            <p className="text-2xl font-bold text-amber-400">{openRecords.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-500">Check-ins today</p>
            <p className="text-2xl font-bold text-teal-400">{todayCount}</p>
          </div>
          {isAdmin && (
            <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:col-span-1">
              <p className="text-xs text-slate-500">Role</p>
              <p className="text-sm font-medium text-slate-300">Manage gym QR poster</p>
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          {[
            { id: 'gymqr', label: 'Gym QR' },
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
      )}

      {isAdmin && tab === 'gymqr' && <GymQrPanel />}

      {isMember && <MemberGymScanCheckIn onCheckedIn={() => reloadRecords()} />}

      {(isMember || isTrainer || (isAdmin && tab === 'history')) && (
        <>
          {(success || error) && isStaff && (
            <div
              className={`mb-4 rounded-xl border p-4 ${
                error ? 'border-red-500/30 bg-red-500/10' : 'border-teal-500/30 bg-teal-500/10'
              }`}
            >
              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && !error && <p className="text-sm text-teal-400">{success}</p>}
            </div>
          )}

          <h2 className="mb-4 text-lg font-semibold text-white">
            {isMember ? 'Your visits' : 'Attendance history'}
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
      )}
    </div>
  );
}
