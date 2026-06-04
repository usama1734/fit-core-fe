import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePaginatedList } from '@hooks/usePaginatedList.js';
import * as attendanceApi from '@api/attendance.api.js';
import * as membersApi from '@api/members.api.js';
import * as trainersApi from '@api/trainers.api.js';
import * as plansApi from '@api/plans.api.js';
import DataTable from '@components/ui/DataTable.jsx';
import LoadingSpinner from '@components/ui/LoadingSpinner.jsx';
import ModalForm from '@components/ui/ModalForm.jsx';
import PageHeader from '@components/ui/PageHeader.jsx';
import { useAuth } from '@contexts/AuthContext.jsx';
import { getApiError } from '@api/client.js';
import { exportToCsv } from '@utils/csvExport.js';
import { formatDate, formatDateShort, fullName } from '@utils/format.js';
import { formatMemberPaymentStatus, memberPaymentStatusClass } from '@utils/paymentStatus.js';
import { ROLES } from '@utils/roles.js';

export default function MembersPage() {
  const { user } = useAuth();
  const isAdmin = user.role === ROLES.ADMIN;
  const isTrainer = user.role === ROLES.TRAINER;
  const [attendance, setAttendance] = useState([]);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [auxLoading, setAuxLoading] = useState(true);
  const [auxError, setAuxError] = useState('');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  const fetchMembers = useCallback(
    (params) =>
      isTrainer ? trainersApi.getMyAssignedMembers(params) : membersApi.listMembers(params),
    [isTrainer],
  );

  const {
    items: members,
    meta,
    page,
    pageSize,
    setPage,
    setPageSize,
    loading,
    error: listError,
    setError: setListError,
    reload: reloadMembers,
  } = usePaginatedList(fetchMembers, [isTrainer]);

  const loadAux = useCallback(async () => {
    setAuxLoading(true);
    try {
      if (isTrainer) {
        const attendanceResult = await attendanceApi.listAttendance({ page: 1, pageSize: 100 });
        setAttendance(attendanceResult.items);
        setAttendanceTotal(attendanceResult.meta.total);
      } else if (isAdmin) {
        const [t, p] = await Promise.all([
          trainersApi.listTrainers({ page: 1, pageSize: 100 }),
          plansApi.listPlans({ page: 1, pageSize: 100 }),
        ]);
        setTrainers(t.items);
        setPlans(p.items);
      }
    } catch (err) {
      setAuxError(getApiError(err));
    } finally {
      setAuxLoading(false);
    }
  }, [isAdmin, isTrainer]);

  useEffect(() => {
    loadAux();
  }, [loadAux]);

  const load = reloadMembers;

  const attendanceByMember = useMemo(() => {
    const map = new Map();
    for (const record of attendance) {
      const list = map.get(record.memberId) ?? [];
      list.push(record);
      map.set(record.memberId, list);
    }
    return map;
  }, [attendance]);

  const trainerOptions = trainers.map((t) => ({
    value: t.id,
    label: fullName(t.user),
  }));

  const planOptions = plans.map((p) => ({
    value: p.id,
    label: `${p.name} ($${p.price})`,
  }));

  const handleCreate = async (values) => {
    setSaving(true);
    try {
      const payload = {
        email: values.email.trim(),
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone?.trim() || undefined,
      };
      if (isAdmin) {
        payload.trainerId = values.trainerId || undefined;
      }
      await membersApi.createMember(payload);
      await load();
    } catch (err) {
      throw new Error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTrainer = async (values) => {
    setSaving(true);
    try {
      await membersApi.assignTrainer(modal.memberId, values.trainerId);
      await load();
    } catch (err) {
      throw new Error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignPlan = async (values) => {
    setSaving(true);
    try {
      const start = values.membershipStart
        ? new Date(values.membershipStart).toISOString()
        : undefined;
      await membersApi.assignPlan(modal.memberId, values.membershipPlanId, start);
      await load();
    } catch (err) {
      throw new Error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEditMember = async (values) => {
    setSaving(true);
    try {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone?.trim() || null,
        isActive: values.isActive === 'true' || values.isActive === true,
      };
      await membersApi.updateMember(modal.member.id, payload);
      await load();
    } catch (err) {
      throw new Error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateMember = async () => {
    if (
      !window.confirm(
        `Deactivate ${fullName(modal.member?.user)}? They will not be able to log in.`,
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await membersApi.deleteMember(modal.member.id);
      setModal(null);
      await load();
    } catch (err) {
      setListError(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const getLastCheckIn = (memberId) => {
    const records = attendanceByMember.get(memberId) ?? [];
    if (!records.length) return null;
    return records.sort((a, b) => new Date(b.checkInAt) - new Date(a.checkInAt))[0];
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (r) => fullName(r.user),
    },
    { key: 'email', label: 'Email', render: (r) => r.user?.email },
    {
      key: 'trainer',
      label: 'Trainer',
      render: (r) => (r.trainer?.user ? fullName(r.trainer.user) : '—'),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (r) => r.membershipPlan?.name ?? '—',
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (r) => (
        <span className={memberPaymentStatusClass(r.paymentStatus)}>
          {formatMemberPaymentStatus(r.paymentStatus)}
        </span>
      ),
    },
    {
      key: 'end',
      label: 'Expires',
      render: (r) => formatDateShort(r.membershipEnd),
    },
    ...(isTrainer
      ? [
          {
            key: 'visits',
            label: 'Visits',
            render: (r) => attendanceByMember.get(r.id)?.length ?? 0,
          },
          {
            key: 'lastVisit',
            label: 'Last check-in',
            render: (r) => formatDate(getLastCheckIn(r.id)?.checkInAt),
          },
          {
            key: 'attendance',
            label: '',
            render: (r) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedMemberId((prev) => (prev === r.id ? null : r.id));
                }}
                className="text-xs text-teal-400 hover:underline"
              >
                {expandedMemberId === r.id ? 'Hide attendance' : 'View attendance'}
              </button>
            ),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (r) => (
              <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'trainer', memberId: r.id })}
                  className="rounded px-2 py-1 text-xs text-teal-400 hover:bg-teal-500/10"
                >
                  Trainer
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'plan', memberId: r.id })}
                  className="rounded px-2 py-1 text-xs text-amber-400 hover:bg-amber-500/10"
                >
                  Plan
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'edit', member: r })}
                  className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-700/50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'deactivate', member: r })}
                  className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                >
                  Deactivate
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const expandedRecords = expandedMemberId
    ? (attendanceByMember.get(expandedMemberId) ?? []).sort(
        (a, b) => new Date(b.checkInAt) - new Date(a.checkInAt),
      )
    : [];

  const handleExportCsv = async () => {
    setListError('');
    try {
      const result = isTrainer
        ? await trainersApi.getMyAssignedMembers({ page: 1, pageSize: 100 })
        : await membersApi.listMembers({ page: 1, pageSize: 100 });
      exportToCsv('members-export', result.items, [
        { label: 'Name', value: (r) => fullName(r.user) },
        { label: 'Email', value: (r) => r.user?.email ?? '' },
        { label: 'Trainer', value: (r) => (r.trainer?.user ? fullName(r.trainer.user) : '') },
        { label: 'Plan', value: (r) => r.membershipPlan?.name ?? '' },
        { label: 'Payment status', value: (r) => r.paymentStatus ?? '' },
        { label: 'Expires', value: (r) => r.membershipEnd ?? '' },
      ]);
    } catch (err) {
      setListError(getApiError(err));
    }
  };

  const displayError = listError || auxError;
  if ((loading || auxLoading) && members.length === 0) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Members"
        description={
          isTrainer
            ? 'Your assigned members and their attendance history'
            : 'Create and manage gym members'
        }
        actions={
          (isAdmin || isTrainer) && (
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Export CSV
                </button>
              )}
              <button
                type="button"
                onClick={() => setModal({ type: isTrainer ? 'invite' : 'create' })}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
              >
                {isTrainer ? '+ Invite Member' : '+ Create Member'}
              </button>
            </div>
          )
        }
      />
      {displayError && <p className="mb-4 text-red-400">{displayError}</p>}

      {isTrainer && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Assigned members</p>
            <p className="text-2xl font-bold text-white">{meta.total}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Total check-ins</p>
            <p className="text-2xl font-bold text-white">{attendanceTotal}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Open sessions</p>
            <p className="text-2xl font-bold text-white">
              {attendance.filter((a) => !a.checkOutAt).length}
            </p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={members}
        emptyMessage="No members"
        pagination={{
          page,
          pageSize,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />

      {expandedMemberId && (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Attendance — {fullName(members.find((m) => m.id === expandedMemberId)?.user)}
          </h3>
          {expandedRecords.length === 0 ? (
            <p className="text-sm text-slate-400">No attendance records yet.</p>
          ) : (
            <DataTable
              columns={[
                { key: 'method', label: 'Method' },
                { key: 'checkInAt', label: 'Check in', render: (r) => formatDate(r.checkInAt) },
                {
                  key: 'checkOutAt',
                  label: 'Check out',
                  render: (r) => formatDate(r.checkOutAt),
                },
              ]}
              data={expandedRecords}
              emptyMessage="No records"
              paginateLocally
              defaultPageSize={5}
            />
          )}
        </div>
      )}

      <ModalForm
        open={modal?.type === 'create' || modal?.type === 'invite'}
        onClose={() => setModal(null)}
        title={modal?.type === 'invite' ? 'Invite Member' : 'Create Member'}
        loading={saving}
        submitLabel={modal?.type === 'invite' ? 'Invite' : 'Create'}
        fields={[
          { name: 'firstName', label: 'First name', required: true },
          { name: 'lastName', label: 'Last name', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          {
            name: 'password',
            label: 'Temporary password',
            type: 'password',
            required: true,
            min: 8,
            hint: 'At least 8 characters. Share this with the member for their first login.',
          },
          { name: 'phone', label: 'Phone' },
          ...(modal?.type === 'create'
            ? [{ name: 'trainerId', label: 'Trainer', type: 'select', options: trainerOptions }]
            : []),
        ]}
        onSubmit={handleCreate}
      />

      <ModalForm
        open={modal?.type === 'trainer'}
        onClose={() => setModal(null)}
        title="Assign Trainer"
        loading={saving}
        fields={[
          {
            name: 'trainerId',
            label: 'Trainer',
            type: 'select',
            required: true,
            options: trainerOptions,
          },
        ]}
        onSubmit={handleAssignTrainer}
      />

      <ModalForm
        open={modal?.type === 'plan'}
        onClose={() => setModal(null)}
        title="Assign Plan"
        loading={saving}
        fields={[
          {
            name: 'membershipPlanId',
            label: 'Plan',
            type: 'select',
            required: true,
            options: planOptions,
          },
          {
            name: 'membershipStart',
            label: 'Membership start',
            type: 'date',
            hint: 'Optional. Defaults to today if omitted.',
          },
        ]}
        onSubmit={handleAssignPlan}
      />

      <ModalForm
        open={modal?.type === 'edit'}
        onClose={() => setModal(null)}
        title="Edit Member"
        loading={saving}
        initialValues={
          modal?.member
            ? {
                firstName: modal.member.user?.firstName ?? '',
                lastName: modal.member.user?.lastName ?? '',
                phone: modal.member.phone ?? '',
                isActive: String(modal.member.user?.isActive !== false),
              }
            : {}
        }
        fields={[
          { name: 'firstName', label: 'First name', required: true },
          { name: 'lastName', label: 'Last name', required: true },
          { name: 'phone', label: 'Phone' },
          {
            name: 'isActive',
            label: 'Account active',
            type: 'select',
            required: true,
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
          },
        ]}
        onSubmit={handleEditMember}
      />

      {modal?.type === 'deactivate' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setModal(null)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Deactivate member</h2>
            <p className="mt-2 text-sm text-slate-400">
              Deactivate {fullName(modal.member?.user)}? They will not be able to log in.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateMember}
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {saving ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
