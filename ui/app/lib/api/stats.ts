import { api } from './api';
import { StatsResponse } from './models/stats';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export function getStats(): Promise<StatsResponse> {
  if (!backendUrl) {
    throw new Error('VITE_BACKEND_URL is missing. Please configure the backend URL.');
  }

  return api<StatsResponse>(`${backendUrl}/stats`, {
    method: 'GET',
  });
}
