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
  const { data } = await apiClient.get('/attendance/gym-qr');
  return data.data;
}

export async function regenerateGymCheckInQr() {
  const { data } = await apiClient.post('/attendance/gym-qr/regenerate');
  return data.data;
}
