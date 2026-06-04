import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as trainersApi from '@api/trainers.api.js';
import DataTable from '@components/ui/DataTable.jsx';
import LoadingSpinner from '@components/ui/LoadingSpinner.jsx';
import ModalForm from '@components/ui/ModalForm.jsx';
import PageHeader from '@components/ui/PageHeader.jsx';
import { usePaginatedList } from '@hooks/usePaginatedList.js';
import { getApiError } from '@api/client.js';
import { fullName } from '@utils/format.js';

export default function TrainersPage() {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(10);
  const [memberItems, setMemberItems] = useState([]);
  const [memberMeta, setMemberMeta] = useState({ total: 0, totalPages: 1 });
  const [membersLoading, setMembersLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTrainers = useCallback((params) => trainersApi.listTrainers(params), []);

  const {
    items: trainers,
    meta,
    page,
    pageSize,
    setPage,
    setPageSize,
    loading,
    error,
    setError,
    reload: loadTrainers,
  } = usePaginatedList(fetchTrainers);

  useEffect(() => {
    if (!trainerId) {
      setSelectedTrainer(null);
      return;
    }

    let cancelled = false;
    async function loadTrainer() {
      setMembersLoading(true);
      setError('');
      try {
        const trainer = await trainersApi.getTrainer(trainerId);
        if (cancelled) return;
        setSelectedTrainer(trainer);
      } catch (err) {
        if (!cancelled) setError(getApiError(err));
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }

    loadTrainer();
    return () => {
      cancelled = true;
    };
  }, [trainerId, setError]);

  useEffect(() => {
    if (!trainerId) {
      setMemberItems([]);
      return;
    }

    let cancelled = false;
    async function loadMembers() {
      setMembersLoading(true);
      try {
        const result = await trainersApi.getTrainerMembers(trainerId, {
          page: memberPage,
          pageSize: memberPageSize,
        });
        if (!cancelled) {
          setMemberItems(result.items);
          setMemberMeta(result.meta);
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err));
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [trainerId, memberPage, memberPageSize, setError]);

  const viewMembers = (trainer) => {
    navigate(`/trainers/${trainer.id}`);
  };

  const closeMembers = () => {
    navigate('/trainers');
    setMemberPage(1);
  };

  const handleCreate = async (values) => {
    setSaving(true);
    try {
      await trainersApi.createTrainer(values);
      await loadTrainers();
    } catch (err) {
      throw new Error(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => fullName(r.user) },
    { key: 'email', label: 'Email', render: (r) => r.user?.email },
    { key: 'specialty', label: 'Specialty', render: (r) => r.specialty ?? '—' },
    { key: 'count', label: 'Members', render: (r) => r._count?.members ?? 0 },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button
          type="button"
          onClick={() => viewMembers(r)}
          className="text-sm text-teal-400 hover:text-teal-300"
        >
          View members
        </button>
      ),
    },
  ];

  const memberColumns = [
    { key: 'name', label: 'Name', render: (r) => fullName(r.user) },
    { key: 'email', label: 'Email', render: (r) => r.user?.email },
    { key: 'plan', label: 'Plan', render: (r) => r.membershipPlan?.name ?? '—' },
  ];

  if (loading && trainers.length === 0) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Trainers"
        description="Manage trainers and view assigned members"
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
          >
            + Add Trainer
          </button>
        }
      />
      {error && <p className="mb-4 text-red-400">{error}</p>}
      <DataTable
        columns={columns}
        data={trainers}
        emptyMessage="No trainers"
        pagination={{
          page,
          pageSize,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />

      {selectedTrainer && (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Members — {fullName(selectedTrainer.user)}
            </h2>
            <button
              type="button"
              onClick={closeMembers}
              className="text-sm text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          {membersLoading && memberItems.length === 0 ? (
            <LoadingSpinner />
          ) : (
            <DataTable
              columns={memberColumns}
              data={memberItems}
              emptyMessage="No assigned members"
              pagination={{
                page: memberPage,
                pageSize: memberPageSize,
                total: memberMeta.total,
                totalPages: memberMeta.totalPages,
                onPageChange: setMemberPage,
                onPageSizeChange: (size) => {
                  setMemberPageSize(size);
                  setMemberPage(1);
                },
              }}
            />
          )}
        </div>
      )}

      <ModalForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Trainer"
        loading={saving}
        submitLabel="Create"
        fields={[
          { name: 'firstName', label: 'First name', required: true },
          { name: 'lastName', label: 'Last name', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'password', label: 'Password', type: 'password', required: true },
          { name: 'phone', label: 'Phone' },
          { name: 'specialty', label: 'Specialty' },
          { name: 'bio', label: 'Bio', type: 'textarea' },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}
