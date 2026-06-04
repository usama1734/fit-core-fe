import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as membersApi from '../api/members.api.js';
import * as paymentsApi from '../api/payments.api.js';
import * as plansApi from '../api/plans.api.js';
import PlanCard from '../components/plans/PlanCard.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import ModalForm from '../components/ui/ModalForm.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getApiError } from '../api/client.js';
import { formatCurrency } from '../utils/format.js';
import { ROLES } from '../utils/roles.js';

export default function PlansPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user.role === ROLES.ADMIN;
  const isMember = user.role === ROLES.MEMBER;
  const [plans, setPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [planList, profile] = await Promise.all([
        plansApi.listPlans(),
        isMember ? membersApi.getMyProfile().catch(() => null) : Promise.resolve(null),
      ]);
      setPlans(planList);
      setCurrentPlanId(profile?.membershipPlanId ?? profile?.membershipPlan?.id ?? null);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [isMember]);

  useEffect(() => {
    load();
  }, [load, location.key]);

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        description: values.description,
        price: Number(values.price),
        durationDays: Number(values.durationDays),
        features: values.features
          ? values.features.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      if (modal?.mode === 'edit') {
        await plansApi.updatePlan(modal.plan.id, payload);
      } else {
        await plansApi.createPlan(payload);
      }
      await load();
    } catch (err) {
      throw new Error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan) => {
    if (!confirm(`Deactivate plan "${plan.name}"?`)) return;
    try {
      await plansApi.deletePlan(plan.id);
      await load();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const handleSubscribe = async (plan) => {
    setCheckoutPlanId(plan.id);
    setError('');
    try {
      const session = await paymentsApi.createCheckout(plan.id);
      if (session.url) {
        window.location.href = session.url;
      } else {
        setError('No checkout URL returned. Configure Stripe on the server.');
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setCheckoutPlanId(null);
    }
  };

  const formFields = [
    { name: 'name', label: 'Name', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'price', label: 'Price (USD)', type: 'number', step: '0.01', required: true },
    { name: 'durationDays', label: 'Duration (days)', type: 'number', required: true },
    {
      name: 'features',
      label: 'Features (comma-separated)',
      hint: 'e.g. Floor access, Group classes',
    },
  ];

  const adminColumns = [
    { key: 'name', label: 'Name' },
    { key: 'price', label: 'Price', render: (r) => formatCurrency(r.price) },
    { key: 'durationDays', label: 'Days' },
    {
      key: 'features',
      label: 'Features',
      render: (r) => (r.features?.length ? r.features.join(', ') : '—'),
    },
    {
      key: 'active',
      label: 'Status',
      render: (r) => (
        <span className={r.isActive ? 'text-teal-400' : 'text-slate-500'}>
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  const activePlans = plans.filter((p) => p.isActive);

  return (
    <div>
      <PageHeader
        title="Membership Plans"
        description={
          isAdmin
            ? 'Create and manage plans'
            : isMember
              ? 'Choose a plan and pay securely with Stripe'
              : 'Available membership plans'
        }
        actions={
          isAdmin && (
            <button
              type="button"
              onClick={() => setModal({ mode: 'create' })}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
            >
              + Add Plan
            </button>
          )
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {(isAdmin ? plans : activePlans).map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={isMember && plan.id === currentPlanId}
            onSubscribe={isMember ? handleSubscribe : undefined}
            onEdit={isAdmin ? (p) => setModal({ mode: 'edit', plan: p }) : undefined}
            onDeactivate={isAdmin ? handleDelete : undefined}
            showAdminActions={isAdmin}
            checkoutLoading={checkoutPlanId === plan.id}
          />
        ))}
      </div>

      {isAdmin && plans.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-white">All plans (table)</h2>
          <DataTable columns={adminColumns} data={plans} emptyMessage="No plans" />
        </div>
      )}

      {isAdmin && (
        <ModalForm
          open={!!modal}
          onClose={() => setModal(null)}
          title={modal?.mode === 'edit' ? 'Edit Plan' : 'Create Plan'}
          loading={saving}
          initialValues={
            modal?.plan
              ? {
                  name: modal.plan.name,
                  description: modal.plan.description ?? '',
                  price: modal.plan.price,
                  durationDays: modal.plan.durationDays,
                  features: modal.plan.features?.join(', ') ?? '',
                }
              : {}
          }
          fields={formFields}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
