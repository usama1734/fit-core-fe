import { useCallback, useEffect, useMemo, useState } from 'react';
import * as attendanceApi from '../api/attendance.api.js';
import * as membersApi from '../api/members.api.js';
import * as trainersApi from '../api/trainers.api.js';
import * as plansApi from '../api/plans.api.js';
import DataTable from '../components/ui/DataTable.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import ModalForm from '../components/ui/ModalForm.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getApiError } from '../api/client.js';
import { formatDate, formatDateShort, fullName } from '../utils/format.js';
import {
  formatMemberPaymentStatus,
  memberPaymentStatusClass,
} from '../utils/paymentStatus.js';
import { ROLES } from '../utils/roles.js';

export default function MembersPage() {
  const { user } = useAuth();
  const isAdmin = user.role === ROLES.ADMIN;
  const isTrainer = user.role === ROLES.TRAINER;
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (isTrainer) {
        const [memberList, attendanceList] = await Promise.all([
          trainersApi.getMyAssignedMembers(),
          attendanceApi.listAttendance(),
        ]);
        setMembers(memberList);
        setAttendance(attendanceList);
      } else {
        const [m, t, p] = await Promise.all([
          membersApi.listMembers(),
          isAdmin ? trainersApi.listTrainers() : Promise.resolve([]),
          isAdmin ? plansApi.listPlans() : Promise.resolve([]),
        ]);
        setMembers(m);
        setTrainers(t);
        setPlans(p);
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isTrainer]);

  useEffect(() => {
    load();
  }, [load]);

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
        payload.membershipPlanId = values.membershipPlanId || undefined;
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
      await membersApi.assignPlan(modal.memberId, values.membershipPlanId);
      await load();
    } catch (err) {
      throw new Error(getApiError(err));
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
            render: (r) => (attendanceByMember.get(r.id)?.length ?? 0),
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

  if (loading) return <LoadingSpinner />;

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
            <button
              type="button"
              onClick={() => setModal({ type: isTrainer ? 'invite' : 'create' })}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
            >
              {isTrainer ? '+ Invite Member' : '+ Create Member'}
            </button>
          )
        }
      />
      {error && <p className="mb-4 text-red-400">{error}</p>}

      {isTrainer && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Assigned members</p>
            <p className="text-2xl font-bold text-white">{members.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Total check-ins</p>
            <p className="text-2xl font-bold text-white">{attendance.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Open sessions</p>
            <p className="text-2xl font-bold text-white">
              {attendance.filter((a) => !a.checkOutAt).length}
            </p>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={members} emptyMessage="No members" />

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
            ? [
                { name: 'trainerId', label: 'Trainer', type: 'select', options: trainerOptions },
                { name: 'membershipPlanId', label: 'Plan', type: 'select', options: planOptions },
              ]
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
          { name: 'trainerId', label: 'Trainer', type: 'select', required: true, options: trainerOptions },
        ]}
        onSubmit={handleAssignTrainer}
      />

      <ModalForm
        open={modal?.type === 'plan'}
        onClose={() => setModal(null)}
        title="Assign Plan"
        loading={saving}
        fields={[
          { name: 'membershipPlanId', label: 'Plan', type: 'select', required: true, options: planOptions },
        ]}
        onSubmit={handleAssignPlan}
      />
    </div>
  );
}
