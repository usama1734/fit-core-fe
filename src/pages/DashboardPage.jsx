import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as dashboardApi from '../api/dashboard.api.js';
import * as membersApi from '../api/members.api.js';
import * as attendanceApi from '../api/attendance.api.js';
import AdminDashboard from '../components/dashboard/AdminDashboard.jsx';
import QuickActions from '../components/dashboard/QuickActions.jsx';
import DashboardCard from '../components/ui/DashboardCard.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getApiError } from '../api/client.js';
import { formatDate, formatDateShort, fullName } from '../utils/format.js';
import { ROLES } from '../utils/roles.js';

function Panel({ title, children, action }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [trainerMembers, setTrainerMembers] = useState([]);

  useEffect(() => {
    if (user.role === ROLES.ADMIN) return undefined;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        if (user.role === ROLES.TRAINER) {
          const dash = await dashboardApi.getTrainerDashboard();
          if (!cancelled) {
            setStats({
              assignedMembers: dash.kpis.assignedMembers,
              checkInsInRange: dash.kpis.checkInsInRange,
              openCheckIns: dash.kpis.openCheckIns,
            });
            setTrainerMembers(dash.members ?? []);
          }
        } else {
          const profile = await membersApi.getMyProfile();
          const attendanceResult = await attendanceApi.listAttendance({ page: 1, pageSize: 1 });
          if (!cancelled) {
            setStats({
              plan: profile.membershipPlan?.name ?? 'None',
              trainer: profile.trainer?.user ? fullName(profile.trainer.user) : 'Unassigned',
              membershipEnd: profile.membershipEnd,
              paymentStatus: profile.paymentStatus,
              recentCheckIns: attendanceResult.meta.total,
              openVisit: null,
            });
            const openVisitResult = await attendanceApi.listAttendance({ page: 1, pageSize: 50 });
            if (!cancelled) {
              setStats((prev) => ({
                ...prev,
                openVisit: openVisitResult.items.find((a) => !a.checkOutAt),
              }));
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user.role]);

  if (user.role === ROLES.ADMIN) {
    return <AdminDashboard />;
  }

  if (loading) return <LoadingSpinner />;
  if (error) {
    return <p className="rounded-lg bg-red-500/10 p-4 text-red-400">{error}</p>;
  }

  if (user.role === ROLES.TRAINER) {
    return (
      <div className="space-y-6 pb-4 sm:space-y-8">
        <PageHeader title="Dashboard" description="Your members and today's gym activity" />

        <QuickActions role={user.role} />

        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardCard title="Assigned members" value={stats.assignedMembers} icon="👥" />
          <DashboardCard
            title="Check-ins (range)"
            value={stats.checkInsInRange}
            icon="📈"
            accent="teal"
          />
          <DashboardCard
            title="In gym now"
            value={stats.openCheckIns}
            icon="⏱"
            accent="amber"
            subtitle="Open sessions"
          />
        </div>

        <Panel
          title="Member activity"
          action={
            <Link to="/members" className="text-sm text-teal-400 hover:text-teal-300">
              View all →
            </Link>
          }
        >
          <DataTable
            columns={[
              { key: 'name', label: 'Member', render: (r) => fullName(r.user) },
              { key: 'plan', label: 'Plan', render: (r) => r.membershipPlan?.name ?? '—' },
              {
                key: 'lastCheckIn',
                label: 'Last check-in',
                render: (r) => formatDate(r.attendances?.[0]?.checkInAt),
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) =>
                  r.attendances?.[0] && !r.attendances[0].checkOutAt ? (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                      In gym
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  ),
              },
            ]}
            data={trainerMembers}
            emptyMessage="No assigned members"
            paginateLocally
            defaultPageSize={5}
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4 sm:space-y-8">
      <PageHeader title="My dashboard" description="Membership, trainer, and visit summary" />

      <QuickActions role={user.role} />

      {stats.openVisit && (
        <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4">
          <p className="text-sm text-teal-300">
            You are currently checked in. Remember to check out when you leave.
          </p>
          <Link
            to="/attendance"
            className="mt-3 inline-block text-sm font-medium text-teal-400 hover:underline"
          >
            View attendance →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardCard title="Current plan" value={stats.plan} icon="📋" />
        <DashboardCard title="Trainer" value={stats.trainer} icon="🏋️" accent="violet" />
        <DashboardCard
          title="Membership ends"
          value={stats.membershipEnd ? formatDateShort(stats.membershipEnd) : '—'}
          icon="📅"
        />
        <DashboardCard
          title="Total visits"
          value={stats.recentCheckIns}
          icon="✅"
          subtitle={stats.paymentStatus === 'PAID' ? 'Membership paid' : 'Payment required'}
          accent={stats.paymentStatus === 'PAID' ? 'teal' : 'amber'}
        />
      </div>
    </div>
  );
}
