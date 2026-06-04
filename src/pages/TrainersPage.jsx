import { useCallback, useEffect, useState } from 'react';
import * as trainersApi from '../api/trainers.api.js';
import DataTable from '../components/ui/DataTable.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import ModalForm from '../components/ui/ModalForm.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { getApiError } from '../api/client.js';
import { fullName } from '../utils/format.js';

export default function TrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTrainers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await trainersApi.listTrainers();
      setTrainers(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  const viewMembers = async (trainer) => {
    setSelectedTrainer(trainer);
    setMembersLoading(true);
    try {
      const members = await trainersApi.getTrainerMembers(trainer.id);
      setSelectedMembers(members);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setMembersLoading(false);
    }
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

  if (loading) return <LoadingSpinner />;

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
      <DataTable columns={columns} data={trainers} emptyMessage="No trainers" />

      {selectedTrainer && (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Members — {fullName(selectedTrainer.user)}
            </h2>
            <button
              type="button"
              onClick={() => {
                setSelectedTrainer(null);
                setSelectedMembers([]);
              }}
              className="text-sm text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          {membersLoading ? (
            <LoadingSpinner />
          ) : (
            <DataTable
              columns={memberColumns}
              data={selectedMembers}
              emptyMessage="No assigned members"
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
