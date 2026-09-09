import { apiGet, apiPost } from './apiClient';
import { AuthResponse } from '../types';

export async function login(email: string, password: string):Promise<AuthResponse> {
  return await apiPost('/auth/admin-login', { email, password });
}

export async function getProfile() {
  return await apiGet('/auth/profile');
}
