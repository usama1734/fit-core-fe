import { apiClient } from '@api/client.js';

export async function getAdminDashboard(params = {}) {
  const { data } = await apiClient.get('/dashboard/admin', { params });
  return data.data;
}

export async function getTrainerDashboard(params = {}) {
  const { data } = await apiClient.get('/dashboard/trainer', { params });
  return data.data;
}
