import { apiClient } from './client.js';
import { parseListResponse } from './pagination.js';

export async function listTrainers({ page = 1, pageSize = 10 } = {}) {
  const { data } = await apiClient.get('/trainers', { params: { page, pageSize } });
  return parseListResponse(data, { page, pageSize });
}

export async function getTrainer(id) {
  const { data } = await apiClient.get(`/trainers/${id}`);
  return data.data;
}

export async function createTrainer(payload) {
  const { data } = await apiClient.post('/trainers', payload);
  return data.data;
}

export async function updateTrainer(id, payload) {
  const { data } = await apiClient.patch(`/trainers/${id}`, payload);
  return data.data;
}

export async function getTrainerMembers(id, { page = 1, pageSize = 10 } = {}) {
  const { data } = await apiClient.get(`/trainers/${id}/members`, { params: { page, pageSize } });
  return parseListResponse(data, { page, pageSize });
}

export async function getMyAssignedMembers({ page = 1, pageSize = 10 } = {}) {
  const { data } = await apiClient.get('/trainers/me/members', { params: { page, pageSize } });
  return parseListResponse(data, { page, pageSize });
}

export async function deleteTrainer(id) {
  const { data } = await apiClient.delete(`/trainers/${id}`);
  return data.data;
}
