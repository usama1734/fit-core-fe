import { apiClient } from '@api/client.js';
import { parseListResponse } from '@api/pagination.js';

export async function listMembers({ page = 1, pageSize = 10 } = {}) {
  const { data } = await apiClient.get('/members', { params: { page, pageSize } });
  return parseListResponse(data, { page, pageSize });
}

export async function getMember(id) {
  const { data } = await apiClient.get(`/members/${id}`);
  return data.data;
}

export async function getMyProfile() {
  const { data } = await apiClient.get('/members/me');
  return data.data;
}

export async function createMember(payload) {
  const { data } = await apiClient.post('/members', payload);
  return data.data;
}

export async function updateMember(id, payload) {
  const { data } = await apiClient.patch(`/members/${id}`, payload);
  return data.data;
}

export async function assignTrainer(id, trainerId) {
  const { data } = await apiClient.patch(`/members/${id}/assign-trainer`, { trainerId });
  return data.data;
}

export async function assignPlan(id, membershipPlanId, membershipStart) {
  const { data } = await apiClient.patch(`/members/${id}/assign-plan`, {
    membershipPlanId,
    ...(membershipStart && { membershipStart }),
  });
  return data.data;
}

export async function deleteMember(id) {
  const { data } = await apiClient.delete(`/members/${id}`);
  return data.data;
}
