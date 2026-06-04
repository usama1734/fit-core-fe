import { apiClient } from './client.js';

export async function listAttendance(params = {}) {
  const { data } = await apiClient.get('/attendance', { params });
  return data.data;
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
