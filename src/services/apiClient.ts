export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function removeToken() {
  localStorage.removeItem('token');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(response: Response) {
  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { success: false, message: 'Invalid JSON response from server' };
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.message || data.error || `HTTP Error ${response.status}`,
      data
    };
  }
  
  return data;
}

export async function apiGet(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...getAuthHeaders()
    }
  });
  return handleResponse(res);
}

export async function apiPost(endpoint: string, body?: any) {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {
    ...getAuthHeaders()
  };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: isFormData ? body : JSON.stringify(body)
  });
  return handleResponse(res);
}

export async function apiPut(endpoint: string, body?: any) {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {
    ...getAuthHeaders()
  };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: isFormData ? body : JSON.stringify(body)
  });
  return handleResponse(res);
}

export async function apiDelete(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      ...getAuthHeaders()
    }
  });
  return handleResponse(res);
}
