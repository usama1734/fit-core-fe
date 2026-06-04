import { apiClient } from '@api/client.js';
import { parseListResponse } from '@api/pagination.js';

export async function listPayments({ page = 1, pageSize = 10 } = {}) {
  const { data } = await apiClient.get('/payments', { params: { page, pageSize } });
  return parseListResponse(data, { page, pageSize });
}

export async function createCheckout(planId) {
  const { data } = await apiClient.post('/payments/checkout', { planId });
  return data.data;
}

export async function confirmCheckout(sessionId) {
  const { data } = await apiClient.post('/payments/confirm', { sessionId });
  return data.data;
}

export async function syncPayments({ page = 1, pageSize = 10 } = {}) {
  const { data } = await apiClient.post('/payments/sync', null, { params: { page, pageSize } });
  return parseListResponse(data, { page, pageSize });
}

export async function createManualPayment(payload) {
  const { data } = await apiClient.post('/payments/manual', payload);
  return data.data;
}

export async function updatePayment(id, payload) {
  const { data } = await apiClient.patch(`/payments/${id}`, payload);
  return data.data;
}
