import { apiClient } from './client.js';

export async function listTrainers() {
  const { data } = await apiClient.get('/trainers');
  return data.data;
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

export async function getTrainerMembers(id) {
  const { data } = await apiClient.get(`/trainers/${id}/members`);
  return data.data;
}

export async function getMyAssignedMembers() {
  const { data } = await apiClient.get('/trainers/me/members');
  return data.data;
}

export async function deleteTrainer(id) {
  const { data } = await apiClient.delete(`/trainers/${id}`);
  return data.data;
}
