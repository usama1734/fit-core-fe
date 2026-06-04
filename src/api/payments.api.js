import { apiClient } from './client.js';

export async function listPayments() {
  const { data } = await apiClient.get('/payments');
  return data.data;
}

export async function createCheckout(planId, memberId) {
  const { data } = await apiClient.post('/payments/checkout', {
    planId,
    ...(memberId && { memberId }),
  });
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
