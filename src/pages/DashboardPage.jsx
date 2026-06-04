import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as dashboardApi from '../api/dashboard.api.js';
import * as membersApi from '../api/members.api.js';
import * as plansApi from '../api/plans.api.js';
import * as attendanceApi from '../api/attendance.api.js';
import DashboardCard from '../components/ui/DashboardCard.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getApiError } from '../api/client.js';
import { formatCurrency, formatDate, formatDateShort, fullName } from '../utils/format.js';
import { ROLES } from '../utils/roles.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [trainerMembers, setTrainerMembers] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        if (user.role === ROLES.ADMIN) {
          const [dash, members, plans] = await Promise.all([
            dashboardApi.getAdminDashboard(),
            membersApi.listMembers(),
            plansApi.listPlans(),
          ]);
          if (!cancelled) {
            setStats({
              totalMembers: members.length,
              activeMembers: dash.kpis.activeMembers,
              plans: plans.length,
              trainers: dash.kpis.activeTrainers,
              checkInsToday: dash.kpis.checkInsToday,
              revenue: dash.kpis.revenueInRange,
              expiring: dash.kpis.expiringMemberships,
            });
            setRecentPayments(dash.recentPayments ?? []);
          }
        } else if (user.role === ROLES.TRAINER) {
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
          const attendance = await attendanceApi.listAttendance();
          if (!cancelled) {
            setStats({
              plan: profile.membershipPlan?.name ?? 'None',
              trainer: profile.trainer?.user
                ? fullName(profile.trainer.user)
                : 'Unassigned',
              membershipEnd: profile.membershipEnd,
              recentCheckIns: attendance.length,
            });
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

  if (loading) return <LoadingSpinner />;
  if (error) {
    return <p className="rounded-lg bg-red-500/10 p-4 text-red-400">{error}</p>;
  }

  if (user.role === ROLES.ADMIN) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Gym overview and key metrics" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardCard title="Total Members" value={stats.totalMembers} icon="👥" />
          <DashboardCard title="Active Members" value={stats.activeMembers} icon="✓" />
          <DashboardCard title="Membership Plans" value={stats.plans} icon="📋" />
          <DashboardCard title="Trainers" value={stats.trainers} icon="🏋️" />
          <DashboardCard title="Attendance Today" value={stats.checkInsToday} icon="✅" />
          <DashboardCard
            title="Revenue (period)"
            value={formatCurrency(stats.revenue)}
            subtitle={`${stats.expiring} expiring soon`}
            icon="💰"
          />
        </div>
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Payments</h2>
          <DataTable
            columns={[
              {
                key: 'member',
                label: 'Member',
                render: (r) => fullName(r.member?.user) || '—',
              },
              { key: 'plan', label: 'Plan', render: (r) => r.membershipPlan?.name ?? '—' },
              {
                key: 'amount',
                label: 'Amount',
                render: (r) => formatCurrency(r.amount),
              },
              {
                key: 'paidAt',
                label: 'Paid',
                render: (r) => formatDate(r.paidAt),
              },
            ]}
            data={recentPayments}
            emptyMessage="No recent payments"
          />
        </div>
      </div>
    );
  }

  if (user.role === ROLES.TRAINER) {
    return (
      <div>
        <PageHeader title="Trainer Dashboard" description="Your members and activity" />
        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardCard title="Assigned Members" value={stats.assignedMembers} icon="👥" />
          <DashboardCard title="Check-ins (range)" value={stats.checkInsInRange} icon="✅" />
          <DashboardCard title="Open Check-ins" value={stats.openCheckIns} icon="⏱" />
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Member activity</h2>
            <Link
              to="/members"
              className="text-sm text-teal-400 hover:text-teal-300"
            >
              View all members →
            </Link>
          </div>
          <DataTable
            columns={[
              {
                key: 'name',
                label: 'Member',
                render: (r) => fullName(r.user),
              },
              {
                key: 'plan',
                label: 'Plan',
                render: (r) => r.membershipPlan?.name ?? '—',
              },
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
                    <span className="text-amber-400">In gym</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  ),
              },
            ]}
            data={trainerMembers}
            emptyMessage="No assigned members"
          />
        </div>

        <Link
          to="/attendance"
          className="mt-6 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
        >
          Scan member QR codes
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Dashboard" description="Your membership overview" />
      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardCard title="Current Plan" value={stats.plan} icon="📋" />
        <DashboardCard title="Trainer" value={stats.trainer} icon="🏋️" />
        <DashboardCard
          title="Membership Ends"
          value={stats.membershipEnd ? formatDateShort(stats.membershipEnd) : '—'}
          icon="📅"
        />
        <DashboardCard title="Attendance Records" value={stats.recentCheckIns} icon="✅" />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/profile"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
        >
          My profile & QR code
        </Link>
        <Link
          to="/plans"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Browse plans
        </Link>
        <Link
          to="/attendance"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Attendance history
        </Link>
      </div>
    </div>
  );
}
