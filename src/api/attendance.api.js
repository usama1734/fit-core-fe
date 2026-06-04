import { apiClient } from './client.js';
import { parseListResponse } from './pagination.js';

export async function listAttendance({ page = 1, pageSize = 10, ...rest } = {}) {
  const { data } = await apiClient.get('/attendance', { params: { page, pageSize, ...rest } });
  return parseListResponse(data, { page, pageSize });
}

export async function checkIn(payload) {
  const { data } = await apiClient.post('/attendance/check-in', payload);
  return data.data;
}

export async function checkOut(id, payload = {}) {
  const { data } = await apiClient.post(`/attendance/${id}/check-out`, payload);
  return data.data;
}

export async function updateAttendance(id, payload) {
  const { data } = await apiClient.patch(`/attendance/${id}`, payload);
  return data.data;
}

export async function deleteAttendance(id) {
  const { data } = await apiClient.delete(`/attendance/${id}`);
  return data.data;
}

export async function getGymCheckInQr() {
  const { data } = await apiClient.get('/gym/check-in-qr');
  if (!data?.success) {
    throw new Error(data?.error?.message ?? 'Failed to load gym QR');
  }
  return data.data;
}

export async function regenerateGymCheckInQr() {
  const { data } = await apiClient.post('/gym/check-in-qr/regenerate');
  if (!data?.success) {
    throw new Error(data?.error?.message ?? 'Failed to regenerate gym QR');
  }
  return data.data;
}
