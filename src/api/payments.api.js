import { apiClient } from './client.js';

export async function listPayments() {
  const { data } = await apiClient.get('/payments');
  return data.data;
}

export async function createCheckout(planId) {
  const { data } = await apiClient.post('/payments/checkout', { planId });
  return data.data;
}

export async function confirmCheckout(sessionId) {
  const { data } = await apiClient.post('/payments/confirm', { sessionId });
  return data.data;
}

export async function syncPayments() {
  const { data } = await apiClient.post('/payments/sync');
  return data.data;
}

export async function createManualPayment(payload) {
  const { data } = await apiClient.post('/payments/manual', payload);
  return data.data;
}

export async function updatePayment(id, payload) {
  const { data } = await apiClient.patch(`/payments/${id}`, payload);
  return data.data;
}
