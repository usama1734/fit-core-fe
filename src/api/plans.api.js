import { apiClient } from './client.js';

export async function listPlans() {
  const { data } = await apiClient.get('/plans');
  return data.data;
}

export async function getPlan(id) {
  const { data } = await apiClient.get(`/plans/${id}`);
  return data.data;
}

export async function createPlan(payload) {
  const { data } = await apiClient.post('/plans', payload);
  return data.data;
}

export async function updatePlan(id, payload) {
  const { data } = await apiClient.patch(`/plans/${id}`, payload);
  return data.data;
}

export async function deletePlan(id) {
  const { data } = await apiClient.delete(`/plans/${id}`);
  return data.data;
}
